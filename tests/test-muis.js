/* test-muis.js: PC-muis-besturing + regressie van de touch-besturing.
 * Nieuw deze ronde: dubbelklik plaatst een spawner in ELKE modus, slepen
 * tekent overal een muur (of duwt een bal), rechtermuisklik zonder
 * bewegen verwijdert het ding onder de cursor. */
"use strict";

/* zoek een schermplek zonder actieve bal in de buurt (met marge), zodat
 * een sleep daar gegarandeerd een MUUR tekent en geen bal duwt */
function clearSpot() {
  for (let y = 30; y <= 570; y += 30) {
    for (let x = 60; x <= 700; x += 60) {
      const p = planePoint(x, y);
      if (!p || ballNear(p, 3)) continue;
      // ook niet bovenop (of dicht bij) een bestaande muur of spawner
      let bezet = false;
      for (const w of walls) {
        const dx1 = w.x1 - w.x0, dy1 = w.y1 - w.y0;
        const len2 = dx1 * dx1 + dy1 * dy1;
        let tt = len2 > 1e-9 ? ((p[0] - w.x0) * dx1 + (p[1] - w.y0) * dy1) / len2 : 0;
        tt = Math.max(0, Math.min(1, tt));
        if (Math.hypot(p[0] - (w.x0 + dx1 * tt), p[1] - (w.y0 + dy1 * tt)) < 4) { bezet = true; break; }
      }
      for (const sp of spawners) {
        if (Math.hypot(sp.x - p[0], sp.y - p[1]) < 4) { bezet = true; break; }
      }
      if (!bezet) return [x, y];
    }
  }
  throw new Error("geen vrije plek gevonden");
}

/* ---- 0. basis: pagina laadt, camera staat op, planePoint werkt ---- */
t("laadt: spawners/muren leeg, planePoint werkt na 1 frame", () => {
  pump(2);
  eq(spawners.length, 0, "geen spawners bij start");
  eq(walls.length, 0, "geen muren bij start");
  ok(planePoint(400, 300), "planePoint geeft een punt");
  // lege start: zelf ballen maken (dubbeltik-gedrag), zoals in de app
  resetPersistent();
  pump(8);                       // ballen vallen even
  ok(balls.some(b => b.active && !b.spawned), "persistente ballen bestaan");
});

/* ---- 1. dubbelklik = spawner plaatsen (in ELKE modus) ---- */
t("dubbelklik (muis) in spawner-modus plaatst een spawner", () => {
  clickEl("mSpawner");
  eq(mode, "spawner", "modusknop zet modus");
  // eerste klik (selecteert niks), tweede klik, dan het dblclick-event
  fire("pointerdown", pev(400, 300));
  fire("pointerup", pev(400, 300));
  fire("pointerdown", pev(400, 300, { pointerId: 2 }));
  fire("pointerup", pev(400, 300, { pointerId: 2 }));
  eq(spawners.length, 0, "enkele klikken plaatsen nog niks");
  fire("dblclick", pev(400, 300, { pointerId: 2 }));
  eq(spawners.length, 1, "dubbelklik plaatst exact 1 spawner");
  ok(selected && selected.kind === "spawner", "nieuwe spawner is geselecteerd");
});

t("muis-dubbelklik reset de ballen NIET (dubbelklik = spawner)", () => {
  const born0 = balls.filter(b => b.active && !b.spawned).map(b => b.born)[0];
  ok(born0 !== undefined, "er zijn persistente ballen");
  fire("pointerdown", pev(410, 310));
  fire("pointerup", pev(410, 310));
  fire("pointerdown", pev(410, 310, { pointerId: 3 }));
  fire("pointerup", pev(410, 310, { pointerId: 3 }));
  fire("dblclick", pev(410, 310, { pointerId: 3 }));
  const born1 = balls.filter(b => b.active && !b.spawned).map(b => b.born)[0];
  eq(born0, born1, "persistente ballen zijn niet opnieuw gevallen");
  eq(spawners.length, 2, "wel een tweede spawner geplaatst");
});

t("tik op touch in spawner-modus = alleen selecteren (geen spawner)", () => {
  const n = spawners.length;
  fire("pointerdown", pev(300, 200, { pointerType: "touch" }));
  fire("pointerup", pev(300, 200, { pointerType: "touch" }));
  eq(spawners.length, n, "tik plaatst geen spawner");
});

