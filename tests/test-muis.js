/* test-muis.js: PC-muis-besturing + regressie van de touch-besturing */
"use strict";

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

/* ---- 1. dubbelklik in Spawner-modus = spawner plaatsen ---- */
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

t("muis-dubbelklik in spawner-modus reset de ballen NIET", () => {
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

t("muis lang ingedrukt houden in spawner-modus plaatst ook (naast dubbelklik)", () => {
  const n = spawners.length;
  fire("pointerdown", pev(550, 250, { pointerId: 6 }));
  tick(460);
  eq(spawners.length, n + 1, "ook muis-lang-indrukken werkt nog");
  fire("pointerup", pev(550, 250, { pointerId: 6 }));
});

/* ---- 2. rechtermuisknop = camera schuiven ---- */
t("rechtermuisknop ingedrukt + bewegen schuift het cameramikpunt", () => {
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

/* ---- 3. linkermuisknop: muur tekenen + duwen ---- */
t("muis: klik + sleep in Muur-modus tekent een muur", () => {
  clickEl("mWall");
  const a = planePoint(200, 400), b = planePoint(600, 400);
  fire("pointerdown", pev(200, 400, { pointerId: 11 }));
  fire("pointermove", pev(600, 400, { pointerId: 11 }));
  fire("pointerup", pev(600, 400, { pointerId: 11 }));
  eq(walls.length, 1, "muur getekend");
  near(walls[0].x0, a[0], 0.05, "muur begint op pleep");
  near(walls[0].x1, b[0], 0.05, "muur eindigt op pleep");
});

t("muis: klik zonder sleep in Muur-modus selecteert", () => {
  fire("pointerdown", pev(600, 400, { pointerId: 12 }));
  fire("pointerup", pev(600, 400, { pointerId: 12 }));
  ok(selected && selected.kind === "wall", "de muur onder de cursor is geselecteerd");
});

t("muis: swipen in Play-duwt ballen weg", () => {
  clickEl("mPlay");
  // zoek een actieve bal en reken zijn wereldpositie terug naar het scherm
  const b0 = balls.find(b => b.active && !b.spawned);
  ok(b0, "er is een bal");
  const nd = ndcOf(b0.x, b0.y);
  ok(nd, "bal op het scherm");
  const cx = Math.round((nd[0] + 1) / 2 * innerWidth);
  const cy = Math.round((1 - nd[1]) / 2 * innerHeight);
  const v0 = Math.hypot(b0.vx, b0.vy);
  fire("pointerdown", pev(cx, cy, { pointerId: 13 }));
  fire("pointermove", pev(cx + 60, cy, { pointerId: 13 }));
  const v1 = Math.hypot(b0.vx, b0.vy);
  ok(Math.abs(v1 - v0) > 0.01, "snelheid van de bal is veranderd");
  fire("pointerup", pev(cx + 60, cy, { pointerId: 13 }));
});

/* ---- 4. scrollen = zoom ---- */
t("scrollen zoomt rond de cursor", () => {
  const d0 = cam.distance;
  const ev = pev(400, 300, { deltaY: -100, buttons: 0 });
  fire("wheel", ev);
  ok(cam.distance < d0, "omhoog scrollen zoomt in");
  ok(ev.defaultPrevented, "wheel preventDefault");
  fire("wheel", pev(400, 300, { deltaY: 100, buttons: 0 }));
  near(cam.distance, d0, 0.5, "terugscrollen herstelt de afstand");
});

/* ---- 5. dubbelklik in Play-modus blijft ballen resetten ---- */
t("muis: dubbelklik in Play-modus laat ballen opnieuw vallen", () => {
  const born0 = balls.filter(b => b.active && !b.spawned).map(b => b.born)[0];
  tick(400);
  fire("pointerdown", pev(200, 200, { pointerId: 14 }));
  fire("pointerup", pev(200, 200, { pointerId: 14 }));
  fire("pointerdown", pev(200, 200, { pointerId: 15 }));
  fire("pointerup", pev(200, 200, { pointerId: 15 }));
  const born1 = balls.filter(b => b.active && !b.spawned).map(b => b.born)[0];
  ok(born1 !== born0, "dubbelklik reset de ballen in Play-modus");
});

/* ---- 6. opslag/laden nog intact (deze ronde niets veranderd) ---- */
t("opslaan + laden via localStorage werkt nog", () => {
  saveWorld();
  const raw = localStorage.getItem(SAVE_KEY);
  ok(raw && raw.length > 10, "er is een opslag");
  const nSp = spawners.length;
  spawners.length = 0;          // sabotage; Laden moet het terugbrengen
  loadWorld();
  eq(spawners.length, nSp, "spawners terug na Laden");
});
