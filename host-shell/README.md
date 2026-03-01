# Host Shell

FastAPI app that serves the Host UI and loads React MFEs (mfe1/mfe2) at runtime via Module Federation. The host is plain HTML + JS only.

- **Backend:** FastAPI serves `GET /` (index.html) and `/static/*` (host.js, styles.css). CORS is enabled for the MFE dev servers (5173, 5174).

- **Frontend:** Plain HTML/CSS/JS (`app/templates/`, `app/static/`):
  - Host UI: bulb indicator and "Toggle Bulb (Host)" button.
  - Targets: checkboxes for host, mfe1, mfe2.
  - MFE slots: `#mfe1-root`, `#mfe2-root` where the remotes are mounted.

- **Loading remotes:** `host.js` (ES module) dynamically imports each remote’s `remoteEntry.js` (e.g. `http://localhost:5173/remoteEntry.js`), then calls the exposed `mount(container, props)`.

- **Mediator:** Shared state and event bus; MFEs receive `eventBus` in props and can emit/subscribe to BULB_SET_REQUEST, BULB_STATE_CHANGED, etc.

## Setup (one-time)

```bash
cd host-shell
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
cd host-shell
source .venv/bin/activate   # if not already activated
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000 . Use "Toggle Bulb (Host)" to toggle the bulb; change targets with the checkboxes.
