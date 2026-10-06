import type { Metadata, Viewport } from "next";
import { Bai_Jamjuree, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/components/GameProvider";
import { TabBar } from "@/components/TabBar";
import { WatchlistProvider } from "@/components/WatchlistProvider";
import { IS_SAMPLE_DATA } from "@/lib/data";

// รีดีไซน์ทั้งหมดรอบที่ 2 (6 ต.ค. 2569): เปลี่ยนจาก "กระดานหุ้น LED" เป็นแนว Modern Fintech App
// (การ์ดโค้งมน/กระจกฝ้า, เงา, สี gradient ม่วง-มินต์) ตามที่เจ้าของเลือก "Option B" จาก 2 ตัวอย่างที่เสนอ
// เปลี่ยนฟอนต์ตัวเลข/หัวข้อจาก Martian Mono (ธีมจอ LED เดิม) เป็น Plus Jakarta Sans (เส้นสายเรขาคณิตหนาแน่น
// แบบแอป fintech ทั่วไป ไม่มี subset ภาษาไทยเหมือนเดิม จึงยัง fallback ไป Bai Jamjuree อัตโนมัติ)
// ยังคง CSS variable name เดิม (--font-chakra, --font-anuphan) ไว้เพราะทั้งเว็บอ้างอิงชื่อนี้อยู่ทุกที่ เปลี่ยนแค่ฟอนต์จริงที่ผูกไว้
const chakra = Plus_Jakarta_Sans({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-chakra",
  display: "swap",
});
const anuphan = Bai_Jamjuree({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-anuphan",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Market Impact", template: "%s | Market Impact" },
  description: "เข้าใจว่าเกิดอะไรขึ้นในตลาด ทำไม ใครได้รับผล และหลักฐานคืออะไร ข้อมูลเพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F4FC" },
    { media: "(prefers-color-scheme: dark)", color: "#090B13" },
  ],
};

// ตั้งโหมดสว่าง/มืดที่ผู้ใช้เลือกไว้ก่อนหน้าเว็บแสดง เพื่อไม่ให้จอกะพริบ
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${chakra.variable} ${anuphan.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {IS_SAMPLE_DATA && (
          <p className="demo">ตัวอย่างสำหรับทดลอง ข้อมูลและตัวเลขทุกตัวในเว็บนี้เป็นข้อมูลสมมติ ไม่ใช่ราคาจริง</p>
        )}
        <GameProvider>
          <WatchlistProvider>
            <main className="screen">
              <div className="wrap">{children}</div>
            </main>
            <TabBar />
          </WatchlistProvider>
        </GameProvider>
      </body>
    </html>
  );
}
