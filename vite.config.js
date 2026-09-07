import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { DEFAULT_API_PORT } from './config.js'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

var __dirname = path.dirname(fileURLToPath(import.meta.url))

// Vite plugin that auto-starts the AGENTVIZ STUDIO backend in dev mode
function agentvizStudioBackend() {
  var child = null
  return {
    name: 'agentviz-studio-backend',
    configureServer: function () {
      var bin = path.join(__dirname, 'bin', 'agentviz.js')
      child = spawn(process.execPath, [bin, '--no-open'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: Object.assign({}, process.env, { FORCE_COLOR: '0' }),
      })
      child.stdout.on('data', function (d) {
        var line = d.toString().trim()
        if (line) console.log('\x1b[36m[backend]\x1b[0m ' + line)
      })
      child.stderr.on('data', function (d) {
        var line = d.toString().trim()
        if (line) console.error('\x1b[36m[backend]\x1b[0m ' + line)
      })
      child.on('exit', function (code) {
        if (code) console.error('\x1b[36m[backend]\x1b[0m exited with code ' + code)
        child = null
      })
    },
    closeBundle: function () {
      if (child) { child.kill(); child = null }
    },
  }
}

export default defineConfig(function ({ mode }) {
  var isDebugBuild = mode === 'debug'
  var isViewerBuild = mode === 'viewer'
  var viewerAliases = isViewerBuild
    ? [
        { find: './hooks/useSessionLoader.js', replacement: path.resolve(__dirname, 'src/hooks/viewer/useSessionLoader.js') },
        { find: './hooks/useDiscoveredSessions.js', replacement: path.resolve(__dirname, 'src/hooks/viewer/useDiscoveredSessions.js') },
        { find: './hooks/useLiveStream.js', replacement: path.resolve(__dirname, 'src/hooks/viewer/useLiveStream.js') },
        { find: './hooks/useQA.js', replacement: path.resolve(__dirname, 'src/hooks/viewer/useQA.js') },
        { find: './lib/sessionLibrary.js', replacement: path.resolve(__dirname, 'src/lib/viewerSessionLibrary.js') },
        { find: './components/DebriefView.jsx', replacement: path.resolve(__dirname, 'src/components/viewer/DebriefView.jsx') },
      ]
    : []

  return {
    // Use VITE_BASE_PATH env var to override the base URL for built assets.
    // Defaults to './' (relative paths) so the SPA works when served from a
    // subdirectory (e.g. static manifest mode). Set to '/' for root deployments.
    base: process.env.VITE_BASE_PATH || './',
    plugins: [
      react(),
      !isViewerBuild && agentvizStudioBackend(),
      isViewerBuild && {
        name: 'agentviz-studio-viewer-html',
        transformIndexHtml: function (html) {
          return html.replace(/\s*<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>/g, '')
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: viewerAliases,
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:' + DEFAULT_API_PORT,
          changeOrigin: true,
        },
      },
    },
    build: {
      minify: isDebugBuild ? false : 'esbuild',
      sourcemap: isDebugBuild,
    },
    define: {
      __AGENTVIZ_VIEWER_MODE__: JSON.stringify(isViewerBuild),
    },
    test: {
      alias: {
        // In Node/Vitest, Worker is unavailable; use the self-contained bundle instead
        "elkjs/lib/elk-api.js": path.resolve(__dirname, "node_modules/elkjs/lib/elk.bundled.js"),
      },
    },
  }
})
