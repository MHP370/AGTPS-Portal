"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ExternalLink, MonitorCog } from "lucide-react";

import iranProvinces from "@/lib/geo/iran-provinces.json";
import { Dialog } from "@/components/ui/Dialog";
import { usePortalApplications } from "@/hooks/useApplications";
import { usePortalSites } from "@/hooks/useSites";
import type { Application } from "@/lib/applications";
import { isUploadedIcon, portalIconMap } from "@/lib/icon-options";
import type { Site } from "@/lib/sites";

type Coordinate = [number, number];
type Ring = Coordinate[];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

type ProvinceFeature = {
  type: "Feature";
  properties: {
    shapeName: string;
    shapeISO?: string | null;
    shapeID: string;
  };
  geometry:
    | {
        type: "Polygon";
        coordinates: Polygon;
      }
    | {
        type: "MultiPolygon";
        coordinates: MultiPolygon;
      };
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: ProvinceFeature[];
};

type ProjectedPoint = {
  x: number;
  y: number;
};

type ProvinceShape = {
  id: string;
  name: string;
  nameFa: string;
  path: string;
  labelPoint: ProjectedPoint;
};

type MapSite = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  point: ProjectedPoint;
  visualPoint: ProjectedPoint;
  provinceName?: string;
};

type SiteModal = {
  id: string;
  title: string;
  subtitle: string;
} | null;

const mapWidth = 760;
const mapHeight = 640;
const mapPadding = 34;
const mapPerspective = {
  translateX: 4,
  translateY: 30,
  skewX: -2.5,
  scaleX: 1,
  scaleY: 0.92,
};
const mapPerspectiveTransform = `translate(${mapPerspective.translateX} ${mapPerspective.translateY}) skewX(${mapPerspective.skewX}) scale(${mapPerspective.scaleX} ${mapPerspective.scaleY})`;
const mapPerspectiveOrigin = "380px 350px";

const provinceNameFa: Record<string, string> = {
  Alborz: "البرز",
  Ardabil: "اردبیل",
  Bushehr: "بوشهر",
  "Chaharmahal and Bakhtiari": "چهارمحال و بختیاری",
  "East Azerbaijan": "آذربایجان شرقی",
  Fars: "فارس",
  Gilan: "گیلان",
  Golestan: "گلستان",
  Hamadan: "همدان",
  Hormozgan: "هرمزگان",
  Ilam: "ایلام",
  Isfahan: "اصفهان",
  Kerman: "کرمان",
  Kermanshah: "کرمانشاه",
  Khuzestan: "خوزستان",
  "Kohgiluyeh and Boyer-Ahmad": "کهگیلویه و بویراحمد",
  Kurdistan: "کردستان",
  Lorestan: "لرستان",
  Markazi: "مرکزی",
  Mazandaran: "مازندران",
  "North Khorasan": "خراسان شمالی",
  Qazvin: "قزوین",
  Qom: "قم",
  "Razavi Khorasan": "خراسان رضوی",
  Semnan: "سمنان",
  "Sistan and Baluchestan": "سیستان و بلوچستان",
  "South Khorasan": "خراسان جنوبی",
  Tehran: "تهران",
  "West Azerbaijan": "آذربایجان غربی",
  Yazd: "یزد",
  Zanjan: "زنجان",
};

const knownSiteCoordinates: Record<string, Coordinate> = {
  teh: [51.389, 35.6892],
  tehran: [51.389, 35.6892],
  "دفتر تهران": [51.389, 35.6892],
  asl: [52.6155, 27.4761],
  asaluyeh: [52.6155, 27.4761],
  assaluyeh: [52.6155, 27.4761],
  "سایت عسلویه": [52.6155, 27.4761],
};

const knownSiteColors: Record<string, string> = {
  asl: "#f59e0b",
  asaluyeh: "#f59e0b",
  assaluyeh: "#f59e0b",
  "سایت عسلویه": "#f59e0b",
  teh: "#22d3ee",
  tehran: "#22d3ee",
  "دفتر تهران": "#22d3ee",
};

