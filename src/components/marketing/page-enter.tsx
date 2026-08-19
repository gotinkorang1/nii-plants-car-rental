"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

export function PageEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [renderedPath, setRenderedPath] = useState(pathname);
  const [animate, setAnimate] = useState(false);

  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setAnimate(true);
  }

  return (
    <div key={pathname} className={animate ? "marketing-page-enter" : undefined}>
      {children}
    </div>
  );
}
