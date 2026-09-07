import { useCallback } from "react";

export default function useDiscoveredSessions() {
  var unavailable = useCallback(function () {
    return Promise.reject(new Error("Session discovery is available only when running the local AGENTVIZ STUDIO server."));
  }, []);

  return {
    sessions: [],
    loading: false,
    available: false,
    manifestError: null,
    isManifestMode: false,
    fetchSessionContent: unavailable,
    refresh: function () { return Promise.resolve(); },
  };
}
