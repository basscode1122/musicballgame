# Tests

Headless Node-harness die de pagina (canvas.html = index.html) in een gestubde DOM draait.

 node harness.js canvas.html test-camera.js test-regressie.js test-muis.js test-mp.js

Maak canvas.html met: tail -n +6 <CANVAS.md> > canvas.html (frontmatter = 5 regels).

- test-camera.js: camera/projectie/zoom
- test-regressie.js: features + opslag
- test-muis.js: muis- en touch-gebaren
- test-mp.js: multiplayer-protocol via een fake datakanaal (WebRTC zelf draait niet headless)
