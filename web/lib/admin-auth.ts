// ตรวจสิทธิ์ endpoint ผู้ดูแลระบบ (migrate / seed / status / compute-* / cron)
// ใช้ ADMIN_SECRET แยกจาก CRON_SECRET เพื่อไม่ปนกับที่ Vercel Cron ยิงเข้ามาเอง

/** อ่านรหัสผ่านที่ฝั่งเบราว์เซอร์ส่งมา รองรับทั้ง header (เรียกจากโค้ด) และ query string ?secret=... (เปิดลิงก์ตรง ๆ ในเบราว์เซอร์ได้)
 * header เป็นรหัสผ่านจริงที่ encodeURIComponent มาก่อนเสมอ (HTTP header ส่งได้แค่ ASCII ถ้ารหัสผ่านมีภาษาไทย/อักขระอื่น
 * เบราว์เซอร์จะโยน error ทันทีตอนสร้าง request ถ้าไม่เข้ารหัสก่อน) ต้อง decode กลับก่อนเทียบเสมอ */
export function getManualSecret(request: Request): string | null {
  const fromHeader = request.headers.get("x-admin-secret");
  if (fromHeader !== null) {
    try {
      return decodeURIComponent(fromHeader);
    } catch {
      return fromHeader;
    }
  }
  return new URL(request.url).searchParams.get("secret");
}

export function checkAdminSecret(request: Request): Response | null {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    return Response.json({ error: "ยังไม่ได้ตั้งค่า ADMIN_SECRET บนเซิร์ฟเวอร์นี้" }, { status: 503 });
  }
  if (getManualSecret(request) !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
