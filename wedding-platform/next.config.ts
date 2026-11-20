import type { NextConfig } from "next";

// Header keamanan dasar. HSTS sengaja tidak diatur di sini: HTTPS dipasang di reverse proxy (Caddy/Nginx)
// dan HSTS ditambahkan di sana setelah domain dan sertifikat dipastikan benar.
// CSP belum dipasang karena tema undangan memuat media dari URL yang diisi owner; lihat Knowledge Core/BACKEND.md.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
