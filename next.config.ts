import type { NextConfig } from "next";
// @ts-expect-error - next-pwa does not have types
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  transpilePackages: ["pdfjs-dist"],
  images: {
    // No external domains needed for local-first
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // CSP: blobs allowed for pdf.js worker and images
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " + // unsafe-eval needed for dev/next.js, unsafe-inline for next scripts
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' blob: data:; " +
              "font-src 'self' data:; " +
              "connect-src 'self'; " +
              "worker-src 'self' blob:; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "frame-ancestors 'none';",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