const fallbackSites = [
  {
    id: "tehran",
    title: "دفتر تهران",
    subtitle: "دفتر مرکزی",
    color: "#22d3ee",
    coordinate: knownSiteCoordinates.tehran,
  },
  {
    id: "asaluyeh",
    title: "سایت عسلویه",
    subtitle: "سایت عملیاتی",
    color: "#fbbf24",
    coordinate: knownSiteCoordinates.asaluyeh,
  },
];

function getFeaturePolygons(feature: ProvinceFeature): MultiPolygon {
  return feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
}

function getAllCoordinates(features: ProvinceFeature[]) {
  return features.flatMap((feature) =>
    getFeaturePolygons(feature).flatMap((polygon) =>
      polygon.flatMap((ring) => ring),
    ),
  );
}

function createProjection(features: ProvinceFeature[]) {
  const coordinates = getAllCoordinates(features);
  const minLatitude = Math.min(...coordinates.map(([, latitude]) => latitude));
  const maxLatitude = Math.max(...coordinates.map(([, latitude]) => latitude));
  const centerLatitude = ((minLatitude + maxLatitude) / 2) * (Math.PI / 180);
  const longitudeScale = Math.cos(centerLatitude);
  const projected = coordinates.map(([longitude, latitude]) => ({
    x: longitude * longitudeScale,
    y: latitude,
  }));
  const minX = Math.min(...projected.map((point) => point.x));
  const maxX = Math.max(...projected.map((point) => point.x));
  const minY = Math.min(...projected.map((point) => point.y));
  const maxY = Math.max(...projected.map((point) => point.y));
  const scale = Math.min(
    (mapWidth - mapPadding * 2) / (maxX - minX),
    (mapHeight - mapPadding * 2) / (maxY - minY),
  );
  const offsetX = (mapWidth - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = (mapHeight - (maxY - minY) * scale) / 2 + maxY * scale;

  return ([longitude, latitude]: Coordinate): ProjectedPoint => ({
    x: longitude * longitudeScale * scale + offsetX,
    y: offsetY - latitude * scale,
  });
}

function ringToPath(
  ring: Ring,
  project: (coordinate: Coordinate) => ProjectedPoint,
) {
  return ring
    .map((coordinate, index) => {
      const point = project(coordinate);
      const command = index === 0 ? "M" : "L";

      return `${command}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(" ");
}

function featureToPath(
  feature: ProvinceFeature,
  project: (coordinate: Coordinate) => ProjectedPoint,
) {
  return getFeaturePolygons(feature)
    .flatMap((polygon) =>
      polygon.map((ring) => `${ringToPath(ring, project)} Z`),
    )
    .join(" ");
}

function getRingCentroid(ring: Ring): Coordinate {
  let twiceArea = 0;
  let longitudeSum = 0;
  let latitudeSum = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [longitudeA, latitudeA] = ring[index];
    const [longitudeB, latitudeB] = ring[index + 1];
    const cross = longitudeA * latitudeB - longitudeB * latitudeA;

    twiceArea += cross;
    longitudeSum += (longitudeA + longitudeB) * cross;
    latitudeSum += (latitudeA + latitudeB) * cross;
  }

  if (Math.abs(twiceArea) < Number.EPSILON) {
    return ring[0];
  }

  return [longitudeSum / (3 * twiceArea), latitudeSum / (3 * twiceArea)];
}

function getRingArea(ring: Ring) {
  let area = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [longitudeA, latitudeA] = ring[index];
    const [longitudeB, latitudeB] = ring[index + 1];
    area += longitudeA * latitudeB - longitudeB * latitudeA;
  }

  return Math.abs(area / 2);
}

function getFeatureLabelCoordinate(feature: ProvinceFeature): Coordinate {
  const largestOuterRing = getFeaturePolygons(feature)
    .map((polygon) => polygon[0])
    .sort((a, b) => getRingArea(b) - getRingArea(a))[0];

  return getRingCentroid(largestOuterRing);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getSiteCoordinate(site: Site): Coordinate | undefined {
  if (typeof site.longitude === "number" && typeof site.latitude === "number") {
    return [site.longitude, site.latitude];
  }

  return (
    knownSiteCoordinates[normalize(site.code)] ??
    knownSiteCoordinates[normalize(site.name)]
  );
}

function getSiteColor(site: Site) {
  return (
    knownSiteColors[normalize(site.code)] ??
    knownSiteColors[normalize(site.name)] ??
    site.color ??
    "#22d3ee"
  );
}

function pointInRing(point: Coordinate, ring: Ring) {
  const [longitude, latitude] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > latitude !== yj > latitude &&
      longitude <
        ((xj - xi) * (latitude - yi)) / (yj - yi || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point: Coordinate, polygon: Polygon) {
  if (!pointInRing(point, polygon[0])) {
    return false;
  }

  return polygon.slice(1).every((ring) => !pointInRing(point, ring));
}

function getProvinceForCoordinate(
  coordinate: Coordinate,
  features: ProvinceFeature[],
) {
  const feature = features.find((province) =>
    getFeaturePolygons(province).some((polygon) =>
      pointInPolygon(coordinate, polygon),
    ),
  );

  return feature?.properties.shapeName;
}

function buildProvinceShapes(features: ProvinceFeature[]) {
  const project = createProjection(features);
  const groupedShapes = new Map<string, ProvinceShape>();

  features.forEach((feature) => {
    const name = feature.properties.shapeName;
    const existing = groupedShapes.get(name);
    const path = featureToPath(feature, project);

    if (existing) {
      existing.path = `${existing.path} ${path}`;
      return;
    }

    groupedShapes.set(name, {
      id: name,
      name,
      nameFa: provinceNameFa[name] ?? name,
      path,
      labelPoint: project(getFeatureLabelCoordinate(feature)),
    });
  });

  return {
    project,
    provinceShapes: Array.from(groupedShapes.values()).sort((a, b) =>
      a.nameFa.localeCompare(b.nameFa, "fa"),
    ),
  };
}

function applyMapPerspective(point: ProjectedPoint): ProjectedPoint {
  const scaledX = point.x * mapPerspective.scaleX;
  const scaledY = point.y * mapPerspective.scaleY;
  const skewedX =
    scaledX + Math.tan((mapPerspective.skewX * Math.PI) / 180) * scaledY;

  return {
    x: skewedX + mapPerspective.translateX,
    y: scaledY + mapPerspective.translateY,
  };
}

function buildMapSites(
  sites: Site[],
  project: (coordinate: Coordinate) => ProjectedPoint,
  features: ProvinceFeature[],
): MapSite[] {
  const activeSites = sites.filter((site) => site.isActive);

  if (activeSites.length === 0) {
    return fallbackSites.map((site) => ({
      id: site.id,
      title: site.title,
      subtitle: site.subtitle,
      color: site.color,
      point: project(site.coordinate),
      visualPoint: applyMapPerspective(project(site.coordinate)),
      provinceName: getProvinceForCoordinate(site.coordinate, features),
    }));
  }

  return activeSites.reduce<MapSite[]>((items, site) => {
    const coordinate = getSiteCoordinate(site);

    if (!coordinate) return items;

    items.push({
      id: site.id,
      title: site.name,
      subtitle: site.address || site.description || site.code,
      color: getSiteColor(site),
      point: project(coordinate),
      visualPoint: applyMapPerspective(project(coordinate)),
      provinceName: getProvinceForCoordinate(coordinate, features),
    });

    return items;
  }, []);
}

function getApplicationSite(application: Application, siteId: string) {
  return application.sites.find(
    (site) => site.isActive && site.site.id === siteId,
  );
}

function getSiteApplications(applications: Application[], siteId?: string) {
  if (!siteId) return [];

  return applications.filter(
    (application) =>
      application.isActive && Boolean(getApplicationSite(application, siteId)),
  );
}

function getApplicationIcon(application: Application) {
  return application.icon
    ? (portalIconMap[application.icon] ?? MonitorCog)
    : MonitorCog;
}

interface IranPortalMapProps {
  selectedSiteId?: string | null;
  onSiteSelect?: (siteId: string) => void;
  showApplications?: boolean;
}

export default function IranPortalMap({
  selectedSiteId,
  onSiteSelect,
  showApplications = true,
}: IranPortalMapProps) {
  const { data: sites = [], isLoading, isError } = usePortalSites();
  const { data: applications = [], isLoading: isApplicationsLoading } =
    usePortalApplications();
  const [hoveredProvinceName, setHoveredProvinceName] = useState<string | null>(
    null,
  );
  const [siteModal, setSiteModal] = useState<SiteModal>(null);
  const features = (iranProvinces as unknown as GeoJsonFeatureCollection)
    .features;
  const { project, provinceShapes } = useMemo(
    () => buildProvinceShapes(features),
    [features],
  );
  const mapSites = useMemo(
    () => buildMapSites(sites, project, features),
    [features, project, sites],
  );
  const hoveredProvince = hoveredProvinceName
    ? provinceShapes.find((province) => province.name === hoveredProvinceName)
    : undefined;
  const siteApplications = showApplications
    ? getSiteApplications(applications, siteModal?.id)
    : [];

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-slate-950/10 p-4 md:min-h-[560px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_42%,rgba(34,211,238,0.2),transparent_32%),radial-gradient(circle_at_58%_78%,rgba(251,191,36,0.11),transparent_18%),linear-gradient(rgba(56,189,248,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.07)_1px,transparent_1px)] bg-[size:100%_100%,100%_100%,56px_56px,56px_56px]" />
      <div className="absolute inset-x-12 bottom-10 h-20 rounded-[50%] bg-cyan-400/16 blur-3xl" />
      <svg
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="relative z-10 h-full min-h-[390px] w-full"
        role="img"
        aria-label="نقشه تعاملی استان‌های ایران"
      >
        <defs>
          <linearGradient id="provinceFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#17384d" stopOpacity="0.98" />
            <stop offset="45%" stopColor="#14293d" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#07111f" stopOpacity="0.99" />
          </linearGradient>
          <linearGradient id="hoveredProvinceFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#075985" stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="provinceSideFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#03697f" stopOpacity="0.62" />
            <stop offset="58%" stopColor="#06405b" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.98" />
          </linearGradient>
          <radialGradient id="terrainLight" cx="38%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.2" />
            <stop offset="42%" stopColor="#22d3ee" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <filter
            id="mapCastShadow"
            x="-12%"
            y="-10%"
            width="124%"
            height="130%"
          >
            <feDropShadow
              dx="-7"
              dy="20"
              stdDeviation="8"
              floodColor="#020617"
              floodOpacity="0.5"
            />
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="4"
              floodColor="#38bdf8"
              floodOpacity="0.28"
            />
          </filter>
          <filter id="outerNeon" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.16 0 0 0 0 0.82 0 0 0 0 1 0 0 0 0.9 0"
              result="cyanGlow"
            />
            <feMerge>
              <feMergeNode in="cyanGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="terrainRelief"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.022 0.064"
              numOctaves="5"
              seed="24"
              result="terrainNoise"
            />
            <feDiffuseLighting
              in="terrainNoise"
              lightingColor="#e0f2fe"
              surfaceScale="8"
              result="terrainLightMap"
            >
              <feDistantLight azimuth="306" elevation="28" />
            </feDiffuseLighting>
            <feComponentTransfer in="terrainLightMap" result="reliefLight">
              <feFuncR
                type="gamma"
                amplitude="0.7"
                exponent="1.28"
                offset="0"
              />
              <feFuncG
                type="gamma"
                amplitude="0.85"
                exponent="1.18"
                offset="0"
              />
              <feFuncB type="gamma" amplitude="1" exponent="1.1" offset="0" />
              <feFuncA type="table" tableValues="0 0.7" />
            </feComponentTransfer>
            <feComposite in="reliefLight" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id="mapTopGlow" x="-18%" y="-18%" width="136%" height="136%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="2.2"
              floodColor="#38bdf8"
              floodOpacity="0.7"
            />
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="7"
              floodColor="#0ea5e9"
              floodOpacity="0.42"
            />
          </filter>
          <filter id="provinceGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="markerGlow"
            x="-150%"
            y="-150%"
            width="400%"
            height="400%"
          >
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.12 0 0 0 0 0.78 0 0 0 0 1 0 0 0 0.95 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="iranMapClip">
            <path
              d={provinceShapes.map((province) => province.path).join(" ")}
            />
          </clipPath>
        </defs>

        <g
          className="fill-cyan-200/70 text-[14px] font-bold"
          pointerEvents="none"
        >
          <text x="368" y="78" textAnchor="middle">
            دریای خزر
          </text>
          <text x="208" y="588" textAnchor="middle">
            خلیج فارس
          </text>
          <text x="596" y="610" textAnchor="middle">
            دریای عمان
          </text>
        </g>

        <g
          filter="url(#mapCastShadow)"
          style={{
            transformBox: "view-box",
            transformOrigin: mapPerspectiveOrigin,
          }}
        >
          <g transform={`${mapPerspectiveTransform} translate(-10 22)`}>
            {provinceShapes.map((province) => (
              <path
                key={`side-${province.name}`}
                d={province.path}
                fill="url(#provinceSideFill)"
                stroke="#0284c7"
                strokeOpacity="0.34"
                strokeWidth="1.2"
              />
            ))}
          </g>

          <g transform={`${mapPerspectiveTransform} translate(-5 11)`}>
            {provinceShapes.map((province) => (
              <path
                key={`rim-${province.name}`}
                d={province.path}
                fill="#082f49"
                opacity="0.58"
                stroke="#38bdf8"
                strokeOpacity="0.46"
                strokeWidth="1"
              />
            ))}
          </g>

          <g transform={mapPerspectiveTransform}>
            <path
              d={provinceShapes.map((province) => province.path).join(" ")}
              fill="none"
              stroke="#7dd3fc"
              strokeOpacity="0.85"
              strokeWidth="3.2"
              filter="url(#mapTopGlow)"
              pointerEvents="none"
            />

            {provinceShapes.map((province) => {
              const isHovered = hoveredProvinceName === province.name;

              return (
                <path
                  key={province.name}
                  d={province.path}
                  role="img"
                  aria-label={`استان ${province.nameFa}`}
                  className="province-shape origin-center transition duration-200"
                  fill={
                    isHovered
                      ? "url(#hoveredProvinceFill)"
                      : "url(#provinceFill)"
                  }
                  stroke={isHovered ? "#dffaff" : "#8bdfff"}
                  strokeOpacity={isHovered ? 0.98 : 0.62}
                  strokeWidth={isHovered ? 2.6 : 1.06}
                  filter={isHovered ? "url(#provinceGlow)" : undefined}
                  onMouseEnter={() => setHoveredProvinceName(province.name)}
                  onMouseLeave={() => setHoveredProvinceName(null)}
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                />
              );
            })}

            <path
              d={provinceShapes.map((province) => province.path).join(" ")}
              fill="url(#terrainLight)"
              opacity="0.42"
              pointerEvents="none"
            />
            {provinceShapes.map((province) => (
              <path
                key={`terrain-${province.name}`}
                d={province.path}
                fill="#ffffff"
                opacity="0.18"
                filter="url(#terrainRelief)"
                pointerEvents="none"
              />
            ))}
            {hoveredProvince && (
              <g
                pointerEvents="none"
                transform={`translate(${hoveredProvince.labelPoint.x.toFixed(1)} ${hoveredProvince.labelPoint.y.toFixed(1)})`}
              >
                <rect
                  x="-45"
                  y="-30"
                  width="90"
                  height="30"
                  rx="15"
                  fill="#020617"
                  opacity="0.88"
                  stroke="#67e8f9"
                  strokeOpacity="0.55"
                />
                <text
                  y="-11"
                  textAnchor="middle"
                  className="fill-white text-[12px] font-black"
                >
                  {hoveredProvince.nameFa}
                </text>
              </g>
            )}
          </g>
        </g>

        {mapSites.map((site) => {
          const isSelected = selectedSiteId === site.id;
          const labelWidth = Math.max(102, site.title.length * 11);
          const markerIndex = mapSites.findIndex((item) => item.id === site.id);

          return (
            <g
              key={site.id}
              role="button"
              tabIndex={0}
              aria-label={site.title}
              className="map-marker cursor-pointer outline-none transition hover:opacity-100"
              transform={`translate(${site.visualPoint.x.toFixed(1)} ${site.visualPoint.y.toFixed(1)})`}
              style={
                {
                  "--marker-color": site.color,
                  "--marker-delay": `${180 + markerIndex * 120}ms`,
                } as CSSProperties
              }
              onClick={() => {
                onSiteSelect?.(site.id);
                setSiteModal({
                  id: site.id,
                  title: site.title,
                  subtitle: site.subtitle,
                });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSiteSelect?.(site.id);
                  setSiteModal({
                    id: site.id,
                    title: site.title,
                    subtitle: site.subtitle,
                  });
                }
              }}
            >
              <g className="map-marker-inner">
                <rect
                  x="-28"
                  y="-76"
                  width={labelWidth + 78}
                  height="100"
                  fill="transparent"
                />
                <ellipse
                  className="marker-pulse"
                  cx="0"
                  cy="0"
                  rx={isSelected ? 28 : 22}
                  ry={isSelected ? 9 : 7}
                  fill={site.color}
                  opacity="0.48"
                />
                <circle
                  className="marker-halo"
                  cx="0"
                  cy="-45"
                  r="34"
                  fill={site.color}
                  opacity="0.2"
                />
                <circle
                  className="marker-orbit"
                  cx="0"
                  cy="-45"
                  r="21"
                  fill="none"
                  stroke={site.color}
                  strokeWidth="1.8"
                  strokeOpacity="0.62"
                />
                <ellipse
                  cx="0"
                  cy="-2"
                  rx={isSelected ? 18 : 14}
                  ry={isSelected ? 6 : 5}
                  fill="none"
                  stroke={site.color}
                  strokeWidth="2.8"
                  opacity="0.86"
                />
                <line
                  x1="0"
                  y1="-3"
                  x2="0"
                  y2="-25"
                  stroke={site.color}
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  opacity="0.86"
                />
                <path
                  className="marker-pin-shape"
                  d="M0 -64 C-11 -64 -19 -55 -19 -45 C-19 -30 0 -1 0 -1 C0 -1 19 -30 19 -45 C19 -55 11 -64 0 -64Z"
                  fill={site.color}
                  stroke={site.color}
                  strokeWidth="1.8"
                />
                <circle cx="0" cy="-45" r="8.8" fill="#082f49" opacity="0.86" />
                <circle cx="0" cy="-45" r="3.6" fill="#e0faff" opacity="0.95" />
                <line
                  x1="18"
                  y1="-45"
                  x2="36"
                  y2="-45"
                  stroke={site.color}
                  strokeOpacity="0.84"
                  strokeWidth="1.4"
                />
                <g transform="translate(36 -62)">
                  <rect
                    x="0"
                    y="0"
                    width={labelWidth}
                    height="34"
                    rx="6"
                    fill="#0a1725"
                    opacity="0.92"
                    stroke={site.color}
                    strokeOpacity="0.72"
                    className="marker-label-panel"
                  />
                  <text
                    x={labelWidth / 2}
                    y="22"
                    textAnchor="middle"
                    className="fill-white text-[13px] font-black"
                  >
                    {site.title}
                  </text>
                </g>
              </g>
              <title>{`${site.title} - ${site.subtitle}`}</title>
            </g>
          );
        })}
      </svg>

      <style jsx>{`
        .province-shape {
          transform-origin: center;
          transform-box: fill-box;
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            stroke-width 180ms ease,
            opacity 180ms ease;
          will-change: transform;
        }

        .province-shape:hover {
          transform: translateY(-5px) scale(1.018);
        }

        .map-marker-inner {
          animation: marker-drop 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: var(--marker-delay);
          transform-origin: 0 0;
          transform-box: fill-box;
          will-change: transform, opacity;
        }

        .map-marker:hover .map-marker-inner,
        .map-marker:focus .map-marker-inner {
          animation:
            marker-drop 0ms both,
            marker-wiggle 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .marker-pulse {
          animation: marker-pulse 1800ms ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }

        .marker-halo {
          animation: marker-halo 1500ms ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
          filter: drop-shadow(0 0 12px var(--marker-color));
        }

        .marker-orbit,
        .marker-pin-shape,
        .marker-label-panel {
          filter: drop-shadow(0 0 6px var(--marker-color))
            drop-shadow(0 0 16px var(--marker-color));
        }

        @keyframes marker-drop {
          0% {
            opacity: 0;
            transform: translateY(-38px) scale(0.86);
          }
          62% {
            opacity: 1;
            transform: translateY(5px) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes marker-wiggle {
          0%,
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          22% {
            transform: translateY(-7px) rotate(-3deg) scale(1.04);
          }
          44% {
            transform: translateY(1px) rotate(3deg) scale(1.02);
          }
          68% {
            transform: translateY(-3px) rotate(-1.5deg) scale(1.03);
          }
        }

        @keyframes marker-pulse {
          0%,
          100% {
            opacity: 0.26;
            transform: scale(0.86);
          }
          50% {
            opacity: 0.56;
            transform: scale(1.18);
          }
        }

        @keyframes marker-halo {
          0%,
          100% {
            opacity: 0.12;
            transform: scale(0.9);
          }
          50% {
            opacity: 0.34;
            transform: scale(1.18);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .province-shape,
          .map-marker-inner,
          .marker-pulse,
          .marker-halo,
          .marker-orbit {
            animation: none;
            transition: none;
          }

          .province-shape:hover {
            transform: none;
          }
        }
      `}</style>

      <div className="absolute right-5 top-5 z-20 rounded-full border border-white/15 bg-slate-950/70 px-4 py-2 text-xs font-bold text-slate-200 backdrop-blur-xl">
        {isLoading
          ? "در حال دریافت سایت‌ها..."
          : isError
            ? "نمایش داده پیش‌فرض"
            : `${mapSites.length} سایت روی نقشه`}
      </div>

      <a
        href="https://www.geoboundaries.org/"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 left-5 z-20 text-[10px] font-medium text-slate-500 transition hover:text-cyan-200"
      >
        مرزها: geoBoundaries / OpenStreetMap
      </a>

      <Dialog
        open={Boolean(siteModal)}
        onOpenChange={(open) => {
          if (!open) setSiteModal(null);
        }}
        title={siteModal ? `سامانه‌های ${siteModal.title}` : "سامانه‌ها"}
      >
        <div className="space-y-4 text-right" dir="rtl">
          <p className="text-sm leading-7 text-slate-300">
            {siteModal?.subtitle}
          </p>

          {!showApplications ? (
            <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              ماژول سامانه‌ها غیرفعال است؛ لینک‌های سامانه‌های این سایت نمایش
              داده نمی‌شوند.
            </div>
          ) : isApplicationsLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              در حال دریافت سامانه‌ها...
            </div>
          ) : siteApplications.length === 0 ? (
            <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              برای این سایت هنوز سامانه فعالی ثبت نشده است.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {siteApplications.map((application) => {
                const applicationSite = getApplicationSite(
                  application,
                  siteModal?.id ?? "",
                );
                const Icon = getApplicationIcon(application);
                const uploadedIcon = isUploadedIcon(application.icon)
                  ? application.icon
                  : null;

                return (
                  <a
                    key={application.id}
                    href={applicationSite?.url || "#"}
                    target={
                      application.openInNewTab && applicationSite?.url
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      application.openInNewTab && applicationSite?.url
                        ? "noreferrer"
                        : undefined
                    }
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-300/40 hover:bg-white/[0.08]"
                  >
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-950/40 text-cyan-200"
                      style={{
                        color: application.color || "#67e8f9",
                      }}
                    >
                      {uploadedIcon ? (
                        <img
                          src={uploadedIcon}
                          alt=""
                          className="size-7 object-contain"
                        />
                      ) : (
                        <Icon size={24} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-black text-white">
                        {application.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-400">
                        {application.description ||
                          application.category?.name ||
                          application.key}
                      </span>
                    </span>
                    <ExternalLink
                      size={18}
                      className="shrink-0 text-slate-500 transition group-hover:text-cyan-200"
                    />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
