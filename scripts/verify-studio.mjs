import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const debugPort = 12319;
const baseUrl = "http://127.0.0.1:12314/";
const vehicle = process.argv[2] ?? "mustang";
const viewportWidth = Number(process.argv[3] ?? 1536);
const viewportHeight = Number(process.argv[4] ?? 900);
const screenshotSuffix = viewportWidth === 1536 && viewportHeight === 900 ? "" : `-${viewportWidth}x${viewportHeight}`;
const vehicleIndex = { mustang: 0, tesla: 1, concept: 2 }[vehicle];
if (vehicleIndex === undefined) throw new Error(`Unknown vehicle: ${vehicle}`);

const target = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(baseUrl)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const events = [];
let commandId = 0;

socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  } else if (message.method === "Runtime.exceptionThrown" || message.method === "Log.entryAdded") {
    events.push(message.params);
  }
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const screenshot = async (name) => {
  const capture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const directory = path.resolve("/private/tmp/formdrive-qa");
  await mkdir(directory, { recursive: true });
  const filename = path.join(directory, name);
  await writeFile(filename, Buffer.from(capture.data, "base64"));
  return filename;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Page.bringToFront");
await send("Emulation.setDeviceMetricsOverride", { width: viewportWidth, height: viewportHeight, deviceScaleFactor: 1, mobile: viewportWidth < 640 });
await send("Page.navigate", { url: baseUrl });
await delay(4200);

const initialState = await evaluate(`(async () => {
  const paint = document.querySelector('.control-deck h2')?.textContent.trim();
  [...document.querySelectorAll('.tab-button')].find((button) => button.textContent === 'Studio')?.click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  const studio = [...document.querySelectorAll('.option-button')].find((button) => button.getAttribute('aria-pressed') === 'true')?.querySelector('span')?.textContent ?? null;
  [...document.querySelectorAll('.tab-button')].find((button) => button.textContent === 'Paint')?.click();
  return {
    paint,
    studio,
    previews: [...document.querySelectorAll('.vehicle-preview img')].map((image) => ({
      loaded: image.complete && image.naturalWidth >= 450 && image.naturalHeight >= 350,
      fit: getComputedStyle(image).objectFit
    })),
    brandOnly: document.querySelectorAll('.nav-pill button').length === 1
      && document.querySelector('.wordmark')?.textContent.trim() === 'FORMDRIVE'
      && document.querySelector('.brand-credit')?.textContent.trim() === 'MADE BY ENES KAYMAZ'
      && document.querySelector('.brand-link')?.getAttribute('href') === 'https://x.com/nesdesignco'
      && [...document.querySelectorAll('.brand-link')].some((link) => link.getAttribute('href') === 'https://github.com/nesdesignco')
  };
})()`);

await evaluate(`(() => {
  const buttons = [...document.querySelectorAll('.vehicle-selector button')];
  buttons[${vehicleIndex}]?.click();
  return buttons.map((button) => button.innerText);
})()`);
await delay(vehicle === "tesla" ? 4200 : 3000);

const paintResults = [];
for (const swatch of ["obsidian", "silver", "copper", "ivory", "blue"]) {
  await evaluate(`(() => {
    document.querySelector('.swatch--${swatch}')?.click();
  })()`);
  await delay(180);
  paintResults.push(await evaluate(`document.querySelector('.control-deck h2')?.textContent`));
}

const wheelResults = await evaluate(`(async () => {
  [...document.querySelectorAll('.tab-button')].find((button) => button.textContent === 'Wheels')?.click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  const results = [];
  for (const button of document.querySelectorAll('.option-button')) {
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 40));
    results.push({ label: button.querySelector('span')?.textContent, selected: button.getAttribute('aria-pressed') === 'true' });
  }
  return results;
})()`);

const studioResults = await evaluate(`(async () => {
  [...document.querySelectorAll('.tab-button')].find((button) => button.textContent === 'Studio')?.click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  const results = [];
  for (const button of document.querySelectorAll('.option-button')) {
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 40));
    results.push({ label: button.querySelector('span')?.textContent, selected: button.getAttribute('aria-pressed') === 'true' });
  }
  const switches = [];
  for (const control of document.querySelectorAll('.glass-switch')) {
    const before = control.getAttribute('aria-checked') === 'true';
    control.click();
    await new Promise((resolve) => setTimeout(resolve, 120));
    const toggled = control.getAttribute('aria-checked') === 'true';
    const offScene = window.__formdriveSceneAudit?.() ?? null;
    control.click();
    await new Promise((resolve) => setTimeout(resolve, 120));
    switches.push({ label: control.getAttribute('aria-label'), before, toggled, restored: control.getAttribute('aria-checked') === 'true', offScene });
  }
  return { presets: results, switches };
})()`);

const cameraResults = await evaluate(`(async () => {
  const results = [];
  for (const button of document.querySelectorAll('.camera-button')) {
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 40));
    results.push({ label: button.textContent.trim(), selected: button.getAttribute('aria-pressed') === 'true' });
  }
  return results;
})()`);

const deckMotionResult = await evaluate(`(async () => {
  const content = document.querySelector('.deck-content');
  const toggle = document.querySelector('.deck-toggle');
  const openHeight = content.getBoundingClientRect().height;
  const transitionDuration = getComputedStyle(content).transitionDuration;
  toggle.click();
  await new Promise((resolve) => setTimeout(resolve, 110));
  const closingHeight = content.getBoundingClientRect().height;
  await new Promise((resolve) => setTimeout(resolve, 620));
  const collapsedHeight = content.getBoundingClientRect().height;
  toggle.click();
  await new Promise((resolve) => setTimeout(resolve, 110));
  const expandingHeight = content.getBoundingClientRect().height;
  await new Promise((resolve) => setTimeout(resolve, 620));
  const expandedHeight = content.getBoundingClientRect().height;
  return { openHeight, closingHeight, collapsedHeight, expandingHeight, expandedHeight, transitionDuration };
})()`);

const dialogResult = await evaluate(`(async () => {
  document.querySelector('[aria-label="Open technical information"]')?.click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  const dialog = document.querySelector('.info-dialog');
  const opened = dialog?.open;
  const models = [...dialog.querySelectorAll('.spec-sheet > div')]
    .filter((row) => row.querySelector('dt')?.textContent.startsWith('Model'))
    .map((row) => ({ label: row.querySelector('dd')?.textContent, year: row.querySelector('span')?.textContent }));
  dialog?.querySelector('[aria-label="Close"]')?.click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  return { opened, closed: !dialog?.open, models };
})()`);

const captureResult = await evaluate(`(() => {
  window.__captureAudit = null;
  const original = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function auditDownload() {
    window.__captureAudit = { filename: this.download, prefix: this.href.slice(0, 22), length: this.href.length };
  };
  try { document.querySelector('[aria-label="Download studio image"]')?.click(); }
  finally { HTMLAnchorElement.prototype.click = original; }
  return window.__captureAudit;
})()`);

await evaluate(`(() => {
  [...document.querySelectorAll('.tab-button')].find((button) => button.textContent === 'Parts')?.click();
})()`);
await delay(250);
await evaluate(`(() => {
  document.querySelector('.close-parts')?.click();
  [...document.querySelectorAll('.part-button')]
    .filter((button) => /glass|window/i.test(button.textContent))
    .forEach((button) => button.click());
  [...document.querySelectorAll('.camera-button')].find((button) => button.textContent.includes('Profile'))?.click();
})()`);
await delay(2200);

const windowState = await evaluate(`(() => ({
  controls: [...document.querySelectorAll('.part-button')]
    .filter((button) => /glass|window/i.test(button.textContent))
    .map((button) => ({ label: button.querySelector('span')?.textContent, open: button.getAttribute('aria-pressed') === 'true' })),
  scene: window.__formdriveSceneAudit?.() ?? null
}))()`);
const windowScreenshot = await screenshot(`${vehicle}${screenshotSuffix}-verified-windows-open.png`);

await evaluate(`(() => {
  [...document.querySelectorAll('.part-button')]
    .filter((button) => button.getAttribute('aria-pressed') !== 'true')
    .forEach((button) => button.click());
})()`);
await delay(2200);

const openState = await evaluate(`(() => ({
  vehicle: document.querySelector('.model-line')?.textContent.trim(),
  paint: document.querySelector('.control-deck h2')?.textContent.trim(),
  parts: [...document.querySelectorAll('.part-button')].map((button) => ({
    label: button.querySelector('span')?.textContent,
    open: button.getAttribute('aria-pressed') === 'true'
  })),
  brand: document.querySelector('.wordmark')?.textContent.trim(),
  renderer: document.documentElement.dataset.renderer,
  vehicleNames: [...document.querySelectorAll('.vehicle-selector strong')].map((node) => ({
    label: node.textContent,
    clipped: node.scrollWidth > node.clientWidth
  })),
  overlap: (() => {
    const selector = document.querySelector('.vehicle-selector')?.getBoundingClientRect();
    const rail = document.querySelector('.camera-rail')?.getBoundingClientRect();
    return selector && rail ? !(selector.bottom < rail.top || selector.top > rail.bottom || selector.right < rail.left || selector.left > rail.right) : null;
  })(),
  visibleMenuCollisions: (() => {
    const selectors = ['.nav-pill', '.vehicle-selector', '.control-deck', '.camera-rail'];
    const boxes = selectors.map((selector) => ({ selector, box: document.querySelector(selector)?.getBoundingClientRect() }))
      .filter(({ box }) => box && box.width > 0 && box.height > 0);
    const collisions = [];
    for (let first = 0; first < boxes.length; first += 1) for (let second = first + 1; second < boxes.length; second += 1) {
      const a = boxes[first]; const b = boxes[second];
      if (!(a.box.bottom <= b.box.top || a.box.top >= b.box.bottom || a.box.right <= b.box.left || a.box.left >= b.box.right)) collisions.push([a.selector, b.selector]);
    }
    return collisions;
  })(),
  closeButtonVisible: (() => {
    const panel = document.querySelector('.tab-panel');
    const button = document.querySelector('.close-parts');
    const deck = document.querySelector('.control-deck');
    if (!panel || !button || !deck) return false;
    panel.scrollTop = panel.scrollHeight;
    const buttonBox = button.getBoundingClientRect();
    const deckBox = deck.getBoundingClientRect();
    return buttonBox.top >= deckBox.top && buttonBox.bottom <= deckBox.bottom - 1;
  })()
}))()`);
const openScreenshot = await screenshot(`${vehicle}${screenshotSuffix}-verified-open.png`);

await evaluate(`document.querySelector('.close-parts')?.click()`);
await delay(1800);
const closedState = await evaluate(`(() => ({
  controls: [...document.querySelectorAll('.part-button')].map((button) => button.getAttribute('aria-pressed') === 'false'),
  scene: window.__formdriveSceneAudit?.() ?? null
}))()`);
const closedScreenshot = await screenshot(`${vehicle}${screenshotSuffix}-verified-closed.png`);

const passed = initialState.paint === "Ivory"
  && initialState.studio === "Noir"
  && initialState.brandOnly
  && initialState.previews.length === 3 && initialState.previews.every((preview) => preview.loaded && preview.fit === "cover")
  && paintResults.length === 5
  && wheelResults.length === 3 && wheelResults.every((result) => result.selected)
  && studioResults.presets.length === 3 && studioResults.presets.every((result) => result.selected)
  && studioResults.switches.length === 2 && studioResults.switches.every((result) => result.toggled !== result.before && result.restored === result.before)
  && cameraResults.length === 4 && cameraResults.every((result) => result.selected)
  && deckMotionResult.transitionDuration.includes("0.58s")
  && deckMotionResult.openHeight > deckMotionResult.closingHeight
  && deckMotionResult.closingHeight > deckMotionResult.collapsedHeight
  && deckMotionResult.collapsedHeight < 1
  && deckMotionResult.expandingHeight > deckMotionResult.collapsedHeight
  && Math.abs(deckMotionResult.expandedHeight - deckMotionResult.openHeight) < 12
  && dialogResult.opened && dialogResult.closed && dialogResult.models.length === 3
  && captureResult?.prefix === "data:image/png;base64,"
  && windowState.controls.every((control) => control.open)
  && Object.values(windowState.scene?.parts ?? {}).every((part) => part.resolved)
  && Object.values(windowState.scene?.parts ?? {}).filter((part) => part.motion === "slide").every((part) => part.targets.length > 0 && part.targets.every((target) => !target.visible))
  && openState.parts.every((part) => part.open)
  && openState.renderer === "webgpu"
  && openState.vehicleNames.every((item) => !item.clipped)
  && openState.visibleMenuCollisions.length === 0
  && openState.closeButtonVisible
  && closedState.controls.every(Boolean)
  && Number.isFinite(closedState.scene?.groundContact)
  && closedState.scene.groundContact <= 0.02 && closedState.scene.groundContact >= -0.22
  && events.length === 0;

const report = { passed, vehicle, initialState, paintResults, wheelResults, studioResults, cameraResults, deckMotionResult, dialogResult, captureResult, windowState, openState, allClosed: closedState.controls.every(Boolean), closedScene: closedState.scene, events, windowScreenshot, openScreenshot, closedScreenshot };
const summary = {
  passed,
  vehicle,
  paints: paintResults.length,
  wheels: wheelResults.length,
  studios: studioResults.presets.length,
  switches: studioResults.switches.length,
  cameras: cameraResults.length,
  deckMotion: deckMotionResult,
  catalogModels: dialogResult.models,
  parts: openState.parts.length,
  windowMeshesHidden: Object.values(windowState.scene?.parts ?? {}).filter((part) => part.motion === "slide").every((part) => part.targets.length > 0 && part.targets.every((target) => !target.visible)),
  closeButtonVisible: openState.closeButtonVisible,
  groundContact: closedState.scene?.groundContact,
  renderer: openState.renderer,
  collisions: openState.visibleMenuCollisions,
  events: events.length,
  screenshots: { windowScreenshot, openScreenshot, closedScreenshot },
};
console.log(JSON.stringify(process.argv.includes("--summary") ? summary : report, null, 2));
socket.close();
