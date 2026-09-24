// รันจากเครื่อง: npm run db:seed (ต้องตั้ง DATABASE_URL ใน .env.local ก่อน)
// ตรรกะจริงอยู่ที่ runSeed() ใน db/seed.ts ไฟล์นี้แค่เป็นทางเข้าจาก command line

import "dotenv/config";
import { getDb } from "./client";
import { runSeed } from "./seed";

runSeed(getDb())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
