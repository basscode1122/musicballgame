/* test-mp.js: multiplayer zonder echte PeerJS-verbinding: de
 * datakanaal-protocolfuncties, de beurt-gating en de sync-drift
 * worden tegen een fake verbinding getest (de echte handdruk loopt
 * via de publieke PeerJS-cloud en is in de harness niet beschikbaar). */
"use strict";

function mpFakeConn() {
  const c = { sent: [] };
  c.send = o => c.sent.push(o);
  c.on = () => {};
  c.close = () => {};
  return c;
}

function mpFreeSpot() {
  for (let y = 30; y <= 570; y += 30)
    for (let x = 60; x <= 700; x += 60) {
      const p = planePoint(x, y);
      if (!p || ballNear(p, 3)) continue;
      let bezet = false;
      for (const sp of spawners)
        if (Math.hypot(sp.x - p[0], sp.y - p[1]) < 4) { bezet = true; break; }
      if (!bezet) for (const w of walls) {
        const dx = w.x1 - w.x0, dy = w.y1 - w.y0, l2 = dx * dx + dy * dy;
        let tt = l2 > 1e-9 ? ((p[0] - w.x0) * dx + (p[1] - w.y0) * dy) / l2 : 0;
        tt = Math.max(0, Math.min(1, tt));
        if (Math.hypot(p[0] - (w.x0 + dx * tt), p[1] - (w.y0 + dy * tt)) < 4) { bezet = true; break; }
      }
      if (!bezet) return [x, y];
    }
  throw new Error("geen vrije plek");
}

function mpMouseDrag(x0, y0, x1, y1, pid) {
  fire("pointerdown", pev(x0, y0, { pointerId: pid }));
  fire("pointermove", pev(x1, y1, { pointerId: pid }));
  fire("pointerup", pev(x1, y1, { pointerId: pid }));
}

t("multiplayer-UI: bestaat en start offline", () => {
  pump(2);
  eq(mpState, "offline", "status offline");
  ok($("mpStatus").textContent.indexOf("Offline") === 0, "status-tekst offline");
  ok($("mpTurnRow").classList.contains("hidden"), "beurt-rij verborgen");
  eq($("mpEndTurn").disabled, true, "End turn uit zonder verbinding");
  ok(!mpConn && !mpPeer, "geen verbinding");
});

t("Host/Join zonder PeerJS-bibliotheek valt netjes terug (geen crash)", () => {
  clickEl("mpHost");
  ok($("mpStatus").textContent.indexOf("unavailable") >= 0, "melding over de bibliotheek");
  eq(mpState, "offline", "blijft offline");
  clickEl("mpJoin");
  ok($("mpStatus").textContent.indexOf("unavailable") >= 0, "ook bij Join een melding");
  eq(spawners.length, 0, "wereld onaangeroerd");
});

t("beurt-gating: zonder beurt géén muren, spawners of verwijderen", () => {
  mpConn = mpFakeConn(); mpRole = "guest"; myTurn = false; mpState = "live";
  mpUi();
  clickEl("mWall");
  const [ax, ay] = mpFreeSpot();
  mpMouseDrag(ax, ay, ax + 200, ay, 101);
  eq(walls.length, 0, "geen muur zonder beurt");
  fire("dblclick", pev(ax, ay, { pointerId: 102 }));
  eq(spawners.length, 0, "geen spawner zonder beurt");
  fire("pointerdown", pev(ax, ay, { button: 2, buttons: 2, pointerId: 103 }));
  fire("pointerup", pev(ax, ay, { button: 2, buttons: 0, pointerId: 103 }));
  eq(mpConn.sent.length, 0, "niets verstuurd");
});

