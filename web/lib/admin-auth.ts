// ตรวจสิทธิ์ endpoint ผู้ดูแลระบบ (migrate / seed / status)
// ใช้ ADMIN_SECRET แยกจาก CRON_SECRET เพื่อไม่ปนกับที่ Vercel Cron ยิงเข้ามาเอง

export function checkAdminSecret(request: Request): Response | null {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    return Response.json({ error: "ยังไม่ได้ตั้งค่า ADMIN_SECRET บนเซิร์ฟเวอร์นี้" }, { status: 503 });
  }
  // รองรับทั้ง header (เรียกจากโค้ด) และ query string ?secret=... (เปิดลิงก์ตรง ๆ ในเบราว์เซอร์ได้)
  const got = request.headers.get("x-admin-secret") ?? new URL(request.url).searchParams.get("secret");
  if (got !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
