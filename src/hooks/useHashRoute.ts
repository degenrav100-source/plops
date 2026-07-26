import { useEffect, useState } from "react";

export type Route = "app" | "docs";

export interface RouteState {
  route: Route;
  /** anchor inside the route, e.g. `#/docs/deploy` → `deploy` */
  section: string | null;
}

function parse(): RouteState {
  const hash = window.location.hash;
  if (!hash.startsWith("#/docs")) return { route: "app", section: null };
  const section = hash.slice("#/docs".length).replace(/^\//, "");
  return { route: "docs", section: section || null };
}

export function useHashRoute(): RouteState {
  const [state, setState] = useState<RouteState>(parse);

  useEffect(() => {
    const onChange = () => setState(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return state;
}

export function navigate(hash: string) {
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = hash;
}

/** Go back to the launchpad and scroll to a section of it. */
export function goHome(elementId?: string) {
  if (window.location.hash.startsWith("#/docs")) {
    navigate("#/");
    if (elementId) {
      // the launchpad mounts on the next render, so wait for it before scrolling
      window.setTimeout(() => {
        document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
    return;
  }
  if (elementId) document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
