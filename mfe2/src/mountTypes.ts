export type MountProps = {
  appId: "mfe2";
  version: "1.0.0";
  initialState?: { bulbOn?: boolean };
  eventBus?: {
    emit: (msg: unknown) => void;
    on: (type: string, handler: (msg: unknown) => void) => () => void;
  };
};