t("beurt-gating: met beurt wél bouwen, en het protocol gaat mee", () => {
  myTurn = true; mpUi();
  const [ax, ay] = mpFreeSpot();
  const a = planePoint(ax, ay);
  mpMouseDrag(ax, ay, ax + 200, ay, 104);
  eq(walls.length, 1, "muur getekend op eigen beurt");
  const m = mpConn.sent.find(x => x.t === "wall");
  ok(m, "muur is verstuurd");
  eq(m.id, walls[0].id, "muur-id gaat mee");
  near(m.x0, a[0], 0.05, "start-x in het bericht");
  fire("dblclick", pev(ax, ay + 60, { pointerId: 105 }));
  eq(spawners.length, 1, "spawner geplaatst op eigen beurt");
  const s = mpConn.sent.find(x => x.t === "spawn");
  ok(s, "spawner is verstuurd");
  eq(s.sp.id, spawners[0].id, "spawner-id gaat mee");
  eq(s.sp.interval, 1.5, "instellingen gaan mee");
});

t("End turn: beurt gaat over en komt via het protocol terug", () => {
  eq(myTurn, true, "we beginnen aan de beurt");
  clickEl("mpEndTurn");
  eq(myTurn, false, "na End turn ben je de beurt kwijt");
  eq($("mpEndTurn").disabled, true, "knop staat uit");
  const m = mpConn.sent.find(x => x.t === "turn");
  ok(m && m.you === true, "turn-bericht verstuurd");
  mpOnMsg({ t: "turn", you: true });
  eq(myTurn, true, "turn-bericht van de ander geeft de beurt terug");
  eq($("mpEndTurn").disabled, false, "knop staat weer aan");
});

t("world-bericht laadt de wereld en zet de rol op guest (id's blijven gelijk)", () => {
  const spId = spawners[0].id, wId = walls[0].id;
  const w = JSON.parse(serializeWorld());
  ok(w.spawners.length >= 1 && w.walls.length >= 1, "wereld zit in het bericht");
  resetWorld();                              // sabotage: alles leeg
  eq(spawners.length, 0, "wereld leeg na sabotage");
  mpOnMsg({ t: "world", w });
  eq(spawners.length, w.spawners.length, "spawners terug via het world-bericht");
  eq(walls.length, w.walls.length, "muren terug via het world-bericht");
  eq(spawners[0].id, spId, "spawner behoudt zijn id");
  eq(walls[0].id, wId, "muur behoudt zijn id");
  eq(mpRole, "guest", "rol = guest");
  eq(myTurn, false, "guest begint niet");
  eq(mpState, "live", "status live");
});

t("wall-bericht maakt een muur met hetzelfde id (geen id-botsing)", () => {
  mpOnMsg({ t: "wall", id: 42, x0: -5, y0: 0, x1: 5, y1: 0, rest: 0.5 });
  const w = walls.find(x => x.id === 42);
  ok(w, "muur 42 bestaat");
  eq(w.rest, 0.5, "bounce gaat mee");
  const lokaal = addWall(1, 1, 2, 2, 0.85);
  eq(lokaal.id, 43, "volgende lokale muur krijgt een vrij id");
});

t("spawn/edit-bericht maakt en past spawners aan (id-binding)", () => {
  const velden = { id: 7, x: 2, y: 2, interval: 0.25, size: 0.9, angle: 90,
    speed: 11, vol: 0.5, weight: 10, vdb: -24, wave: 2, mode: MODE_SYNTH,
    atk: 0.002, dcy: 0.05, rel: 0.1, fm: { on: 1, m: [[1, 2, 0.5]] } };
  mpOnMsg({ t: "spawn", sp: velden });
  const sp = spawners.find(x => x.id === 7);
  ok(sp, "spawner 7 bestaat");
  eq(sp.interval, 0.25, "interval overgenomen");
  eq(sp.fm.on, true, "FM aan");
  eq(sp.wave, 2, "golfvorm overgenomen");
  velden.interval = 0.5;
  mpOnMsg({ t: "edit", sp: velden });
  eq(sp.interval, 0.5, "edit past interval aan");
  eq(sp.size, 0.9, "rest onaangetast door de edit");
});

t("del-bericht verwijdert spawners en muren", () => {
  mpOnMsg({ t: "del", kind: "spawner", id: 7 });
  ok(!spawners.some(x => x.id === 7), "spawner 7 weg");
  mpOnMsg({ t: "del", kind: "wall", id: 42 });
  ok(!walls.some(x => x.id === 42), "muur 42 weg");
});

