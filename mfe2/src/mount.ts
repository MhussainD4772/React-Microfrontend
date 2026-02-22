import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import MountRoot from "./MountRoot";
import type { MountProps } from "./mountTypes";

export type { MountProps };

const roots = new WeakMap<HTMLElement, Root>();

function clearRoot(container: HTMLElement): void {
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
}

/**
 * Mount MFE2 into the given container.
 * Returns an object with unmount() for cleanup.
 * Safe to call multiple times (unmount first if re-mounting the same container).
 */
export function mount(
  container: HTMLElement,
  props: MountProps,
): { unmount: () => void } {
  clearRoot(container);
  const root = createRoot(container);
  roots.set(container, root);
  root.render(createElement(MountRoot, props));

  return {
    unmount() {
      unmountMount(container);
    },
  };
}

/**
 * Unmount MFE2 from the given container.
 * Safe to call multiple times.
 */
export function unmount(container: HTMLElement): void {
  unmountMount(container);
}

function unmountMount(container: HTMLElement): void {
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
}

export const CONTRACT_VERSION = "1.0.0";
