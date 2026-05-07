import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: "http://192.168.88.30:22026/:path*",
      },
      // {
      //   source: "/media/:path*",
      //   destination: "http://192.168.88.156:13100/:path*",
      // },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
