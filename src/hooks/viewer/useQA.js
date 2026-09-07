import { useCallback, useState } from "react";
import { classify } from "../../lib/qaClassifier.js";

var messageId = 0;

export default function useQA(sessionData) {
  var [messages, setMessages] = useState([]);

  var ask = useCallback(function (question) {
    if (!question || !question.trim()) return;
    var normalized = question.trim();
    var result = classify(normalized, sessionData);
    var answer = result.tier === "instant"
      ? result.answer
      : "Model-backed Q&A is available only when running the local AGENTVIZ STUDIO server.";

    setMessages(function (previous) {
      return previous.concat(
        { id: "viewer-qa-" + (++messageId), role: "user", content: normalized },
        { id: "viewer-qa-" + (++messageId), role: "assistant", content: answer, instant: true }
      );
    });
  }, [sessionData]);

  return {
    messages: messages,
    isStreaming: false,
    streamingStatus: null,
    error: null,
    ask: ask,
    abort: function () {},
    clear: function () { setMessages([]); },
  };
}
