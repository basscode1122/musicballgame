/* test-mp.js: multiplayer zonder echte PeerJS-verbinding: de
 * datakanaal-protocolfuncties, de beurt-gating (1 bouw-actie per
 * beurt, vrij verwijderen, undo) en de sync-drift worden tegen een
 * fake verbinding getest (de echte handdruk loopt via de publieke
 * PeerJS-cloud en is in de harness niet beschikbaar). */
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

function mpRightClickWorld(wx, wy, pid) {
  const nd = ndcOf(wx, wy);
  const cx = Math.round((nd[0] + 1) / 2 * innerWidth);
  const cy = Math.round((1 - nd[1]) / 2 * innerHeight);
  fire("pointerdown", pev(cx, cy, { button: 2, buttons: 2, pointerId: pid }));
  fire("pointerup", pev(cx, cy, { button: 2, buttons: 0, pointerId: pid }));
}

t("multiplayer-UI: bestaat en start offline", () => {
  pump(2);
  eq(mpState, "offline", "status offline");
  ok($("mpStatus").textContent.indexOf("Offline") === 0, "status-tekst offline");
  ok($("mpBar").classList.contains("hidden"), "beurt-balk onderaan verborgen");
  ok($("mpLeaveRow").classList.contains("hidden"), "Leave-rij verborgen");
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

t("beurt-balk: jouw beurt = balk zichtbaar met End turn aan", () => {
  myTurn = true; mpBuiltId = null; mpUi();
  ok(!$("mpBar").classList.contains("hidden"), "balk zichtbaar in sessie");
  eq($("mpEndTurn").disabled, false, "End turn aanklikbaar op eigen beurt");
  ok($("mpBarText").textContent.indexOf("Your turn") === 0, "balk-tekst: jouw beurt");
  ok(!$("mpLeaveRow").classList.contains("hidden"), "Leave zichtbaar in sessie");
});

t("beurt-gating: met beurt wél bouwen, en het protocol gaat mee", () => {
  const [ax, ay] = mpFreeSpot();
  const a = planePoint(ax, ay);
  mpMouseDrag(ax, ay, ax + 200, ay, 104);
  eq(walls.length, 1, "muur getekend op eigen beurt");
  const m = mpConn.sent.find(x => x.t === "wall");
  ok(m, "muur is verstuurd");
  eq(m.id, walls[0].id, "muur-id gaat mee");
  near(m.x0, a[0], 0.05, "start-x in het bericht");
  ok(mpBuiltId && mpBuiltId.kind === "wall" && mpBuiltId.id === walls[0].id,
    "de muur is het bouwsel van deze beurt");
  eq(myTurn, true, "beurt blijft bij jou (geen auto-doorgeven)");
  ok(!mpConn.sent.some(x => x.t === "turn"), "nog geen turn-bericht verstuurd");
  ok($("mpBarText").textContent.indexOf("Build used") === 0, "balk-tekst: bouwsel gebruikt");
});

t("max 1 bouw-actie per beurt: tweede muur of spawner gaat niet", () => {
  const [cx, cy] = mpFreeSpot();
  fire("dblclick", pev(cx, cy, { pointerId: 105 }));
  eq(spawners.length, 0, "geen spawner na je bouw-actie");
  ok(!mpConn.sent.some(x => x.t === "spawn"), "ook niks verstuurd");
  ok($("saveStatus").textContent.indexOf("1 build per turn") >= 0, "hint over de limiet");
  const [bx, by] = mpFreeSpot();
  mpMouseDrag(bx, by, bx + 200, by, 105);
  eq(walls.length, 1, "geen tweede muur");
  eq(mpConn.sent.filter(x => x.t === "wall").length, 1, "geen tweede muur-bericht");
});

t("eigen bouwsel weghalen geeft de bouw-actie terug", () => {
  const w = walls[0];
  mpRightClickWorld((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, 106);
  eq(walls.length, 0, "muur verwijderd met rechtermuisklik");
  eq(mpBuiltId, null, "bouw-actie is terug");
  ok(mpConn.sent.some(x => x.t === "del" && x.id === w.id), "verwijderen verstuurd");
  eq(myTurn, true, "beurt is nog steeds van jou");
  ok($("mpBarText").textContent.indexOf("Your turn") === 0, "balk-tekst: weer vrij bouwen");
  const [cx2, cy2] = mpFreeSpot();
  fire("dblclick", pev(cx2, cy2, { pointerId: 107 }));
  eq(spawners.length, 1, "na het weghalen mag je opnieuw bouwen");
  ok(mpConn.sent.some(x => x.t === "spawn"), "en het gaat naar de ander");
  ok(mpBuiltId && mpBuiltId.kind === "spawner", "de spawner is nu het bouwsel");
});

t("andere dingen weghalen is vrij maar geeft géén extra bouw-actie", () => {
  mpOnMsg({ t: "wall", id: 50, x0: -6, y0: 2, x1: 6, y1: 2, rest: 0.85 });   // muur van de ander
  const w = walls.find(x => x.id === 50);
  ok(w, "muur van de ander bestaat");
  mpRightClickWorld((w.x0 + w.x1) / 2, w.y0, 108);
  ok(!walls.some(x => x.id === 50), "muur van de ander verwijderd (vrij)");
  ok(mpConn.sent.some(x => x.t === "del" && x.id === 50), "verwijderen verstuurd");
  ok(mpBuiltId && mpBuiltId.kind === "spawner", "bouw-actie niet terug: je spawner staat er nog");
  const [cx3, cy3] = mpFreeSpot();
  fire("dblclick", pev(cx3, cy3, { pointerId: 109 }));
  eq(spawners.length, 1, "geen tweede bouwsel in dezelfde beurt");
});

t("End turn (onderbalk): beurt gaat over en komt via het protocol terug", () => {
  clickEl("mpEndTurn");
  eq(myTurn, false, "na End turn ben je de beurt kwijt");
  eq($("mpEndTurn").disabled, true, "knop staat uit");
  ok($("mpBarText").textContent.indexOf("Other player") >= 0, "balk toont: ander aan de beurt");
  const m = mpConn.sent.find(x => x.t === "turn");
  ok(m && m.you === true, "turn-bericht verstuurd");
  mpOnMsg({ t: "turn", you: true });
  eq(myTurn, true, "turn-bericht van de ander geeft de beurt terug");
  eq(mpBuiltId, null, "beurt-wissel zet de bouw-actie terug");
  eq($("mpEndTurn").disabled, false, "knop staat weer aan");
  ok($("mpBarText").textContent.indexOf("Your turn") === 0, "balk toont: jij aan de beurt");
});

t("world-bericht laadt de wereld en zet de rol op guest (id's blijven gelijk)", () => {
  resetWorld();
  addSpawner(3, 3);
  addWall(-4, -4, 4, -4, 0.85);
  const spId = spawners[0].id, wId = walls[0].id;
  const w = JSON.parse(serializeWorld());
  ok(w.spawners.length === 1 && w.walls.length === 1, "wereld zit in het bericht");
  resetWorld();                              // sabotage: alles leeg
  eq(spawners.length, 0, "wereld leeg na sabotage");
  mpOnMsg({ t: "world", w });
  eq(spawners.length, 1, "spawner terug via het world-bericht");
  eq(walls.length, 1, "muur terug via het world-bericht");
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
  ok(lokaal.id !== 42, "volgende lokale muur krijgt een vrij id");
  ok(lokaal.id > 42, "en het tellervolg loopt door");
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

t("sync-bericht: grote drift = direct, kleine = zacht uitgesmeerd", () => {
  resetWorld();
  resetPersistent();
  pump(3);
  ok(balls[0].active, "bal 0 actief");
  eq(balls[0].mpCx, 0, "correctie-veld begint leeg");
  balls[0].x = -50; balls[0].y = -40; balls[0].mpCx = 0; balls[0].mpCy = 0;
  mpOnMsg({ t: "sync", b: [[1, 10, 5, 1, 0, 0.6, 120, 0]], tm: [] });
  near(balls[0].x, 10, 1e-6, "ver weg = meteen gesnapt");
  near(balls[0].y, 5, 1e-6, "ook y gesnapt");
  eq(balls[0].vx, 1, "snelheid overgenomen");
  eq(balls[0].mpCx, 0, "na de grote snap is er geen openstaande correctie");
  // kleine drift: géén sprong meer, de correctie wordt uitgesmeerd
  const b = balls[0];
  mpOnMsg({ t: "sync", b: [[1, 10.7, 5, 1, 0, 0.6, 120, 0]], tm: [] });
  near(b.x, 10, 1e-6, "geen directe sprong bij kleine drift");
  near(b.mpCx, 0.7, 1e-6, "de correctie staat klaar om uit te smeren");
  pump(120);                                // ~2 s aan frames
  near(b.mpCx, 0, 0.02, "correctie is binnen 2 s uitgewerkt");
});

t("host stuurt elke 0,5 s de drift-correctie", () => {
  mpConn = mpFakeConn(); mpRole = "host"; mpState = "live"; myTurn = true;
  mpLastSync = -1e9; mpLastFlush = -1e9;
  mpUi();
  pump(130);                                 // ~2,2 s aan frames
  const sync = mpConn.sent.filter(x => x.t === "sync");
  ok(sync.length >= 3, "strakke sync: >= 3 berichten in 2,2 s (was 1 per 2 s)");
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
  ok($("mpBar").classList.contains("hidden"), "beurt-balk weer weg");
});

t("ballen duwen staat uit in multiplayer (ook op je beurt)", () => {
  resetWorld(); resetPersistent(); pump(3);
  mpConn = mpFakeConn(); myTurn = true; mpBuiltId = null; mpState = "live";
  mpUi();
  clickEl("mPlay");
  const b0 = balls.find(b => b.active && !b.spawned);
  const nd = ndcOf(b0.x, b0.y);
  const cx = Math.round((nd[0] + 1) / 2 * innerWidth);
  const cy = Math.round((1 - nd[1]) / 2 * innerHeight);
  const v0 = Math.hypot(b0.vx, b0.vy);
  mpMouseDrag(cx, cy, cx + 60, cy, 110);
  near(Math.hypot(b0.vx, b0.vy), v0, 1e-9, "snelheid onveranderd (duwen uit)");
});

t("global settings syncen live naar de ander (behalve Voices/Steal)", () => {
  mpCleanup();
  mpConn = mpFakeConn(); mpRole = "guest"; mpState = "live"; myTurn = false;
  mpUi();
  eq(octaves, 4, "start: 4 octaven");
  hSetSlider("oct", 5);
  ok(mpGsetDirty.has("oct"), "octaven-wijziging gemarkeerd voor sync");
  pump(20);                                  // > 0,25 s
  const g = mpConn.sent.filter(x => x.t === "gset");
  ok(g.length >= 1, "gset-bericht verstuurd");
  eq(g[g.length - 1].s.oct, 5, "sliderwaarde in het bericht");
  ok(!("mv" in g[g.length - 1].s), "voices is lokaal: niet in het bericht");
  ok(!("sm" in g[g.length - 1].s), "steal is lokaal: niet in het bericht");
  // ontvangen settings toepassen zonder echo terug te sturen
  const sentBefore = mpConn.sent.length;
  mpOnMsg({ t: "gset", s: { root: 7, vel: 60 } });
  eq(rootSemi, 7, "grondtoon toegepast");
  eq(synth.velDepthDb, -14, "velocity toegepast (60 -> -14 dB)");
  eq(+$("root").value, 7, "de slider meegestuurd met de handler");
  pump(20);
  eq(mpConn.sent.length, sentBefore, "ontvangst stuurt niets terug (geen echo)");
  mpCleanup();
});

t("muurkleur: eigen tint reist per muur mee, de instelling niet", () => {
  mpConn = mpFakeConn(); mpRole = "host"; mpState = "live"; myTurn = true; mpBuiltId = null;
  mpUi();
  hSetSlider("wc", 200);
  eq(wallHue, 200, "muurkleur 200 graden");
  ok(!mpGsetDirty.has("wc"), "muurkleur staat niet tussen de gesyncede globals");
  eq(localStorage.getItem("mbm-wallhue"), "200", "voorkeur bewaard in localStorage");
  clickEl("mWall");
  const [ax, ay] = mpFreeSpot();
  mpMouseDrag(ax, ay, ax + 200, ay, 130);
  const w = walls[walls.length - 1];
  eq(w.hue, 200, "de eigen muur heeft de ingestelde kleur");
  const msg = mpConn.sent.find(x => x.t === "wall" && x.id === w.id);
  ok(msg, "muurbericht verstuurd");
  eq(msg.hue, 200, "kleur reist mee met het muurbericht");
  // muur van de ander: diens kleur, niet de jouwe
  mpOnMsg({ t: "wall", id: 60, x0: -5, y0: -6, x1: 5, y1: -6, rest: 1.4, hue: 30 });
  const w2 = walls.find(x => x.id === 60);
  eq(w2.hue, 30, "muur van de ander krijgt diens kleur");
  const c = wallColor(w2);
  ok(c[0] > c[1] && c[1] > c[2], "hue 30 geeft een oranje-achtige muur");
  // eigen kleur: bounce zit in de helderheid, niet in de tint
  w2.rest = 0.05;
  const cDood = wallColor(w2);
  ok(cDood[0] < c[0], "dode muur is donkerder maar dezelfde tint");
  // auto: geen kleur ingesteld = oude bounce-kleur (groen bij rest 1,0)
  hSetSlider("wc", -1);
  eq(wallHue, null, "terug naar auto");
  const w3 = addWall(-2, -8, 2, -8, 1.0);
  eq(w3.hue, null, "auto = geen eigen kleur op de muur");
  const c3 = wallColor(w3);
  ok(c3[1] > c3[0] && c3[1] > c3[2], "rest 1,0 in auto = groen zoals vroeger");
  // opslag: de kleur van elke muur gaat mee
  const o = JSON.parse(serializeWorld());
  eq(o.walls.find(x => x.id === 60).hue, 30, "muurkleur in de opslag");
});

t("world-bericht neemt de bal-status over: instappen zonder glitch", () => {
  resetWorld();
  addSpawner(3, 3);
  addWall(-4, -4, 4, -4, 0.85);
  resetPersistent();
  balls[0].x = 12.3; balls[0].y = -4.2; balls[0].vx = 3; balls[0].vy = -2;
  const msg = Object.assign(mpBuildSync(), { t: "world", w: JSON.parse(serializeWorld()) });
  ok(msg.b && msg.b.length >= 10, "bal-status zit in het world-bericht");
  eq(msg.b[0][1], 12.3, "host-positie van bal 0 erin");
  // gast: lege wereld + verse (random) ballen -> na het bericht exact gelijk
  resetWorld();
  resetPersistent();                          // sabotage: random beginstand
  mpOnMsg(msg);
  near(balls[0].x, 12.3, 1e-6, "bal staat direct op de host-positie");
  near(balls[0].y, -4.2, 1e-6, "ook y");
  eq(balls[0].vx, 3, "snelheid overgenomen");
  eq(balls[0].mpCx, 0, "hard toegepast: geen openstaande correctie");
});

t("beurt-balk schuift boven het selectiepaneel zodra ze overlappen", () => {
  mpConn = mpFakeConn(); mpRole = "guest"; mpState = "live"; myTurn = true; mpBuiltId = null;
  mpUi();
  eq($("mpBar").style.bottom, "12px", "zonder selectie: balk onderaan");
  const sel = $("selPanel");
  // simuleer een smal scherm: het paneel raakt de midden-balk
  sel.offsetLeft = 20; sel.offsetWidth = 760; sel.offsetTop = 300; sel.offsetHeight = 288;
  const sp = addSpawner(2, 2);
  selected = { kind: "spawner", id: sp.id };
  syncSelPanel();
  eq($("mpBar").style.bottom, "312px", "balk staat boven het paneel (600 - 300 + 12)");
  selected = null;
  syncSelPanel();
  eq($("mpBar").style.bottom, "12px", "paneel dicht: balk terug naar onderen");
  mpCleanup();
});