t("touch dubbeltik in spawner-modus laat ballen opnieuw vallen", () => {
  const born0 = balls.filter(b => b.active && !b.spawned).map(b => b.born)[0];
  tick(400);                                        // > 350 ms na eerdere tik
  fire("pointerdown", pev(350, 250, { pointerType: "touch" }));
  fire("pointerup", pev(350, 250, { pointerType: "touch" }));
  fire("pointerdown", pev(350, 250, { pointerType: "touch", pointerId: 4 }));
  fire("pointerup", pev(350, 250, { pointerType: "touch", pointerId: 4 }));
  const born1 = balls.filter(b => b.active && !b.spawned).map(b => b.born)[0];
  ok(born1 !== born0, "dubbeltik op touch reset de ballen");
});

t("touch lang indrukken in spawner-modus blijft een spawner plaatsen", () => {
  const n = spawners.length;
  fire("pointerdown", pev(500, 200, { pointerType: "touch", pointerId: 5 }));
  tick(460);                                        // > 450 ms
  eq(spawners.length, n + 1, "lang indrukken plaatst na 450 ms");
  fire("pointerup", pev(500, 200, { pointerType: "touch", pointerId: 5 }));
});

t("muis lang ingedrukt houden plaatst NIET (dubbelklik is de PC-manier)", () => {
  const n = spawners.length;
  fire("pointerdown", pev(550, 250, { pointerId: 6 }));
  tick(460);
  eq(spawners.length, n, "muis-lang-indrukken plaatst niks meer");
  fire("pointerup", pev(550, 250, { pointerId: 6 }));
});

/* ---- 2. rechtermuisknop: schuiven of verwijderen ---- */
t("rechtermuisknop ingedrukt + bewegen schuift het cameramikpunt", () => {
  const nSp = spawners.length, nW = walls.length;
  const t0 = [camTarget[0], camTarget[1]];
  const p = planePoint(400, 300);
  ok(p, "startpunt");
  fire("pointerdown", pev(400, 300, { button: 2, buttons: 2, pointerId: 7 }));
  fire("pointermove", pev(320, 360, { button: 2, buttons: 2, pointerId: 7 }));
  ok(gesture && gesture.kind === "panMouse", "panMouse-gebaar actief");
  const bewogen = Math.hypot(camTarget[0] - t0[0], camTarget[1] - t0[1]);
  ok(bewogen > 0.01, "cameramikpunt is verplaatst");
  const p2 = planePoint(320, 360);
  fire("pointerup", pev(320, 360, { button: 2, buttons: 0, pointerId: 7 }));
  // het vastgepakte wereldpunt blijft onder de cursor
  near(p[0], p2[0], 0.05, "vastgepakte x blijft onder de cursor");
  near(p[1], p2[1], 0.05, "vastgepakte y blijft onder de cursor");
  // bewogen = géén verwijder-klik
  eq(spawners.length, nSp, "rechts-slepen verwijdert geen spawner");
  eq(walls.length, nW, "rechts-slepen verwijdert geen muur");
});

t("rechts-slepen start géén muur, spawner of swipe", () => {
  const nSp = spawners.length, nW = walls.length;
  clickEl("mWall");
  fire("pointerdown", pev(400, 300, { button: 2, buttons: 2, pointerId: 8 }));
  fire("pointermove", pev(300, 300, { button: 2, buttons: 2, pointerId: 8 }));
  fire("pointerup", pev(300, 300, { button: 2, buttons: 0, pointerId: 8 }));
  eq(walls.length, nW, "rechts tekent geen muur");
  clickEl("mPlay");
  fire("pointerdown", pev(400, 300, { button: 2, buttons: 2, pointerId: 9 }));
  fire("pointermove", pev(300, 300, { button: 2, buttons: 2, pointerId: 9 }));
  fire("pointerup", pev(300, 300, { button: 2, buttons: 0, pointerId: 9 }));
  eq(spawners.length, nSp, "rechts plaatst geen spawner");
  ok(!gesture, "gebaar is na loslaten opgeruimd");
});

t("contextmenu wordt afgevangen op het canvas", () => {
  const ev = pev(400, 300, { button: 2 });
  fire("contextmenu", ev);
  ok(ev.defaultPrevented, "preventDefault is aangeroepen");
});

t("middenmuisknop doet niks (geen modus-gebaar)", () => {
  fire("pointerdown", pev(400, 300, { button: 1, buttons: 4, pointerId: 10 }));
  ok(!gesture, "geen gebaar gestart");
  fire("pointerup", pev(400, 300, { button: 1, buttons: 0, pointerId: 10 }));
});

