"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function tabOf(path: string): string {
  if (path.startsWith("/search")) return "search";
  if (path.startsWith("/calendar")) return "calendar";
  if (path.startsWith("/portfolio")) return "portfolio";
  return "home"; // หน้าเหตุการณ์และหน้าหุ้นนับเป็นส่วนของ "ตลาดวันนี้"
}

export function TabBar() {
  const active = tabOf(usePathname() ?? "/");
  return (
    <nav className="tabbar" aria-label="เมนูหลัก">
      <Link href="/" className={active === "home" ? "on" : undefined} aria-current={active === "home" ? "page" : undefined}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4v16M12 4v6l7 7v3" /><circle cx="5" cy="12" r="2.2" fill="var(--paper)" /><circle cx="12" cy="8" r="2.2" fill="var(--paper)" /></svg>
        <span>ตลาดวันนี้</span>
      </Link>
      <Link href="/search" className={active === "search" ? "on" : undefined} aria-current={active === "search" ? "page" : undefined}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <span>ค้นหุ้น</span>
      </Link>
      <Link href="/calendar" className={active === "calendar" ? "on" : undefined} aria-current={active === "calendar" ? "page" : undefined}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>
        <span>ปฏิทิน</span>
      </Link>
      <Link href="/portfolio" className={active === "portfolio" ? "on" : undefined} aria-current={active === "portfolio" ? "page" : undefined}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></svg>
        <span>พอร์ต</span>
      </Link>
    </nav>
  );
}
