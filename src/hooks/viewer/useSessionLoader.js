import { useState, useEffect, useRef, useCallback } from "react";
import { SAMPLE_EVENTS, SAMPLE_TOTAL, SAMPLE_TURNS, SAMPLE_METADATA, MULTIAGENT_SAMPLE_EVENTS, MULTIAGENT_SAMPLE_TOTAL, MULTIAGENT_SAMPLE_TURNS, MULTIAGENT_SAMPLE_METADATA } from "../../lib/constants.js";
import { buildAppliedSession, parseSessionText } from "../../lib/sessionParsing";

export default function useSessionLoader(options) {
  var onSessionParsed = options ? options.onSessionParsed : null;
  var [events, setEvents] = useState(null);
  var [turns, setTurns] = useState([]);
  var [metadata, setMetadata] = useState(null);
  var [total, setTotal] = useState(0);
  var [file, setFile] = useState("");
  var [error, setError] = useState(null);
  var [loading, setLoading] = useState(false);
  var [showHero, setShowHero] = useState(false);
  var parseTimeoutRef = useRef(null);
  var requestIdRef = useRef(0);
  var rawTextRef = useRef("");

  var handleFile = useCallback(function (text, name) {
    requestIdRef.current += 1;
    var requestId = requestIdRef.current;

    if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current);

    rawTextRef.current = text;
    setError(null);
    setLoading(true);

    parseTimeoutRef.current = setTimeout(function () {
      parseTimeoutRef.current = null;
      var parsed = parseSessionText(text);
      if (requestId !== requestIdRef.current) return;

      setLoading(false);
      if (!parsed.result) {
        setError(parsed.error);
        return;
      }

      var applied = buildAppliedSession(parsed.result, name);
      setEvents(applied.events);
      setTurns(applied.turns);
      setMetadata(applied.metadata);
      setTotal(applied.total);
      setFile(applied.file);
      setError(applied.error);
      setShowHero(applied.showHero);

      if (typeof onSessionParsed === "function") {
        onSessionParsed(parsed.result, name, text);
      }
    }, 16);
  }, [onSessionParsed]);

  var loadSample = useCallback(function (mode) {
    requestIdRef.current += 1;
    if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current);

    var isMultiAgent = mode === "multiagent";
    rawTextRef.current = "";
    setEvents(isMultiAgent ? MULTIAGENT_SAMPLE_EVENTS : SAMPLE_EVENTS);
    setTurns(isMultiAgent ? MULTIAGENT_SAMPLE_TURNS : SAMPLE_TURNS);
    setMetadata(isMultiAgent ? MULTIAGENT_SAMPLE_METADATA : SAMPLE_METADATA);
    setTotal(isMultiAgent ? MULTIAGENT_SAMPLE_TOTAL : SAMPLE_TOTAL);
    setFile(isMultiAgent ? "multiagent-demo.jsonl" : "demo-session.jsonl");
    setError(null);
    setLoading(false);
    setShowHero(true);
  }, []);

  var resetSession = useCallback(function () {
    requestIdRef.current += 1;
    if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current);
    rawTextRef.current = "";
    setEvents(null);
    setTurns([]);
    setMetadata(null);
    setTotal(0);
    setFile("");
    setError(null);
    setLoading(false);
    setShowHero(false);
  }, []);

  useEffect(function () {
    var embeddedSession = window.__AGENTVIZ_SESSION__;
    if (!embeddedSession || !embeddedSession.text) return;
    delete window.__AGENTVIZ_SESSION__;
    handleFile(embeddedSession.text, embeddedSession.name || "session.jsonl");
  }, [handleFile]);

  useEffect(function () {
    return function () {
      requestIdRef.current += 1;
      if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current);
    };
  }, []);

  return {
    events: events,
    turns: turns,
    metadata: metadata,
    total: total,
    file: file,
    error: error,
    loading: loading,
    showHero: showHero,
    isLive: false,
    handleFile: handleFile,
    appendLines: function () {},
    loadSample: loadSample,
    resetSession: resetSession,
    dismissHero: function () { setShowHero(false); },
    getRawText: function () { return rawTextRef.current; },
  };
}
