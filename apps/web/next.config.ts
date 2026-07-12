import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.16.16.160"],
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
};

export default nextConfig;
