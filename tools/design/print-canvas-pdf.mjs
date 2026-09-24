// Print a Claude Design canvas page to a PDF, one PDF page per `.dv-turn` section.
//
// Usage:
//   PAGE_URL='<serve_url from Claude Design render_preview>' \
//   OUT=docs/design/<name>.pdf \
//   node tools/design/print-canvas-pdf.mjs
//
// PAGE_URL embeds a short-lived, project-scoped token: pass it through the environment
// only, never commit it. Requires Google Chrome and Node >= 22 (global WebSocket).
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;
const WIDTH = 1500; // wide enough for three 410 px phone frames per row
const RENDER_WAIT_MS = 9000; // dc-runtime + fonts + images

const url = process.env.PAGE_URL;
const out = process.env.OUT;
if (!url || !out) {
  console.error("PAGE_URL and OUT are required");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "canvas-pdf-"))}`,
    "--no-first-run",
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" });
      target = await res.json();
    } catch {
      // Chrome not listening yet.
    }
  }
  if (!target) throw new Error("Chrome DevTools endpoint never came up");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url });
  await sleep(RENDER_WAIT_MS);

  const { result } = await send("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `(async () => {
      if (document.fonts) await document.fonts.ready;
      const style = document.createElement('style');
      style.textContent = '.dv-turn{break-after:page;break-inside:avoid;border-bottom:0}'
        + ' .dv-next{display:none}';
      document.head.appendChild(style);
      const heights = [...document.querySelectorAll('.dv-turn')]
        .map((s) => Math.ceil(s.getBoundingClientRect().height));
      return { heights, width: document.documentElement.scrollWidth };
    })()`,
  });
  const { heights, width } = result.value;
  if (!heights.length) throw new Error("No .dv-turn sections found: page not rendered?");

  const pageHeight = Math.max(...heights) + 40;
  const pdf = await send("Page.printToPDF", {
    printBackground: true,
    paperWidth: Math.max(width, WIDTH) / 96,
    paperHeight: pageHeight / 96,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    preferCSSPageSize: false,
  });
  writeFileSync(out, Buffer.from(pdf.data, "base64"));
  console.log(JSON.stringify({ sections: heights, width, pageHeight, out }));
  ws.close();
} finally {
  chrome.kill();
}
