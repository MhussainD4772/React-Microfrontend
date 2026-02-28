/**
 * Host Shell — Plain HTML + JS. No React, no Vite.
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
  bulbStateByAppId: { host: false, mfe1: false, mfe2: false },

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
    targets.forEach((id) => {
      if (this.bulbStateByAppId.hasOwnProperty(id)) this.bulbStateByAppId[id] = state;
    });
    this.broadcastBulbStateChanged(targets, state, message.correlationId);
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

async function loadRemote(name, entryUrl, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  try {
    const container = await import(/* @vite-ignore */ entryUrl);
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

  // Initial render: host bulb starts OFF (Mediator.bulbStateByAppId.host is false)
  Mediator.applyBulbStateToHostUI();

  // MFEs are deployed as separate apps; not loaded or embedded in the host page.
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}
