# Iran Map Assets

This folder is the stable asset home for the AGTPS Iran map module.

Current lightweight portal map:

- `provinces.geojson`: province boundaries copied from the app GIS source.

Planned high-fidelity map assets:

- `provinces.topojson`: optimized province boundaries for web rendering.
- `heightmap-iran.png`: DEM-derived grayscale heightmap.
- `nightlights-iran.webp`: optimized night-light texture.
- `iran-neon-map.glb`: lightweight baked 3D map for the full map page.
- `province-centers.json`: Persian label anchor points.
- `labels-fa.json`: Persian labels and sea label coordinates.

The portal home should stay lightweight. Use a rendered WebP/PNG plus an SVG
interaction layer there. Use React Three Fiber only on the full map page, loaded
on demand.
