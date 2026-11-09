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
