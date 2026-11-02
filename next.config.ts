import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enabled per-environment rather than globally: the test pipeline sets
  // NEXT_OUTPUT_STANDALONE=1 so production keeps its current output until the
  // standalone bundle is proven on the test server.
  output: process.env.NEXT_OUTPUT_STANDALONE === "1" ? "standalone" : undefined,
  // Identifies this build to components/Modules/useUpdateAvailable.ts. GitHub
  // Actions sets GITHUB_SHA, so a local build or dev server has no version and
  // never offers an update.
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.GITHUB_SHA ?? "",
  },
  // Makes a navigation in a tab left open across a deploy a full page load, since
  // the release swap removes the JS chunks and server actions the tab knows about
  deploymentId: process.env.GITHUB_SHA,
  allowedDevOrigins: ["192.0.2.34", "192.0.2.12"],
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
