# Host Shell

FastAPI app that serves the Host UI and will later load React MFEs (mfe1/mfe2) via Module Federation.

## Phase 1 (current)

- **Backend:** FastAPI serves `GET /` (index.html) and `/static/*` (host.js, styles.css). CORS is enabled for `http://localhost:5173` and `http://localhost:5174` (future MFE dev servers).
- **Frontend:** Plain HTML/CSS/JS with:
  - Host UI: bulb indicator (on/off) and "Toggle Bulb (Host)" button.
  - Targets: checkboxes for host, mfe1, mfe2 (default all checked).
  - Placeholder divs for MFE mount points: `#mfe1-root`, `#mfe2-root`.
- **Mediator (in host.js):** Stub with shared state (`bulbStateByAppId`, `activeTargets`) and event handlers for `BULB_SET_REQUEST`, `BULB_STATE_CHANGED`, `TARGETS_SET_REQUEST`, `TARGETS_CHANGED`. Only the host UI talks to the mediator in Phase 1; no Module Federation or MFEs yet.

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
