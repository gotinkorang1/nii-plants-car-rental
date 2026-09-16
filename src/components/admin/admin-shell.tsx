"use client";

import { Menu, X } from "lucide-react";
import { useId, useRef } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { STAFF_ROLE_LABELS, type StaffRole } from "@/lib/auth/roles";

export type AdminShellUser = {
  displayName: string;
  email: string;
  role: StaffRole;
};

export function AdminShell({
  staff,
  children,
}: {
  staff: AdminShellUser;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuId = useId();
  const roleLabel = STAFF_ROLE_LABELS[staff.role];

  function openMenu() {
    dialogRef.current?.showModal();
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className="hidden min-h-screen border-r border-sidebar-border bg-sidebar px-4 py-6 lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
          <div className="px-3">
            <BrandLogo className="h-12 w-auto" />
            <p className="mt-2 text-xs text-muted-foreground">Staff console</p>
          </div>
          <div className="mt-8">
            <AdminNav role={staff.role} />
          </div>
        </aside>

        <div>
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-haspopup="dialog"
                aria-controls={menuId}
                onClick={openMenu}
              >
                <Menu />
                <span className="sr-only">Open navigation</span>
              </Button>
              <p className="text-sm font-medium lg:hidden">Staff console</p>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-medium">{staff.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {staff.email} · {roleLabel}
                </p>
              </div>
              <LogoutButton />
            </div>
          </header>

          <main id="admin-main" className="px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        id={menuId}
        className="max-h-dvh w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-lg backdrop:bg-foreground/40"
        aria-label="Admin navigation"
        onClose={closeMenu}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-medium">Menu</p>
          <Button type="button" variant="ghost" size="icon" onClick={closeMenu}>
            <X />
            <span className="sr-only">Close navigation</span>
          </Button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-3 py-4">
          <AdminNav onNavigate={closeMenu} role={staff.role} />
        </div>
      </dialog>
    </div>
  );
}
