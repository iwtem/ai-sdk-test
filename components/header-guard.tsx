"use client";

import { usePathname } from "next/navigation";
import { Header } from "~/components/header";

export function HeaderGuard() {
  const pathname = usePathname();
  if (pathname.startsWith("/documents/preview/")) {
    return null;
  }
  return <Header />;
}
