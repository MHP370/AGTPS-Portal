import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-4">
      <Image
        src="/images/logo/apgt-logo.png"
        alt="APGT Logo"
        width={64}
        height={64}
        priority
      />

      <div>
        <h2 className="text-lg font-bold text-white">
          شرکت مخازن سبز پتروشیمی عسلویه
        </h2>

        <p className="text-sm text-gray-400">
          Assaluyeh Petrochemical Green Tanks Company
        </p>
      </div>
    </div>
  );
}
