/**
 * Host Shell — Plain HTML + JS.
 * Loads React MFEs at runtime via dynamic import(remoteEntry.js) and mount().
 */

function generateCorrelationId() {
  return 'corr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

// ——— Event bus: MFEs subscribe here; Mediator pushes broadcasts here ———

const HostEventBus = {
  _listeners: {},
  on(type, handler) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(handler);
    return () => {
      this._listeners[type] = this._listeners[type].filter((h) => h !== handler);
    };
  },
  dispatch(msg) {
    (this._listeners[msg.type] || []).forEach((h) => h(msg));
  },
  getEventBusForMfe() {
    return {
      emit: (msg) => Mediator.dispatchEventToMediator(msg),
      on: (type, handler) => this.on(type, handler),
    };
  },
};

const Mediator = {
  bulbStateByAppId: { host: false, mfe1: false, mfe2: false, mfe3: false },

  getTargetsFromUI() {
    const checkboxes = document.querySelectorAll('.app-card--host input[name="target"]:checked');
    return Array.from(checkboxes).map((el) => el.value);
  },

  applyBulbStateToHostUI() {
    const bulb = document.getElementById('bulb');
    if (!bulb) return;
    const on = this.bulbStateByAppId.host;
    bulb.classList.toggle('on', on);
    bulb.classList.toggle('off', !on);
    bulb.classList.remove('bulb--pulse');
    bulb.offsetHeight; // reflow
    bulb.classList.add('bulb--pulse');
    setTimeout(() => bulb.classList.remove('bulb--pulse'), 500);
  },

  dispatchEventToMediator(message) {
    if (message.type === 'BULB_SET_REQUEST') this.handleBulbSetRequest(message);
  },

  handleBulbSetRequest(message) {
    const { targets, payload } = message;
    const state = !!payload?.state;
    const validTargets = Array.isArray(targets)
      ? targets.filter((id) => this.bulbStateByAppId.hasOwnProperty(id))
      : [];
    validTargets.forEach((id) => {
      this.bulbStateByAppId[id] = state;
    });
    this.broadcastBulbStateChanged(validTargets, state, message.correlationId);
  },

  broadcastBulbStateChanged(targets, state, correlationId) {
    const msg = {
      type: 'BULB_STATE_CHANGED',
      version: '1.0.0',
      targets,
      state,
      correlationId,
    };
    if (targets.includes('host')) this.applyBulbStateToHostUI();
    HostEventBus.dispatch(msg);
  },
};

// ——— Load remote MFEs via Module Federation (no host bundler) ———

const REMOTES = {
  mfe1: 'http://localhost:5173/remoteEntry.js',
  mfe2: 'http://localhost:5174/remoteEntry.js',
};
// MFE3 is a Web Component: load script, then create <mfe3-bulb> (no Module Federation).
const MFE3_SCRIPT = 'http://localhost:5175/src/main.js';

async function loadRemote(name, entryUrl, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  try {
    // MFE3: Web Component — load script then create <mfe3-bulb> and set props (no mount()).
    if (name === 'mfe3') {
      await loadScript(MFE3_SCRIPT);
      await customElements.whenDefined('mfe3-bulb');
      el.innerHTML = '';
      const wc = document.createElement('mfe3-bulb');
      wc.appId = 'mfe3';
      wc.initialState = { bulbOn: !!Mediator.bulbStateByAppId.mfe3 };
      wc.initialTargets = ['mfe3'];
      wc.eventBus = HostEventBus.getEventBusForMfe();
      el.appendChild(wc);
      return;
    }
    const container = await import( entryUrl);
    if (typeof container.get !== 'function') {
      el.innerHTML = `<p class="slot-error">${name}: invalid remote (no get)</p>`;
      return;
    }
    const factory = await container.get('./mount');
    const raw = typeof factory === 'function' ? factory() : factory;
    const mod = raw && typeof raw.then === 'function' ? await raw : raw;
    const mountFn = mod?.default?.mount ?? mod?.mount;
    if (typeof mountFn !== 'function') {
      el.innerHTML = `<p class="slot-error">${name}: no mount export</p>`;
      return;
    }
    const appId = name;
    const eventBus = HostEventBus.getEventBusForMfe();
    const initialState = { bulbOn: !!Mediator.bulbStateByAppId[appId] };
    const initialTargets = [appId]; // each MFE defaults to only itself
    mountFn(el, {
      appId,
      version: '1.0.0',
      initialState,
      initialTargets,
      eventBus,
    });
  } catch (err) {
    el.innerHTML = `<p class="slot-error">${name}: ${err?.message ?? String(err)}</p>`;
    console.error(`Host: failed to load ${name}`, err);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// ——— Host UI wiring ———

async function init() {
  const toggleBtn = document.getElementById('toggle-bulb');

  // Host listens for BULB_STATE_CHANGED and updates only the host bulb when "host" is in targets
  HostEventBus.on('BULB_STATE_CHANGED', (msg) => {
    if (msg.targets && msg.targets.includes('host')) {
      Mediator.bulbStateByAppId.host = msg.state;
      Mediator.applyBulbStateToHostUI();
    }
  });

  toggleBtn.addEventListener('click', () => {
    const targets = Mediator.getTargetsFromUI();
    const nextState = !Mediator.bulbStateByAppId.host;
    const correlationId = generateCorrelationId();
    Mediator.dispatchEventToMediator({
      type: 'BULB_SET_REQUEST',
      version: '1.0.0',
      source: 'host',
      targets,
      payload: { state: nextState },
      correlationId,
    });
  });

  // Initial render: host bulb starts OFF
  Mediator.applyBulbStateToHostUI();

  // ----- Modal: open/close and lazy-load MFEs -----
  const loadedMfes = new Set();

  function openModal(name) {
    const modal = document.getElementById(`modal-${name}`);
    if (!modal) return;
    modal.removeAttribute('hidden');
    modal.classList.add('is-open');
    if (!loadedMfes.has(name)) {
      loadedMfes.add(name);
      const remotes = { mfe1: REMOTES.mfe1, mfe2: REMOTES.mfe2, mfe3: MFE3_SCRIPT };
      const entry = name === 'mfe3' ? MFE3_SCRIPT : remotes[name];
      loadRemote(name, entry, `${name}-root`);
    }
  }

  function closeModal(name) {
    const modal = document.getElementById(`modal-${name}`);
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('hidden', '');
  }

  document.querySelectorAll('.btn-open-mfe').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.open));
  });

  document.querySelectorAll('.modal__close').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll('.modal__backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', () => {
      const modal = backdrop.closest('.modal');
      if (modal) closeModal(modal.id.replace('modal-', ''));
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}
