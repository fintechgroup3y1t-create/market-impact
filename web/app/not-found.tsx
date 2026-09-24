import Link from "next/link";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="notfound">
      <h1 className="mood" style={{ fontSize: 30 }}>ไม่พบหน้านี้</h1>
      <p className="muted" style={{ marginTop: 8 }}>ลิงก์อาจผิด หรือเรื่องนี้ยังไม่เผยแพร่</p>
      <Link className="cta" href="/">กลับไปหน้าตลาดวันนี้</Link>
      <Footer />
    </div>
  );
}
