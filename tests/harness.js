/* harness.js: laadt het <script> uit canvas.html in een stub-browser en
 * draait de opgegeven testbestanden ernaast in DEZELFDE script-scope,
 * zodat tests bij alle top-level let/const van de pagina kunnen.
 * Elk testbestand krijgt een verse wereld (verse klok, timers, elementen).
 *
 * Gebruik: node harness.js canvas.html test-regressie.js test-muis.js ...
 */
"use strict";
const fs = require("fs");
const vm = require("vm");

const htmlFile = process.argv[2] || "canvas.html";
const testFiles = process.argv.slice(3);
if (testFiles.length === 0) {
  console.error("geen testbestanden opgegeven");
  process.exit(2);
}
const html = fs.readFileSync(htmlFile, "utf8");
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
if (!scriptMatch) throw new Error("geen <script> in " + htmlFile);
const pageScript = scriptMatch[1];

/* input-defaults (value="..") per id uit de HTML halen */
const valueById = {};
for (const m of html.matchAll(/<input id="([^"]+)"[^>]*?value="([^"]*)"/g)) {
  valueById[m[1]] = m[2];
}

class FakeEvent {
  constructor(type, opts) { this.type = type; Object.assign(this, opts || {}); }
}

function make2d() {
  const target = {
    canvas: { width: 300, height: 64 },
    clearRect() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    stroke() {}, fill() {}, fillRect() {}, fillText() {}, arc() {},
    setLineDash() {}, save() {}, restore() {}
  };
  return new Proxy(target, { get(t, k) { return k in t ? t[k] : () => {}; } });
}

function makeGL() {
  const consts = {};
  let nextConst = 0x1000;
  let bufSeq = 0;
  const gl = {
    createShader: () => ({}),
    shaderSource() {}, compileShader() {},
    getShaderParameter: () => true, getShaderInfoLog: () => "",
    createProgram: () => ({}),
    attachShader() {}, linkProgram() {},
    getProgramParameter: () => true, getProgramInfoLog: () => "",
    useProgram() {},
    createBuffer: () => ({ buf: ++bufSeq }),
    deleteBuffer() {}, bindBuffer() {}, bufferData() {},
    getAttribLocation: () => 0,
    getUniformLocation: () => ({ loc: 0 }),
    enableVertexAttribArray() {}, vertexAttribPointer() {},
    uniform1f() {}, uniform2f() {}, uniform3f() {}, uniform4f() {},
    uniform1i() {}, uniform2i() {}, uniformMatrix4fv() {},
    enable() {}, disable() {}, viewport() {},
    clearColor() {}, clear() {}, blendFunc() {}, depthMask() {},
    drawArrays() {}, drawElements() {}, finish() {}
  };
  return new Proxy(gl, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === "string" && /^[A-Z][A-Z0-9_]*$/.test(k)) {
        if (!(k in consts)) consts[k] = nextConst++;
        return consts[k];
      }
      return () => undefined;
    }
  });
}

