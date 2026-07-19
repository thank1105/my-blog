/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // Cover images are served from public/uploads/ which needs no remote
    // pattern. External URLs pasted into the admin form are allowed
    // through a small set of trusted domains so next/image can optimize
    // them at build time.
    remotePatterns: [
      // Common image hosting and CDN domains.
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
    ],
    // Also allow self-referencing for dev (localhost) and any production
    // domain. Adding the local upload path pattern so next/image knows
    // local static files are safe.
    unoptimized: false,
  },
};

export default nextConfig;