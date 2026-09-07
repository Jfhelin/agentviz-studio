import { theme } from "../../lib/theme.js";

export default function DebriefView() {
  return (
    <div style={{ padding: 40, color: theme.text.muted, textAlign: "center", lineHeight: 1.8 }}>
      AI Coach is available only when running the local AGENTVIZ STUDIO server.
    </div>
  );
}