/* ---------------- WebAudio-stub ---------------- */
class FakeParam {
  constructor(v) { this.value = v || 0; }
  setValueAtTime(v) { this.value = v; }
  linearRampToValueAtTime(v) { this.value = v; }
  exponentialRampToValueAtTime(v) { this.value = v; }
  setTargetAtTime(v) { this.value = v; }
  cancelScheduledValues() {}
}
class FakeNode {
  constructor(ctx) { this.ctx = ctx; this.connections = []; }
  connect(n) { this.connections.push(n); return n; }
  disconnect() {}
}
class FakeGain extends FakeNode { constructor(ctx) { super(ctx); this.gain = new FakeParam(1); } }
class FakeOsc extends FakeNode {
  constructor(ctx) {
    super(ctx); this.frequency = new FakeParam(440); this.detune = new FakeParam(0);
    this.type = "sine";
  }
  start(t) { this.ctx.log.push({ type: this.type, freq: this.frequency.value, at: t }); }
  stop() {}
}
class FakeBufferSource extends FakeNode {
  constructor(ctx) { super(ctx); this.buffer = null; this.playbackRate = new FakeParam(1); }
  start(t) { this.ctx.log.push({ type: "sample", rate: this.playbackRate.value, at: t }); }
  stop() {}
}
class FakePanner extends FakeNode { constructor(ctx) { super(ctx); this.pan = new FakeParam(0); } }
class FakeCompressor extends FakeNode {
  constructor(ctx) {
    super(ctx);
    this.threshold = new FakeParam(-12); this.knee = new FakeParam(12);
    this.ratio = new FakeParam(6); this.attack = new FakeParam(0.003);
    this.release = new FakeParam(0.25);
  }
}
class FakeShaper extends FakeNode { constructor(ctx) { super(ctx); this.curve = null; this.oversample = "none"; } }
class FakeAudioContext {
  constructor() {
    this.sampleRate = 48000;
    this.state = "running";
    this.destination = new FakeNode(this);
    this.log = [];                     // gestarte stemmen (voor toon-tests)
    this._t = 0;
  }
  get currentTime() { return this._t; }
  resume() { this.state = "running"; }
  createGain() { return new FakeGain(this); }
  createOscillator() { return new FakeOsc(this); }
  createBufferSource() { return new FakeBufferSource(this); }
  createStereoPanner() { return new FakePanner(this); }
  createDynamicsCompressor() { return new FakeCompressor(this); }
  createWaveShaper() { return new FakeShaper(this); }
  createScriptProcessor() { const n = new FakeNode(this); n.onaudioprocess = null; return n; }
  createBuffer(ch, len, sr) {
    return { numberOfChannels: ch, length: len, sampleRate: sr, getChannelData: () => new Float32Array(len) };
  }
}

