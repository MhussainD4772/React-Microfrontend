import { StrictMode } from "react";
import MFE1App from "./MFE1App";
import "./index.css";
import type { MountProps } from "./mountTypes";

export default function MountRoot(props: MountProps) {
  return (
    <StrictMode>
      <MFE1App
        appId={props.appId}
        version={props.version}
        initialBulbOn={props.initialState?.bulbOn ?? false}
        initialTargets={props.initialTargets}
        eventBus={props.eventBus}
      />
    </StrictMode>
  );
}
