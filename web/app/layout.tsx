import type { Metadata, Viewport } from "next";
import { Anuphan, Chakra_Petch } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/components/GameProvider";
import { TabBar } from "@/components/TabBar";
import { WatchlistProvider } from "@/components/WatchlistProvider";
import { IS_SAMPLE_DATA } from "@/lib/data";

const chakra = Chakra_Petch({
  weight: ["500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-chakra",
  display: "swap",
});
const anuphan = Anuphan({
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
    { media: "(prefers-color-scheme: light)", color: "#EEF1F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1420" },
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
