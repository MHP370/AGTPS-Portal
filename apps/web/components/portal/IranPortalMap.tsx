"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  MapPin,
  MonitorCog,
  type LucideIcon,
} from "lucide-react";

import iranProvinces from "@/lib/geo/iran-provinces.json";
import { Dialog } from "@/components/ui/Dialog";
import { usePortalApplications } from "@/hooks/useApplications";
import { useSites } from "@/hooks/useSites";
import type { Application } from "@/lib/applications";
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

const iconMap: Record<string, LucideIcon> = {
  MonitorCog,
};

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
  const minLatitude = Math.min(
    ...coordinates.map(([, latitude]) => latitude),
  );
  const maxLatitude = Math.max(
    ...coordinates.map(([, latitude]) => latitude),
  );
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
  const offsetX =
    (mapWidth - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY =
    (mapHeight - (maxY - minY) * scale) / 2 + maxY * scale;

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

  return [
    longitudeSum / (3 * twiceArea),
    latitudeSum / (3 * twiceArea),
  ];
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
  if (
    typeof site.longitude === "number" &&
    typeof site.latitude === "number"
  ) {
    return [site.longitude, site.latitude];
  }

  return (
    knownSiteCoordinates[normalize(site.code)] ??
    knownSiteCoordinates[normalize(site.name)]
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
        ((xj - xi) * (latitude - yi)) / (yj - yi || Number.EPSILON) +
          xi;

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
        color: site.color || "#22d3ee",
        point: project(coordinate),
        provinceName: getProvinceForCoordinate(coordinate, features),
      });

      return items;
    }, []);
}

function getApplicationSite(
  application: Application,
  siteId: string,
) {
  return application.sites.find(
    (site) => site.isActive && site.site.id === siteId,
  );
}

function getSiteApplications(
  applications: Application[],
  siteId?: string,
) {
  if (!siteId) return [];

  return applications.filter(
    (application) =>
      application.isActive && Boolean(getApplicationSite(application, siteId)),
  );
}

function getApplicationIcon(application: Application) {
  return application.icon
    ? iconMap[application.icon] ?? MonitorCog
    : MonitorCog;
}

interface IranPortalMapProps {
  selectedSiteId?: string | null;
  onSiteSelect?: (siteId: string) => void;
}

export default function IranPortalMap({
  selectedSiteId,
  onSiteSelect,
}: IranPortalMapProps) {
  const { data: sites = [], isLoading, isError } = useSites();
  const { data: applications = [], isLoading: isApplicationsLoading } =
    usePortalApplications();
  const [hoveredProvinceName, setHoveredProvinceName] =
    useState<string | null>(null);
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
    ? provinceShapes.find(
        (province) => province.name === hoveredProvinceName,
      )
    : undefined;
  const siteApplications = getSiteApplications(
    applications,
    siteModal?.id,
  );

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-slate-950/20 p-4 md:min-h-[560px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_35%),linear-gradient(rgba(56,189,248,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.07)_1px,transparent_1px)] bg-[size:100%_100%,56px_56px,56px_56px]" />
      <svg
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="relative z-10 h-full min-h-[390px] w-full drop-shadow-[0_0_28px_rgba(56,189,248,0.42)]"
        role="img"
        aria-label="نقشه تعاملی استان‌های ایران"
      >
        <defs>
          <linearGradient id="provinceFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#164e63" stopOpacity="0.86" />
            <stop offset="55%" stopColor="#1e3a8a" stopOpacity="0.74" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="hoveredProvinceFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.82" />
          </linearGradient>
          <filter id="provinceGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          className="fill-cyan-200/75 text-[14px] font-bold"
          pointerEvents="none"
        >
          <text x="170" y="72" textAnchor="middle">
            دریای خزر
          </text>
          <text x="218" y="574" textAnchor="middle">
            خلیج فارس
          </text>
          <text x="590" y="612" textAnchor="middle">
            دریای عمان
          </text>
        </g>

        {provinceShapes.map((province) => {
          const isHovered = hoveredProvinceName === province.name;

          return (
            <path
              key={province.name}
              d={province.path}
              role="img"
              aria-label={`استان ${province.nameFa}`}
              className="origin-center transition duration-200 hover:scale-[1.012] hover:fill-cyan-400/55"
              fill={
                isHovered
                  ? "url(#hoveredProvinceFill)"
                  : "url(#provinceFill)"
              }
              stroke={isHovered ? "#ffffff" : "#7dd3fc"}
              strokeOpacity={isHovered ? 0.95 : 0.46}
              strokeWidth={isHovered ? 2.2 : 1}
              filter={isHovered ? "url(#provinceGlow)" : undefined}
              onMouseEnter={() => setHoveredProvinceName(province.name)}
              onMouseLeave={() => setHoveredProvinceName(null)}
            />
          );
        })}

        {hoveredProvince && (
          <g
            pointerEvents="none"
            transform={`translate(${hoveredProvince.labelPoint.x.toFixed(1)} ${hoveredProvince.labelPoint.y.toFixed(1)})`}
          >
            <rect
              x="-45"
              y="-28"
              width="90"
              height="28"
              rx="14"
              fill="#020617"
              opacity="0.82"
              stroke="#67e8f9"
              strokeOpacity="0.45"
            />
            <text
              y="-10"
              textAnchor="middle"
              className="fill-white text-[12px] font-black"
            >
              {hoveredProvince.nameFa}
            </text>
          </g>
        )}

        {mapSites.map((site) => {
          const isSelected = selectedSiteId === site.id;

          return (
            <g
              key={site.id}
              role="button"
              tabIndex={0}
              aria-label={site.title}
              className="cursor-pointer outline-none transition hover:opacity-100"
              transform={`translate(${site.point.x.toFixed(1)} ${site.point.y.toFixed(1)})`}
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
              <circle
                r={isSelected ? 20 : 16}
                fill={site.color}
                opacity="0.22"
              />
              <circle
                r={isSelected ? 11 : 8}
                fill={site.color}
                stroke="#ffffff"
                strokeWidth={isSelected ? 3 : 2}
              />
              <foreignObject x="-12" y="-13" width="24" height="24">
                <MapPin
                  size={24}
                  fill={site.color}
                  color="#ffffff"
                />
              </foreignObject>
              <text
                x="16"
                y="-12"
                className="fill-white text-[13px] font-black"
                paintOrder="stroke"
                stroke="#020617"
                strokeWidth="4"
              >
                {site.title}
              </text>
              <title>{`${site.title} - ${site.subtitle}`}</title>
            </g>
          );
        })}
      </svg>

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

          {isApplicationsLoading ? (
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

                return (
                  <a
                    key={application.id}
                    href={applicationSite?.url || "#"}
                    target={
                      application.openInNewTab &&
                      applicationSite?.url
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      application.openInNewTab &&
                      applicationSite?.url
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
                      <Icon size={24} />
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
