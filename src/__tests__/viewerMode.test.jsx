// @vitest-environment jsdom

import { act } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import App from "../App.jsx";
import { resolveViewerMode } from "../lib/viewerMode.js";

var VSCODE_EXPORT = readFileSync(
  resolve(process.cwd(), "src/__tests__/fixtures/copilot-chat-export-minimal.json"),
  "utf8"
);

async function sleep(ms) {
  await act(async function () {
    await new Promise(function (done) { setTimeout(done, ms); });
  });
}

async function waitFor(check, message) {
  var start = Date.now();
  while (Date.now() - start < 3000) {
    var result = check();
    if (result) return result;
    await sleep(20);
  }
  throw new Error(message || "Timed out waiting for condition");
}

function findByText(container, text) {
  return Array.from(container.querySelectorAll("*")).find(function (node) {
    return node.textContent && node.textContent.includes(text);
  }) || null;
}

describe("hosted viewer mode", function () {
  var storage;
  var fetchMock;
  var eventSourceMock;

  beforeEach(function () {
    storage = {};
    fetchMock = vi.fn(function () {
      return Promise.reject(new Error("viewer mode must not fetch"));
    });
    eventSourceMock = vi.fn();

    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    global.fetch = fetchMock;
    global.EventSource = eventSourceMock;
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    global.localStorage = {
      getItem: vi.fn(function (key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      }),
      setItem: vi.fn(function (key, value) { storage[key] = String(value); }),
      removeItem: vi.fn(function (key) { delete storage[key]; }),
      clear: vi.fn(function () { storage = {}; }),
    };
    document.body.innerHTML = "";
  });

  afterEach(function () {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("resolves explicit viewer build flags", function () {
    expect(resolveViewerMode({ MODE: "viewer" })).toBe(true);
    expect(resolveViewerMode({ MODE: "production", VITE_VIEWER_MODE: "true" })).toBe(true);
    expect(resolveViewerMode({ MODE: "production" })).toBe(false);
  });

  it("imports a VS Code export without backend calls or session persistence", async function () {
    var container = document.createElement("div");
    document.body.appendChild(container);
    var root = createRoot(container);

    await act(async function () {
      root.render(<App viewerMode={true} />);
    });

    expect(findByText(container, "Private, browser-local session analysis.")).toBeTruthy();
    expect(findByText(container, "does not upload imported session content")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(eventSourceMock).not.toHaveBeenCalled();

    var input = container.querySelector('input[type="file"]');
    var file = new File([VSCODE_EXPORT], "copilot-chat-export.json", { type: "application/json" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });

    await act(async function () {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await waitFor(function () {
      return findByText(container, "copilot-chat-export.json");
    }, "expected imported viewer session to render");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(eventSourceMock).not.toHaveBeenCalled();
    expect(Array.from(container.querySelectorAll("button")).some(function (button) {
      return button.textContent.trim() === "Coach";
    })).toBe(false);
    expect(Object.keys(storage).some(function (key) {
      return key.indexOf("agentviz:session-library") === 0 || key.indexOf("agentviz:session-content") === 0;
    })).toBe(false);

    await act(async function () {
      root.unmount();
    });
    container.remove();
  });
});