/* ---------------- één verse wereld per testbestand ---------------- */
function makeWorld() {
  let vclock = 1000;
  const timers = [];
  let timerSeq = 1;
  const rafQueue = [];
  const elements = new Map();
  const store = new Map();

  const mySetTimeout = (fn, ms, ...args) => {
    const id = timerSeq++;
    timers.push({ id, at: vclock + (ms || 0), fn, args });
    return id;
  };
  const myClearTimeout = id => {
    const i = timers.findIndex(t => t.id === id);
    if (i >= 0) timers.splice(i, 1);
  };
  function tick(ms) {
    const until = vclock + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const next = timers.find(t => t.at <= until);
      if (!next) break;
      vclock = next.at;
      timers.splice(timers.indexOf(next), 1);
      next.fn(...next.args);
    }
    vclock = until;
  }
  function pump(n) {
    for (let i = 0; i < n; i++) {
      const cbs = rafQueue.splice(0);
      vclock += 16.67;
      if (cbs.length === 0) throw new Error("pump(): geen rAF-callback geregistreerd");
      for (const cb of cbs) cb(vclock);
    }
  }

  function el(id) {
    if (elements.has(id)) return elements.get(id);
    const listeners = {};
    const listenersByType = type => (listeners[type] = listeners[type] || []);
    const e = {
      id,
      value: valueById[id] !== undefined ? valueById[id] : "0",
      textContent: "",
      checked: false, disabled: false, hidden: false,
      style: {},
      width: id === "c" ? 800 : 300,
      height: id === "c" ? 600 : 64,
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        toggle(c, on) {
          const want = on === undefined ? !this._set.has(c) : !!on;
          if (want) this._set.add(c); else this._set.delete(c);
          return want;
        },
        contains(c) { return this._set.has(c); }
      },
      addEventListener(type, fn) { listenersByType(type).push(fn); },
      removeEventListener(type, fn) {
        const arr = listenersByType(type); const i = arr.indexOf(fn); if (i >= 0) arr.splice(i, 1);
      },
      fire(type, ev) { for (const fn of [...(listeners[type] || [])]) fn(ev); },
      dispatchEvent(ev) { ev.target = this; this.fire(ev.type, ev); return true; },
      setPointerCapture() {}, releasePointerCapture() {},
      getContext(kind) {
        if (id !== "c") return kind === "2d" ? make2d() : null;
        return kind === "webgl" ? makeGL() : (kind === "2d" ? make2d() : null);
      },
      getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }
    };
    elements.set(id, e);
    return e;
  }
  const canvasEl = el("c");

  const documentStub = {
    getElementById: el,
    querySelectorAll: sel => (sel === ".modes button" ? [el("bSynth"), el("bSampler")] : [])
  };
  const windowStub = {
    AudioContext: FakeAudioContext,
    webkitAudioContext: FakeAudioContext,
    devicePixelRatio: 1,
    isSecureContext: true,
    addEventListener() {},
    innerWidth: 800, innerHeight: 600
  };
  windowStub.self = windowStub;
  windowStub.top = windowStub;
  const localStorageStub = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
  };

  /* test-hulpjes, gebonden aan deze wereld */
  function fire(type, ev) { canvasEl.fire(type, ev); }
  function pev(x, y, extra) {
    return Object.assign({
      pointerId: 1, pointerType: "mouse", button: 0, buttons: 1,
      clientX: x, clientY: y,
      preventDefault() { this.defaultPrevented = true; }
    }, extra || {});
  }
  function clickEl(id) { el(id).fire("click", { preventDefault() {} }); }
  function hSetSlider(id, v) {
    const e = el(id);
    e.value = String(v);
    e.fire("input", { target: e, preventDefault() {} });
  }
  function eq(a, b, msg) {
    if (a !== b) throw new Error((msg || "eq") + ": verwachtte " + JSON.stringify(b) + ", kreeg " + JSON.stringify(a));
  }
  function ok(v, msg) { if (!v) throw new Error(msg || "ok: verwachtte truthy"); }
  function near(a, b, eps, msg) {
    if (Math.abs(a - b) > eps) throw new Error((msg || "near") + ": |" + a + " - " + b + "| > " + eps);
  }

  return {
    sandbox: {
      console,
      performance: { now: () => vclock },
      setTimeout: mySetTimeout, clearTimeout: myClearTimeout,
      setInterval: mySetTimeout, clearInterval: myClearTimeout,
      requestAnimationFrame: cb => rafQueue.push(cb),
      cancelAnimationFrame: () => {},
      document: documentStub,
      window: windowStub,
      localStorage: localStorageStub,
      location: { protocol: "https:" },
      navigator: {},
      innerWidth: 800, innerHeight: 600,
      Float32Array, Float64Array, Int16Array, Uint16Array, Uint8Array, Uint32Array,
      Event: FakeEvent,
      Math, Date, JSON, Object, Array, Number, String, Boolean, Map, Set, RegExp, Error,
      eq, ok, near, fire, pev, clickEl, hSetSlider, tick, pump,
      TESTS: { elements: () => elements, timers: () => timers }
    }
  };
}

/* ---------------- per testbestand draaien ---------------- */
let alOk = true;
for (const file of testFiles) {
  const world = makeWorld();
  const ctx = vm.createContext(world.sandbox);
  world.sandbox.globalThis = ctx;
  let passed = 0, failed = 0;
  const failures = [];
  world.sandbox.t = (name, fn) => {
    try { fn(); passed++; }
    catch (err) { failed++; failures.push({ name, err }); }
  };
  try {
    vm.runInContext(pageScript + "\n;\n" + fs.readFileSync(file, "utf8"), ctx, { filename: file });
    try { world.sandbox.pump(3); }
    catch (err) {
      console.error("FOUT in frame() na " + file + ": " + err);
      alOk = false;
    }
  } catch (err) {
    console.error("SCRIPT-FOUT in " + file + ": " + (err && err.stack ? err.stack.split("\n").slice(0, 6).join("\n") : err));
    console.log("== " + file + ": " + passed + " ok, " + failed + " faal");
    alOk = false;
    continue;
  }
  for (const f of failures) {
    console.error("FAAL: " + f.name + " -> " + (f.err && f.err.message ? f.err.message : f.err));
    alOk = false;
  }
  console.log("== " + file + ": " + passed + " ok, " + failed + " faal");
}
process.exit(alOk ? 0 : 1);
