"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

export default function GlobalEditFab() {
  const pathname = usePathname();

  // 홈페이지는 자체 FAB 보유 → 중복 방지
  if (pathname === "/") return null;

  return (
    <Link
      href="/?edit=1"
      title="홈페이지 편집"
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 9999,
        width: 46,
        height: 46,
        borderRadius: "50%",
        background: "rgba(0, 242, 255, 0.1)",
        border: "1px solid rgba(0, 242, 255, 0.35)",
        color: "#00F2FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(12px)",
        textDecoration: "none",
        transition: "background 0.3s, transform 0.3s, box-shadow 0.3s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(0, 242, 255, 0.22)";
        (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0, 242, 255, 0.4)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(0, 242, 255, 0.1)";
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <Pencil size={18} />
    </Link>
  );
}