t("sync-bericht corrigeert drift (ver = snap, dichtbij = zacht bijschuiven)", () => {
  resetWorld();
  resetPersistent();
  pump(3);
  ok(balls[0].active, "bal 0 actief");
  balls[0].x = -50; balls[0].y = -40;
  mpOnMsg({ t: "sync", b: [[1, 10, 5, 1, 0, 0.6, 120, 0]], tm: [] });
  near(balls[0].x, 10, 1e-6, "ver weg = metek gesnapt");
  near(balls[0].y, 5, 1e-6, "ook y gesnapt");
  eq(balls[0].vx, 1, "snelheid overgenomen");
  mpOnMsg({ t: "sync", b: [[1, 10.7, 5, 1, 0, 0.6, 120, 0]], tm: [] });
  near(balls[0].x, 10.21, 1e-6, "klein verschil = 30% bijschuiven");
});

t("host stuurt elke 2 s de drift-correctie", () => {
  mpConn = mpFakeConn(); mpRole = "host"; mpState = "live"; myTurn = true;
  mpLastSync = -1e9; mpLastFlush = -1e9;
  mpUi();
  pump(130);                                 // ~2,2 s aan frames
  const sync = mpConn.sent.filter(x => x.t === "sync");
  ok(sync.length >= 1, "sync-bericht verstuurd");
  eq(sync[0].b.length, balls.length, "alle ballen in de sync");
  eq(sync[0].tm.length, spawners.length, "spawner-timers in de sync");
});

t("spawner-sliderwijzigingen gaan binnen 0,5 s mee naar de ander", () => {
  resetWorld();
  const sp = addSpawner(2, 2);
  mpEdits.clear();
  mpConn = mpFakeConn(); mpRole = "guest"; mpState = "live";
  mpLastSync = -1e9; mpLastFlush = -1e9;
  myTurn = true;
  selected = { kind: "spawner", id: sp.id };
  syncSelPanel();
  hSetSlider("sWeight", 80);
  eq(sp.weight, 80, "slider past de spawner lokaal aan");
  pump(35);                                  // ~0,6 s
  const edit = mpConn.sent.filter(x => x.t === "edit");
  ok(edit.length >= 1, "edit-bericht verstuurd");
  eq(edit[edit.length - 1].sp.weight, 80, "gewicht in het edit-bericht");
  eq(edit[edit.length - 1].sp.id, sp.id, "goede spawner-id erbij");
});

t("MP vergrendelt veldafmetingen, reset en laden (geen solo-acties)", () => {
  mpConn = mpFakeConn(); mpUi();
  eq($("fw").disabled, true, "veldbreedte op slot");
  eq($("fh").disabled, true, "veldhoogte op slot");
  eq($("btnReset").disabled, true, "reset op slot");
  eq($("btnLoad").disabled, true, "laden op slot");
  mpCleanup();
  eq($("fw").disabled, false, "na Leave weer vrij");
  eq($("btnReset").disabled, false, "reset weer vrij");
  eq(mpState, "offline", "weer offline");
});

t("ballen duwen staat uit in multiplayer (ook op je beurt)", () => {
  resetWorld(); resetPersistent(); pump(3);
  mpConn = mpFakeConn(); myTurn = true; mpState = "live";
  mpUi();
  clickEl("mPlay");
  const b0 = balls.find(b => b.active && !b.spawned);
  const nd = ndcOf(b0.x, b0.y);
  const cx = Math.round((nd[0] + 1) / 2 * innerWidth);
  const cy = Math.round((1 - nd[1]) / 2 * innerHeight);
  const v0 = Math.hypot(b0.vx, b0.vy);
  mpMouseDrag(cx, cy, cx + 60, cy, 106);
  near(Math.hypot(b0.vx, b0.vy), v0, 1e-9, "snelheid onveranderd (duwen uit)");
});
