import path from "node:path";
import { defineConfig } from "vitest/config";

// ตั้งค่า alias "@/" ให้ตรงกับ tsconfig.json เพื่อให้เทสต์ import โค้ดจริงได้แบบเดียวกับแอป
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "node",
  },
});