/* ---- 3. linkermuisknop: muur tekenen (in ELKE modus) + duwen ---- */
t("muis: klik + sleep in Muur-modus tekent een muur", () => {
  clickEl("mWall");
  const [ax, ay] = clearSpot();
  const a = planePoint(ax, ay), b = planePoint(ax + 200, ay);
  fire("pointerdown", pev(ax, ay, { pointerId: 11 }));
  fire("pointermove", pev(ax + 200, ay, { pointerId: 11 }));
  fire("pointerup", pev(ax + 200, ay, { pointerId: 11 }));
  eq(walls.length, 1, "muur getekend");
  near(walls[0].x0, a[0], 0.05, "muur begint op pleep");
  near(walls[0].x1, b[0], 0.05, "muur eindigt op pleep");
});

t("muis: klik zonder sleep in Muur-modus selecteert", () => {
  const w = walls[walls.length - 1];
  const nd = ndcOf((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2);
  const cx = Math.round((nd[0] + 1) / 2 * innerWidth);
  const cy = Math.round((1 - nd[1]) / 2 * innerHeight);
  fire("pointerdown", pev(cx, cy, { pointerId: 12 }));
  fire("pointerup", pev(cx, cy, { pointerId: 12 }));
  ok(selected && selected.kind === "wall", "de muur onder de cursor is geselecteerd");
});

t("muis: sleep in PLAY-modus tekent óók een muur (zonder menu-switch)", () => {
  clickEl("mPlay");
  eq(mode, "play", "we staan in Play");
  const [ax, ay] = clearSpot();
  const nW = walls.length;
  fire("pointerdown", pev(ax, ay, { pointerId: 13 }));
  fire("pointermove", pev(ax + 200, ay, { pointerId: 13 }));
  fire("pointerup", pev(ax + 200, ay, { pointerId: 13 }));
  eq(walls.length, nW + 1, "muur getekend ook in Play-modus");
  const w = walls[walls.length - 1];
  const pa = planePoint(ax, ay), pb = planePoint(ax + 200, ay);
  near(Math.hypot(w.x1 - w.x0, w.y1 - w.y0),
    Math.hypot(pb[0] - pa[0], pb[1] - pa[1]), 0.05, "muur heeft de gesleepte lengte");
});

t("muis: swipe op een bal duwt hem weg (Play-modus)", () => {
  clickEl("mPlay");
  const b0 = balls.find(b => b.active && !b.spawned);
  ok(b0, "er is een bal");
  const nd = ndcOf(b0.x, b0.y);
  ok(nd, "bal op het scherm");
  const cx = Math.round((nd[0] + 1) / 2 * innerWidth);
  const cy = Math.round((1 - nd[1]) / 2 * innerHeight);
  const v0 = Math.hypot(b0.vx, b0.vy);
  fire("pointerdown", pev(cx, cy, { pointerId: 14 }));
  fire("pointermove", pev(cx + 60, cy, { pointerId: 14 }));
  const v1 = Math.hypot(b0.vx, b0.vy);
  ok(Math.abs(v1 - v0) > 0.01, "snelheid van de bal is veranderd");
  fire("pointerup", pev(cx + 60, cy, { pointerId: 14 }));
});

t("muis: swipe op een bal duwt hem óók in Muur-modus (geen menu-switch)", () => {
  clickEl("mWall");
  const b0 = balls.find(b => b.active && !b.spawned);
  ok(b0, "er is een bal");
  const nd = ndcOf(b0.x, b0.y);
  const cx = Math.round((nd[0] + 1) / 2 * innerWidth);
  const cy = Math.round((1 - nd[1]) / 2 * innerHeight);
  const nW = walls.length;
  const v0 = Math.hypot(b0.vx, b0.vy);
  fire("pointerdown", pev(cx, cy, { pointerId: 15 }));
  fire("pointermove", pev(cx + 60, cy, { pointerId: 15 }));
  const v1 = Math.hypot(b0.vx, b0.vy);
  ok(Math.abs(v1 - v0) > 0.01, "bal is geduwd ondanks Muur-modus");
  fire("pointerup", pev(cx + 60, cy, { pointerId: 15 }));
  eq(walls.length, nW, "en er is geen muur bij getekend");
});

/* ---- 4. rechtermuisklik (zonder bewegen) = verwijderen ---- */
t("rechtermuisklik verwijdert de geselecteerde muur onder de cursor", () => {
  const w = walls[walls.length - 1];
  const nd = ndcOf((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2);
  const cx = Math.round((nd[0] + 1) / 2 * innerWidth);
  const cy = Math.round((1 - nd[1]) / 2 * innerHeight);
  selected = { kind: "wall", id: w.id };
  syncSelPanel();
  const nW = walls.length;
  fire("pointerdown", pev(cx, cy, { button: 2, buttons: 2, pointerId: 16 }));
  fire("pointerup", pev(cx, cy, { button: 2, buttons: 0, pointerId: 16 }));
  eq(walls.length, nW - 1, "muur verwijderd met rechtermuisklik");
  ok(!walls.some(x => x.id === w.id), "precies die muur is weg");
  ok(!selected, "selectie is na verwijderen leeg");
});

t("rechtermuisklik verwijdert een spawner onder de cursor", () => {
  clickEl("mPlay");
  const [ax, ay] = clearSpot();
  const n = spawners.length;
  fire("pointerdown", pev(ax, ay, { pointerId: 17 }));
  fire("pointerup", pev(ax, ay, { pointerId: 17 }));
  fire("pointerdown", pev(ax, ay, { pointerId: 18 }));
  fire("pointerup", pev(ax, ay, { pointerId: 18 }));
  fire("dblclick", pev(ax, ay, { pointerId: 18 }));
  eq(spawners.length, n + 1, "spawner geplaatst om te verwijderen");
  const sp = spawners[spawners.length - 1];
  selected = { kind: "spawner", id: sp.id };
  syncSelPanel();
  fire("pointerdown", pev(ax, ay, { button: 2, buttons: 2, pointerId: 19 }));
  fire("pointerup", pev(ax, ay, { button: 2, buttons: 0, pointerId: 19 }));
  eq(spawners.length, n, "spawner verwijderd met rechtermuisklik");
  ok(!spawners.some(x => x.id === sp.id), "precies die spawner is weg");
});

t("rechtermuisklik op leeg veld doet niks (en crasht niet)", () => {
  const nSp = spawners.length, nW = walls.length;
  fire("pointerdown", pev(400, 580, { button: 2, buttons: 2, pointerId: 20 }));
  fire("pointerup", pev(400, 580, { button: 2, buttons: 0, pointerId: 20 }));
  eq(spawners.length, nSp, "niks verwijderd");
  eq(walls.length, nW, "geen muur verwijderd");
});

/* ---- 5. scrollen = zoom ---- */
t("scrollen zoomt rond de cursor", () => {
  const d0 = cam.distance;
  const ev = pev(400, 300, { deltaY: -100, buttons: 0 });
  fire("wheel", ev);
  ok(cam.distance < d0, "omhoog scrollen zoomt in");
  ok(ev.defaultPrevented, "wheel preventDefault");
  fire("wheel", pev(400, 300, { deltaY: 100, buttons: 0 }));
  near(cam.distance, d0, 0.5, "terugscrollen herstelt de afstand");
});

/* ---- 6. dubbelklik in Play-modus = spawner (niet resetten) ---- */
t("muis: dubbelklik in Play-modus plaatst een spawner en reset de ballen NIET", () => {
  clickEl("mPlay");
  const [ax, ay] = clearSpot();
  const n = spawners.length;
  const born0 = balls.filter(b => b.active && !b.spawned).map(b => b.born)[0];
  tick(400);
  fire("pointerdown", pev(ax, ay, { pointerId: 21 }));
  fire("pointerup", pev(ax, ay, { pointerId: 21 }));
  fire("pointerdown", pev(ax, ay, { pointerId: 22 }));
  fire("pointerup", pev(ax, ay, { pointerId: 22 }));
  fire("dblclick", pev(ax, ay, { pointerId: 22 }));
  eq(spawners.length, n + 1, "dubbelklik plaatst ook in Play-modus een spawner");
  const born1 = balls.filter(b => b.active && !b.spawned).map(b => b.born)[0];
  eq(born1, born0, "ballen zijn NIET opnieuw gevallen (PC)");
});

/* ---- 7. opslag/laden nog intact ---- */
t("opslaan + laden via localStorage werkt nog", () => {
  saveWorld();
  const raw = localStorage.getItem(SAVE_KEY);
  ok(raw && raw.length > 10, "er is een opslag");
  const nSp = spawners.length;
  spawners.length = 0;          // sabotage; Laden moet het terugbrengen
  loadWorld();
  eq(spawners.length, nSp, "spawners terug na Laden");
});
