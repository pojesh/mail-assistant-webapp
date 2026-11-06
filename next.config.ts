import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run runs the minimal standalone server (see Dockerfile).
  output: "standalone",
  // NOTE: Cache Components is off: every page here renders user data fetched in the browser
  // (TanStack Query through the /api proxy), so there is nothing to prerender or cache.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
};

export default nextConfig;
