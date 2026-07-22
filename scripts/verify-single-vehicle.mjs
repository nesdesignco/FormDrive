const debugPort = 12319;
const baseUrl = "http://127.0.0.1:12314/";

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

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1536, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: baseUrl });
await delay(4200);

const initialModelUrls = await evaluate(`performance.getEntriesByType('resource')
  .map((entry) => entry.name)
  .filter((name) => name.endsWith('.glb'))`);
const initialVehicle = await evaluate(`(() => ({
  rendered: window.__formdriveRenderedVehicleIds?.() ?? [],
  audited: window.__formdriveSceneAudit?.().vehicle ?? null
}))()`);
const order = ["tesla", "concept", "mustang", "concept", "tesla", "mustang", "tesla", "concept", "mustang"];
const indexByVehicle = { mustang: 0, tesla: 1, concept: 2 };
const switches = [];
const stagedLoads = [];

async function waitForVehicle(vehicle, timeout = 24000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const result = await evaluate(`(() => ({
      expected: ${JSON.stringify(vehicle)},
      selectedIndex: [...document.querySelectorAll('.vehicle-selector button')].findIndex((button) => button.getAttribute('aria-pressed') === 'true'),
      rendered: window.__formdriveRenderedVehicleIds?.() ?? [],
      audited: window.__formdriveSceneAudit?.().vehicle ?? null,
      pending: document.querySelector('.vehicle-selector button[aria-busy="true"]')?.getAttribute('aria-label') ?? null,
      anchors: window.__formdriveSceneAudit?.().lighting.anchors ?? null,
      beams: window.__formdriveBeamAudit?.() ?? null
    }))()`);
    if (result.audited === vehicle && result.rendered.length === 1 && result.rendered[0] === vehicle && result.selectedIndex === indexByVehicle[vehicle]) return result;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${vehicle}`);
}

for (const vehicle of order) {
  const previous = await evaluate(`window.__formdriveSceneAudit?.().vehicle ?? null`);
  await evaluate(`document.querySelectorAll('.vehicle-selector button')[${indexByVehicle[vehicle]}]?.click()`);
  await delay(35);
  stagedLoads.push(await evaluate(`(() => ({
    expected: ${JSON.stringify(vehicle)},
    previous: ${JSON.stringify(previous)},
    pending: document.querySelectorAll('.vehicle-selector button')[${indexByVehicle[vehicle]}]?.getAttribute('aria-busy') === 'true',
    rendered: window.__formdriveRenderedVehicleIds?.() ?? [],
    audited: window.__formdriveSceneAudit?.().vehicle ?? null
  }))()`));
  switches.push(await waitForVehicle(vehicle));
}

await evaluate(`[...document.querySelectorAll('.camera-button')].find((button) => button.textContent.includes('Profile'))?.click()`);
await delay(240);
const cameraBeforeDrag = await evaluate(`window.__formdriveCameraAudit?.() ?? null`);
const canvas = await evaluate(`(() => {
  const rect = document.querySelector('canvas')?.getBoundingClientRect();
  return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
})()`);

const startX = canvas.x + (canvas.width * 0.52);
const startY = canvas.y + (canvas.height * 0.5);
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: startX, y: startY, button: "left", clickCount: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: startX + 140, y: startY + 24, button: "left", buttons: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: startX + 140, y: startY + 24, button: "left", clickCount: 1 });
await delay(450);
const cameraAfterDrag = await evaluate(`window.__formdriveCameraAudit?.() ?? null`);
const headlightGeometry = await evaluate(`window.__formdriveSceneAudit?.().lighting ?? null`);

await evaluate(`(() => {
  [...document.querySelectorAll('.tab-button')].find((button) => button.textContent === 'Studio')?.click();
})()`);
await delay(100);
const lightSwitch = `.glass-switch[aria-label="Toggle headlights"]`;
if (await evaluate(`document.querySelector('${lightSwitch}')?.getAttribute('aria-checked') === 'true'`)) {
  await evaluate(`document.querySelector('${lightSwitch}')?.click()`);
}
const lightOffSamples = [];
for (const wait of [60, 90, 170, 320]) {
  await delay(wait);
  lightOffSamples.push(await evaluate(`window.__formdriveBeamAudit?.() ?? null`));
}
await evaluate(`document.querySelector('${lightSwitch}')?.click()`);
const lightOnSamples = [];
for (const wait of [60, 90, 170, 320]) {
  await delay(wait);
  lightOnSamples.push(await evaluate(`window.__formdriveBeamAudit?.() ?? null`));
}

const cameraDelta = Math.hypot(...cameraAfterDrag.position.map((value, index) => value - cameraBeforeDrag.position[index]));
const monotonic = (values, direction) => values.every((value, index) => index === 0 || (direction === "up" ? value >= values[index - 1] : value <= values[index - 1]));
const offIntensities = lightOffSamples.map((sample) => sample.left.intensity);
const onIntensities = lightOnSamples.map((sample) => sample.left.intensity);
const pendingSamples = stagedLoads.filter((result) => result.pending);
const passed = initialModelUrls.length === 1
  && initialModelUrls[0].includes('mustang-2005.glb')
  && initialVehicle.rendered.length === 1
  && initialVehicle.rendered[0] === 'mustang'
  && initialVehicle.audited === 'mustang'
  && pendingSamples.length >= 2
  && pendingSamples.every((result) => result.rendered.length === 1 && result.rendered[0] === result.previous && result.audited === result.previous)
  && switches.every((result) => result.rendered.length === 1
    && result.rendered[0] === result.expected
    && result.audited === result.expected
    && result.anchors?.left?.length === 3
    && result.anchors?.right?.length === 3
    && ['left', 'right'].every((side) => result.beams[side].intensity < 0.01 || Math.hypot(...result.beams[side].position.map((value, index) => value - (result.anchors[side][index] + (index === 2 ? 0.12 : 0)))) < 0.001)
    && ['left', 'right'].every((side) => result.beams[side].intensity < 0.01 || Math.abs(result.beams[side].target[0] - result.anchors[side][0]) < 0.001)
    && result.selectedIndex === indexByVehicle[result.expected])
  && cameraBeforeDrag.animating
  && !cameraAfterDrag.animating
  && cameraDelta > 0.05
  && monotonic(offIntensities, "down")
  && monotonic(onIntensities, "up")
  && lightOnSamples.every((sample) => sample.left.decay === 2 && sample.right.decay === 2)
  && events.length === 0;

console.log(JSON.stringify({ passed, initialModelUrls, initialVehicle, stagedLoads, switches, cameraBeforeDrag, cameraAfterDrag, cameraDelta, headlightGeometry, lightOffSamples, lightOnSamples, events: events.length }, null, 2));
socket.close();
await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`);

if (!passed) process.exitCode = 1;
