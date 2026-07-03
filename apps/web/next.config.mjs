/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Widget files are embedded on arbitrary third-party origins; module
        // scripts are CORS-gated, so they must be served with open CORS.
        source: "/:file(w.js|widget.core.js)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
      {
        // App pages must never render inside a frame (clickjacking): a
        // framed dashboard could trick a logged-in author into destructive
        // clicks. Scripts (above) are unaffected by frame-ancestors.
        source: "/((?!w\\.js|widget\\.core\\.js).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
