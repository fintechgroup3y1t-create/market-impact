import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js ไม่รู้เองว่าต้องแนบไฟล์ .sql/.json ใน db/migrations ไปกับ /api/admin/migrate
  // เพราะไม่มีการ import ไฟล์พวกนี้ในโค้ด ต้องระบุให้รวมไปด้วยตรง ๆ
  outputFileTracingIncludes: {
    "/api/admin/migrate": ["./db/migrations/**/*"],
  },
};

export default nextConfig;
