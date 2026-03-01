/**
 * MFE3 — Web Component (Custom Element) version of the same bulb UI as MFE1/MFE2.
 *
 * HOW WEB COMPONENTS WORK HERE:
 * 1. We extend HTMLElement and register with customElements.define('mfe3-bulb', Mfe3Bulb).
 * 2. Shadow DOM gives us a scoped subtree: styles and DOM don't leak out or in.
 * 3. The host doesn't call mount() — it creates <mfe3-bulb>, appends it, then sets
 *    properties (eventBus, appId, initialState, initialTargets). We react in setters.
 * 4. Same event contract: we emit BULB_SET_REQUEST and subscribe to BULB_STATE_CHANGED.
 */

const CONTRACT_VERSION = '1.0.0';
const TARGET_IDS = ['host', 'mfe1', 'mfe2', 'mfe3'];
const TARGET_LABELS = { host: 'Host', mfe1: 'MFE1', mfe2: 'MFE2', mfe3: 'MFE3' };

function generateCorrelationId() {
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class Mfe3Bulb extends HTMLElement {
  constructor() {
    super();
    // Shadow DOM: encapsulated DOM and CSS. Host page styles don't affect us, our styles don't affect host.
    this._shadow = this.attachShadow({ mode: 'open' });
    this._unsub = null;
    this._state = {
      appId: 'mfe3',
      version: CONTRACT_VERSION,
      bulbOn: false,
      selectedTargets: ['mfe3'],
      pulse: false,
    };
  }

  // ——— Host passes these after appending the element (e.g. el.eventBus = bus) ———
  set eventBus(bus) {
    this._eventBus = bus;
    this._subscribe();
  }

  set appId(id) {
    this._state.appId = id || 'mfe3';
  }

  set initialState(state) {
    if (state && typeof state.bulbOn === 'boolean') this._state.bulbOn = state.bulbOn;
    this._renderBulb();
  }

  set initialTargets(targets) {
    if (Array.isArray(targets)) this._state.selectedTargets = [...targets];
    this._renderTargets();
  }

  connectedCallback() {
    // Build UI once when the element is inserted into the document.
    this._render();
  }

  disconnectedCallback() {
    if (this._unsub) this._unsub();
    this._unsub = null;
  }

  _subscribe() {
    if (this._unsub) this._unsub();
    if (!this._eventBus?.on) return;
    this._unsub = this._eventBus.on('BULB_STATE_CHANGED', (msg) => {
      if (msg?.targets?.includes(this._state.appId)) {
        this._state.bulbOn = !!msg.state;
        this._state.pulse = true;
        this._renderBulb();
        setTimeout(() => {
          this._state.pulse = false;
          this._renderBulb();
        }, 500);
      }
    });
  }

  _render() {
    const root = this._shadow;
    root.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = `
      :host { display: block; }
      .card { width: 100%; max-width: 28rem; margin: 0 auto; padding: 1.5rem; min-height: 280px; box-sizing: border-box; }
      .title { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #4f46e5; margin: 0 0 1rem; }
      .bulb-wrap { display: flex; justify-content: center; margin-bottom: 1.25rem; }
      .bulb { width: 4rem; height: 4rem; border-radius: 50%; border: 4px solid #94a3b8; transition: background 0.3s, border-color 0.3s, box-shadow 0.3s, transform 0.3s; }
      .bulb.off { background: #94a3b8; border-color: #64748b; box-shadow: none; }
      .bulb.on { background: #f59e0b; border-color: #d97706; box-shadow: 0 0 28px rgba(245,158,11,0.6); }
      .bulb.pulse { animation: pulse 0.5s ease; }
      @keyframes pulse { 0%,100%{ transform: scale(1); } 35%{ transform: scale(1.1); } 70%{ transform: scale(1.02); } }
      .btn { display: block; width: 100%; padding: 0.75rem 1rem; margin-bottom: 1.25rem; font-size: 1rem; font-weight: 600; color: #fff; background: linear-gradient(135deg, #6366f1, #4f46e5); border: none; border-radius: 0.75rem; cursor: pointer; }
      .btn:hover { background: linear-gradient(135deg, #4f46e5, #4338ca); }
      .btn:active { transform: scale(0.98); }
      .targets-caption { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; margin-bottom: 0.75rem; display: block; }
      .targets { display: flex; flex-direction: column; gap: 0.5rem; }
      .row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; cursor: pointer; border-radius: 0.5rem; }
      .row:hover { background: rgba(241,245,249,0.8); }
      .row input { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
      .track { display: block; width: 48px; height: 26px; min-width: 48px; border-radius: 13px; background: #cbd5e1; position: relative; flex-shrink: 0; }
      .track::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: transform 0.25s; }
      .row input:checked + .track { background: #6366f1; }
      .row input:checked + .track::after { transform: translateX(22px); }
      .label { font-size: 0.9375rem; font-weight: 500; color: #334155; }
      .meta { margin-top: 1rem; font-size: 0.75rem; color: #94a3b8; }
    `;
    root.appendChild(style);

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h2 class="title">MFE3</h2>
      <div class="bulb-wrap">
        <div class="bulb off" id="wc-bulb" role="img" aria-label="Bulb off"></div>
      </div>
      <button type="button" class="btn" id="wc-toggle">Toggle Targets</button>
      <span class="targets-caption">Select which apps to turn on/off when you toggle</span>
      <div class="targets" id="wc-targets"></div>
      <p class="meta" id="wc-meta">appId: mfe3 · version: 1.0.0</p>
    `;
    root.appendChild(card);

    const bulbEl = root.querySelector('#wc-bulb');
    const toggleBtn = root.querySelector('#wc-toggle');
    const targetsEl = root.querySelector('#wc-targets');

    this._bulbEl = bulbEl;
    this._targetsEl = targetsEl;

    toggleBtn.addEventListener('click', () => this._onToggle());
    this._renderBulb();
    this._renderTargets();
  }

  _renderBulb() {
    if (!this._bulbEl) return;
    const on = this._state.bulbOn;
    this._bulbEl.classList.toggle('on', on);
    this._bulbEl.classList.toggle('off', !on);
    this._bulbEl.classList.toggle('pulse', this._state.pulse);
    this._bulbEl.setAttribute('aria-label', on ? 'Bulb on' : 'Bulb off');
  }

  _renderTargets() {
    if (!this._targetsEl) return;
    this._targetsEl.innerHTML = '';
    TARGET_IDS.forEach((id) => {
      const label = document.createElement('label');
      label.className = 'row';
      const checked = this._state.selectedTargets.includes(id);
      label.innerHTML = `
        <input type="checkbox" data-target="${id}" ${checked ? 'checked' : ''} />
        <span class="track"></span>
        <span class="label">${TARGET_LABELS[id] || id}</span>
      `;
      label.querySelector('input').addEventListener('change', (e) => {
        const v = e.target.dataset.target;
        const checked = e.target.checked;
        if (checked) {
          if (!this._state.selectedTargets.includes(v)) this._state.selectedTargets.push(v);
        } else {
          this._state.selectedTargets = this._state.selectedTargets.filter((x) => x !== v);
        }
        this._state.selectedTargets.sort();
      });
      this._targetsEl.appendChild(label);
    });
  }

  _onToggle() {
    if (!this._eventBus?.emit) return;
    const nextState = !this._state.bulbOn;
    this._eventBus.emit({
      type: 'BULB_SET_REQUEST',
      version: CONTRACT_VERSION,
      source: this._state.appId,
      targets: this._state.selectedTargets.slice(),
      payload: { state: nextState },
      correlationId: generateCorrelationId(),
    });
  }
}

// Register the custom element so <mfe3-bulb> is recognized by the browser.
if (typeof customElements !== 'undefined' && !customElements.get('mfe3-bulb')) {
  customElements.define('mfe3-bulb', Mfe3Bulb);
}
