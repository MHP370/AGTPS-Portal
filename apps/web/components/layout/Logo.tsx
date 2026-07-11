import Image from "next/image";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-4">
      <Image
        src="/images/logo/apgt-logo.png"
        alt="APGT Logo"
        width={compact ? 48 : 64}
        height={compact ? 48 : 64}
        priority
      />

      <div>
        <h2
          className={`font-bold text-white ${compact ? "text-sm leading-6" : "text-lg"}`}
        >
          شرکت مخازن سبز پتروشیمی عسلویه
        </h2>

        <p className={compact ? "text-xs text-gray-400" : "text-sm text-gray-400"}>
          Assaluyeh Petrochemical Green Tanks Company
        </p>
      </div>
    </div>
  );
}
