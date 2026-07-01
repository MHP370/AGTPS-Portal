import MapToolbar from "./MapToolbar";

export default function IranMap() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-b-3xl bg-gradient-to-br from-slate-950 to-slate-900">

      <MapToolbar />

      <div className="flex h-full items-center justify-center">

        <div className="text-center">

          <div className="mb-6 text-8xl">
            🇮🇷
          </div>

          <h2 className="text-3xl font-bold">
            Interactive Iran Map
          </h2>

          <p className="mt-3 text-gray-400">
            SVG Engine Loading...
          </p>

        </div>

      </div>

    </div>
  );
}
