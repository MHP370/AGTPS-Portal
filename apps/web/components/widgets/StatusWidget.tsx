type StatusWidgetProps = {
  title: string;
  value: string;
  color: string;
};

export default function StatusWidget({
  title,
  value,
  color,
}: StatusWidgetProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <p className="text-sm text-gray-400">{title}</p>

      <div className="mt-3 flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${color}`} />

        <h3 className="text-2xl font-bold">
          {value}
        </h3>
      </div>
    </div>
  );
}
