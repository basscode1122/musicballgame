/* test-camera.js: de camera kijkt haaks (recht van boven) op het veld */
"use strict";

t("scherm-midden projecteert exact op het cameramikpunt", () => {
  pump(2);
  const p = planePoint(innerWidth / 2, innerHeight / 2);
  ok(p, "planePoint geeft een punt");
  near(p[0], camTarget[0], 1e-6, "midden-x = mikpunt-x");
  near(p[1], camTarget[1], 1e-6, "midden-y = mikpunt-y");
});

t("horizontale muisbeweging verandert ALLÉÉN de wereld-x (haaks)", () => {
  const c = planePoint(innerWidth / 2, innerHeight / 2);
  const r = planePoint(innerWidth / 2 + 120, innerHeight / 2);
  ok(r[0] > c[0], "rechts op het scherm = +x in het veld");
  near(r[1], c[1], 1e-6, "wereld-y blijft exact gelijk");
});

t("verticale muisbeweging verandert ALLÉÉN de wereld-y (haaks)", () => {
  const c = planePoint(innerWidth / 2, innerHeight / 2);
  const u = planePoint(innerWidth / 2, innerHeight / 2 - 120);
  ok(u[1] > c[1], "boven op het scherm = +y in het veld (= hogere toon)");
  near(u[0], c[0], 1e-6, "wereld-x blijft exact gelijk");
});

t("het oog staat precies loodrecht boven het mikpunt", () => {
  pump(1);
  near(eye[0], camTarget[0], 1e-6, "zelfde x");
  near(eye[1], camTarget[1], 1e-6, "zelfde y");
  ok(eye[2] > camTarget[2], "camera zweeft boven het veld");
});

t("zoomen blijft rond de cursor (na de camerawijziging)", () => {
  const p0 = planePoint(300, 200);
  zoomAt(300, 200, 0.7);
  const p1 = planePoint(300, 200);
  near(p1[0], p0[0], 1e-6, "punt blijft op zijn pixel (x)");
  near(p1[1], p0[1], 1e-6, "punt blijft op zijn pixel (y)");
  zoomAt(300, 200, 1 / 0.7);
});

t("volledig uitgezoomd: alle vier de veldhoeken in beeld", () => {
  cam.distance = maxCamDist();
  syncCamera();
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const nd = ndcOf(sx * fieldHalfX, sy * fieldHalfY);
    ok(nd, "hoekpunt (" + sx + "," + sy + ") projecteert");
    ok(Math.abs(nd[0]) <= 1 && Math.abs(nd[1]) <= 1,
      "hoekpunt (" + sx + "," + sy + ") binnen beeld");
  }
  clickEl("btnCamReset");
});

t("camera-reset zet mikpunt + afstand terug (en blijft haaks)", () => {
  camTarget[0] = 5; camTarget[1] = -5; cam.distance = 30;
  syncCamera();
  clickEl("btnCamReset");
  near(camTarget[0], CENTER[0], 1e-6, "mikpunt-x terug");
  near(camTarget[1], CENTER[1], 1e-6, "mikpunt-y terug");
  near(cam.distance, 17, 1e-6, "afstand terug");
  const c = planePoint(innerWidth / 2, innerHeight / 2);
  near(c[0], camTarget[0], 1e-6, "nog steeds haaks na reset");
  near(c[1], camTarget[1], 1e-6, "nog steeds haaks na reset");
});

t("audio-filter: in beeld = vol, fall-off aan de rand, stil daarbuiten", () => {
  pump(2);
  const c = planePoint(innerWidth / 2, innerHeight / 2);
  near(offscreenAtten(c[0], c[1]), 1, 1e-6, "midden in beeld = volle sterkte");
  // volledig uitgezoomd: de veldhoeken zijn in beeld en dus hoorbaar
  cam.distance = maxCamDist();
  syncCamera();
  near(offscreenAtten(fieldHalfX, fieldHalfY), 1, 1e-6, "veldhoek hoorbaar bij volledige uitzoom");
  // volledig ingezoomd: midden hoort, ver buiten beeld zwijgt helemaal
  cam.distance = CAM_MIN_DIST;
  syncCamera();
  near(offscreenAtten(c[0], c[1]), 1, 1e-6, "midden ook ingezoomd hoorbaar");
  eq(offscreenAtten(c[0] + 60, c[1]), 0, "ver buiten beeld = 0 (geen stem)");
  // net buiten de rand: deels gedempt in de fall-off zone
  let band = null;
  for (let d = 0.05; d < 20; d += 0.05) {
    const nd = ndcOf(c[0], c[1] + d);
    if (!nd) continue;
    const out = Math.max(Math.abs(nd[0]), Math.abs(nd[1]));
    if (out > 1.02 && out < 1.12) { band = [c[0], c[1] + d]; break; }
  }
  ok(band, "een punt in de fall-off zone gevonden");
  const a = offscreenAtten(band[0], band[1]);
  ok(a > 0 && a < 1, "fall-off dempt gedeeltelijk (" + a.toFixed(2) + ")");
  clickEl("btnCamReset");
  syncCamera();
});

t("audio-culling: buiten beeld géén stem-slot, in beeld en in de fall-off wél", () => {
  pump(2);
  ensureAudio();
  cam.distance = CAM_MIN_DIST;
  syncCamera();
  const c = planePoint(innerWidth / 2, innerHeight / 2);
  const n0 = activeVoices.length;
  // ver buiten beeld: géén stem, en de rate-limit blijft onaangeroerd
  eq(offscreenAtten(c[0] + 60, c[1]), 0, "punt ver buiten beeld");
  collisionTone(5, 440, 1, { x: c[0] + 60, y: c[1], vol: 1, spId: 0 });
  eq(activeVoices.length, n0, "buiten beeld start géén stem");
  // in beeld: wél een stem
  lastToneTime = -1;                        // rate-limit buiten werking voor de test
  collisionTone(5, 440, 1, { x: c[0], y: c[1], vol: 1, spId: 0 });
  eq(activeVoices.length, n0 + 1, "in beeld start een stem");
  // in de fall-off zone start óók een stem (iets zachter)
  lastToneTime = -1;
  let band = null;
  for (let d = 0.05; d < 20; d += 0.05) {
    const nd = ndcOf(c[0], c[1] + d);
    if (!nd) continue;
    const out = Math.max(Math.abs(nd[0]), Math.abs(nd[1]));
    if (out > 1.02 && out < 1.12) { band = [c[0], c[1] + d]; break; }
  }
  ok(band, "punt in de fall-off zone");
  const n1 = activeVoices.length;
  collisionTone(5, 440, 1, { x: band[0], y: band[1], vol: 1, spId: 0 });
  eq(activeVoices.length, n1 + 1, "in de fall-off start ook een stem");
  clickEl("btnCamReset");
  syncCamera();
});
