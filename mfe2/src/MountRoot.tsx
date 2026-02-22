import { StrictMode } from "react";
import MFE2App from "./MFE2App";
import "./index.css";
import "./App.css";
import type { MountProps } from "./mountTypes";

export default function MountRoot(props: MountProps) {
  return (
    <StrictMode>
      <MFE2App
        appId={props.appId}
        version={props.version}
        initialBulbOn={props.initialState?.bulbOn ?? false}
        eventBus={props.eventBus}
      />
    </StrictMode>
  );
}
