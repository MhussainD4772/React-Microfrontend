/**
 * Host Shell — Mediator stub and Host UI logic (Phase 1, no Module Federation).
 */

function generateCorrelationId() {
  return 'corr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

const Mediator = {
  bulbStateByAppId: { host: false, mfe1: false, mfe2: false },
  activeTargets: ['host', 'mfe1', 'mfe2'],

  getTargetsFromUI() {
    const checkboxes = document.querySelectorAll('input[name="target"]:checked');
    return Array.from(checkboxes).map((el) => el.value);
  },

  setTargetsInUI(targets) {
    document.querySelectorAll('input[name="target"]').forEach((el) => {
      el.checked = targets.includes(el.value);
    });
    this.activeTargets = targets.slice();
  },

  applyBulbStateToHostUI() {
    const bulb = document.getElementById('bulb');
    if (!bulb) return;
    const on = this.bulbStateByAppId.host;
    bulb.classList.toggle('on', on);
    bulb.classList.toggle('off', !on);
  },

  dispatchEventToMediator(message) {
    if (message.type === 'BULB_SET_REQUEST') this.handleBulbSetRequest(message);
    else if (message.type === 'TARGETS_SET_REQUEST') this.handleTargetsSetRequest(message);
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
    // Phase 1: only host consumes; update host UI if host is in targets
    if (targets.includes('host')) this.applyBulbStateToHostUI();
    // Later: dispatch to MFEs via postMessage or custom events
  },

  handleTargetsSetRequest(message) {
    this.activeTargets = Array.isArray(message.targets) ? message.targets.slice() : [];
    this.broadcastTargetsChanged(this.activeTargets);
  },

  broadcastTargetsChanged(targets) {
    const msg = { type: 'TARGETS_CHANGED', targets };
    this.setTargetsInUI(targets);
    // Later: notify MFEs
  },
};

// ——— Host UI wiring ———

function init() {
  const toggleBtn = document.getElementById('toggle-bulb');
  const targetInputs = document.querySelectorAll('input[name="target"]');

  toggleBtn.addEventListener('click', () => {
    const targets = Mediator.getTargetsFromUI();
    const newState = !Mediator.bulbStateByAppId.host;
    const correlationId = generateCorrelationId();
    Mediator.dispatchEventToMediator({
      type: 'BULB_SET_REQUEST',
      version: '1.0.0',
      source: 'host',
      targets,
      payload: { state: newState },
      correlationId,
    });
  });

  targetInputs.forEach((el) => {
    el.addEventListener('change', () => {
      const targets = Mediator.getTargetsFromUI();
      Mediator.dispatchEventToMediator({
        type: 'TARGETS_SET_REQUEST',
        source: 'host',
        targets,
      });
    });
  });

  Mediator.applyBulbStateToHostUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
