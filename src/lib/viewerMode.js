export function resolveViewerMode(env) {
  var source = env || {};
  if (typeof __AGENTVIZ_VIEWER_MODE__ !== "undefined" && __AGENTVIZ_VIEWER_MODE__) return true;
  return source.MODE === "viewer" || source.VITE_VIEWER_MODE === "true";
}

export var VIEWER_MODE = resolveViewerMode(import.meta.env);
