/* test-regressie.js: kern van de vorige features (snelheid/gewicht/velocity/trail/v4)
 * + deze ronde: rand-bugfix + Engelse UI-woorden */
"use strict";

t("spawner-defaults: snelheid 25, gewicht 50, velDb -8 (vanuit synth)", () => {
  eq(synth.velDepthDb, -8, "globale standaard -8 dB");
  const sp = addSpawner(3, 4);
  eq(sp.speed, 25, "afvuursnelheid default 25");
  eq(sp.weight, 50, "gewicht default 50");
  eq(sp.velDb, -8, "velocity-diepte default -8 dB");
});

t("spawnBall: wMul = 0,1 + 1,8 * weight/100", () => {
  const sp = addSpawner(1, 2);
  sp.weight = 100;
  spawnBall(sp);
  const b = balls.find(x => x.active && x.spId === sp.id);
  ok(b, "bal gespawnd");
  near(b.wMul, 1.9, 1e-6, "gewicht 100 -> x1,9");
  sp.weight = 0;
  spawnBall(sp);
  const b2 = balls.filter(x => x.active && x.spId === sp.id)[1];
  near(b2.wMul, 0.1, 1e-6, "gewicht 0 -> x0,1");
});

t("rand-bugfix: addSpawner klemt binnen het veld (geen dode rand-spawners)", () => {
  const sp = addSpawner(500, -500);          // ver buiten het veld (200 x 200)
  near(sp.x, 98.8, 0.01, "x geklemd op rand - 1,2");
  near(sp.y, -98.8, 0.01, "y geklemd op rand - 1,2");
  const sp2 = addSpawner(90, 90);            // net binnen de rand: onaangetast
  near(sp2.x, 90, 1e-6, "binnen het veld niet verschoven");
});

t("rand-bugfix: spawnBall spawnt volledig binnen het veld", () => {
  const sp = addSpawner(95, 95);
  sp.x = 150;                                // sabotage: spawner buiten het veld
  spawnBall(sp);
  const b = balls.find(x => x.active && x.spId === sp.id);
  ok(b, "bal gespawnd ondanks spawner buiten het veld");
  ok(b.x <= 100 - b.r, "spawnpunt binnen de rechterrand");
  ok(b.x >= -100 + b.r, "spawnpunt binnen de linkerrand");
  ok(b.y >= -100 + b.r, "spawnpunt binnen de onderrand");
});

t("gewicht-slider in het selectiepaneel schrijft spawner.weight", () => {
  const sp = addSpawner(2, 2);
  selected = { kind: "spawner", id: sp.id };
  syncSelPanel();
  hSetSlider("sWeight", 80);
  eq(sp.weight, 80, "weight via slider");
});

t("velocity-slider per spawner: 0..100 -> 0..-24 dB (gehele dB's)", () => {
  const sp = addSpawner(2, 3);
  selected = { kind: "spawner", id: sp.id };
  syncSelPanel();
  hSetSlider("sVel", 33);
  eq(sp.velDb, -8, "33 -> -8 dB");
  hSetSlider("sVel", 100);
  eq(sp.velDb, -24, "100 -> -24 dB");
  hSetSlider("sVel", 0);
  eq(sp.velDb, 0, "0 -> 0 dB");
});

t("globale Velocity-slider = standaard voor nieuwe spawners", () => {
  hSetSlider("vel", 50);
  eq(synth.velDepthDb, -12, "50 -> -12 dB globaal");
  const sp = addSpawner(5, 5);
  eq(sp.velDb, -12, "nieuwe spawner erft de globale diepte");
  hSetSlider("vel", 33);
  eq(synth.velDepthDb, -8, "33 -> terug naar -8 dB");
});

t("snelheid-slider loopt 1:1 (0..100)", () => {
  const sp = addSpawner(6, 6);
  selected = { kind: "spawner", id: sp.id };
  syncSelPanel();
  hSetSlider("sSpeed", 70);
  eq(sp.speed, 70, "slider 70 -> snelheid 70");
});

t("trail: sterkte-slider + historie per bal", () => {
  resetPersistent();
  hSetSlider("tr", 100);
  near(trailStrength, 1, 1e-6, "100% sterkte");
  pump(6);
  const b = balls.find(x => x.active && !x.spawned);
  ok(b && b.trail.length >= 4, "trail-historie loopt vol");
  hSetSlider("tr", 0);
  near(trailStrength, 0, 1e-6, "0% = onzichtbaar");
  hSetSlider("tr", 50);
});

t("opslag v4: weight, vdb en tr gaan mee en komen terug", () => {
  const sp = addSpawner(7, 7);
  sp.weight = 30;
  sp.velDb = -20;
  hSetSlider("tr", 60);
  saveWorld();
  const o = JSON.parse(localStorage.getItem(SAVE_KEY));
  eq(o.v, 4, "opslag-formule v4");
  const s = o.spawners.find(x => x.weight === 30 && x.vdb === -20);
  ok(s, "weight + vdb in de opslag");
  eq(s.weight, 30, "weight in de opslag");
  eq(s.vdb, -20, "vdb in de opslag");
  eq(o.tr, 60, "trail-sterkte in de opslag");
  sp.weight = 100; sp.velDb = 0;          // sabotage
  trailStrength = 0;
  loadWorld();
  const sp2 = spawners.find(x => x.weight === 30 && x.velDb === -20);
  ok(sp2, "spawner terug na Laden");
  near(trailStrength, 0.6, 1e-6, "trail-sterkte terug na Laden");
});

t("Engelse UI: golf- en toonladder-namen", () => {
  eq(WAVE_NAMES[0], "Sine", "Sinus -> Sine");
  eq(WAVE_NAMES[1], "Square", "Blok -> Square");
  eq(WAVE_NAMES[2], "Saw", "Zaag -> Saw");
  eq(WAVE_NAMES[3], "Triangle", "Driehoek -> Triangle");
  eq(SCALES[0].name, "Pentatonic minor", "ladder-naam Engels");
  eq(SCALES[2].name, "Major", "Majeur -> Major");
});

t("stem-pool 16 + master-bus tegen kraak (vorige ronde)", () => {
  eq(MAX_VOICES, 16, "stem-pool is 16");
  ensureAudio();
  ok(masterBus, "master-bus bestaat");
  ok(audioCtx, "audio-context aan");
});
