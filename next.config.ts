import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enabled per-environment rather than globally: the deploy pipeline sets
  // NEXT_OUTPUT_STANDALONE=1, local builds keep the default output.
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
  // Hosts other than localhost allowed to load the dev server (e.g. a phone on
  // the LAN), comma-separated. Development only; not needed on the server.
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
