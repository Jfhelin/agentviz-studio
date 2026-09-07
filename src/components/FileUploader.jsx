import { useState, useRef } from "react";
import { theme, alpha } from "../lib/theme.js";
import Icon from "./Icon.jsx";

export default function FileUploader({ onLoad }) {
  var ref = useRef(null);
  var [over, setOver] = useState(false);

  var [readError, setReadError] = useState(null);

  function handleFile(file) {
    if (!file) {
      return;
    }
    if (file.size === 0) {
      setReadError("File is empty (0 bytes): " + file.name);
      return;
    }
    setReadError(null);
    var reader = new FileReader();
    reader.onload = function (e) {
      var text = e.target.result;
      onLoad(text, file.name);
    };
    reader.onerror = function (err) {
      setReadError("Could not read file: " + file.name + " (" + (reader.error && reader.error.name) + ")");
    };
    reader.onabort = function () {
      setReadError("File read was aborted: " + file.name);
    };
    reader.readAsText(file);
  }

  return (
    <div
      onDragOver={function (e) { e.preventDefault(); setOver(true); }}
      onDragLeave={function () { setOver(false); }}
      onDrop={function (e) {
        e.preventDefault();
        setOver(false);
        var dt = e.dataTransfer;
        var files = dt && dt.files ? dt.files : null;
        var items = dt && dt.items ? dt.items : null;
        if (!files || files.length === 0) {
          setReadError("Drop did not contain a file. (Some sources, like Outlook attachments or browser tabs, deliver a URL instead. Try saving the file to disk first.)");
          return;
        }
        handleFile(files[0]);
      }}
      onClick={function () { ref.current && ref.current.click(); }}
      style={{
        border: "2px dashed " + (over ? theme.accent.primary : theme.border.strong),
        borderRadius: theme.radius.xxl, padding: "48px 32px", textAlign: "center",
        cursor: "pointer", background: over ? alpha(theme.accent.primary, 0.03) : theme.bg.surface,
        transition: "background " + theme.transition.smooth + ", border-color " + theme.transition.smooth, maxWidth: 560, margin: "0 auto",
      }}
    >
      <input
        ref={ref} type="file" accept=".jsonl,.json,.txt"
        style={{ display: "none" }}
        onChange={function (e) {
          var f = e.target.files && e.target.files[0];
          handleFile(f);
        }}
      />
      <div style={{
        fontSize: theme.fontSize.hero, marginBottom: 12, color: theme.accent.primary,
        transition: "transform " + theme.transition.smooth,
        transform: over ? "scale(1.1)" : "scale(1)",
      }}><Icon name="upload" size={32} /></div>
      <div style={{ fontSize: theme.fontSize.xl, color: theme.text.primary, marginBottom: 8, fontWeight: 600 }}>
        Drop a session file here
      </div>
      <div style={{ fontSize: theme.fontSize.md, color: theme.text.muted, lineHeight: 1.8 }}>
        VS Code Copilot Chat, Claude Code, and Copilot CLI sessions
        <br />
        <span style={{ color: theme.text.dim, fontSize: theme.fontSize.base }}>
          Also accepts .json and .txt
        </span>
      </div>
      {readError && (
        <div style={{ marginTop: 12, fontSize: theme.fontSize.base, color: theme.semantic.error, lineHeight: 1.5 }}>
          {readError}
        </div>
      )}
    </div>
  );
}
