import Image from "next/image";

export default function Logo({
  compact = false,
  logo = "/images/logo/apgt-logo.png",
  companyName = "شرکت مخازن سبز پتروشیمی عسلویه",
  subtitle = "Assaluyeh Petrochemical Green Tanks Company",
}: {
  compact?: boolean;
  logo?: string | null;
  companyName?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-4">
      <Image
        src={logo || "/images/logo/apgt-logo.png"}
        alt="APGT Logo"
        width={compact ? 48 : 64}
        height={compact ? 48 : 64}
        unoptimized={Boolean(logo?.startsWith("/uploads/"))}
        priority
      />

      <div>
        <h2
          className={`font-bold text-white ${compact ? "text-sm leading-6" : "text-lg"}`}
        >
          {companyName}
        </h2>

        <p className={compact ? "text-xs text-gray-400" : "text-sm text-gray-400"}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
