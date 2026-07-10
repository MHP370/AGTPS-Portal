export const iranMapAssetPaths = {
  provincesGeoJson: "/maps/iran/provinces.geojson",
  provincesTopoJson: "/maps/iran/provinces.topojson",
  heightmap: "/maps/iran/heightmap-iran.png",
  nightlights: "/maps/iran/nightlights-iran.webp",
  neonModel: "/maps/iran/iran-neon-map.glb",
  provinceCenters: "/maps/iran/province-centers.json",
  labelsFa: "/maps/iran/labels-fa.json",
} as const;

export const iranMapRenderingPlan = {
  portal: "webp-or-svg-lightweight",
  fullMap: "react-three-fiber-glb-heightmap",
  fallback: "svg-interactive",
} as const;
