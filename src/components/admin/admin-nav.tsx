"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { StaffRole } from "@/lib/auth/roles";
import { canManageRates } from "@/lib/availability/permissions";
import { canViewBookings } from "@/lib/bookings/permissions";
import { canViewCustomers } from "@/lib/customers/permissions";
import { canViewEnquiries } from "@/lib/enquiries/permissions";
import {
  canViewMaintenance,
  canViewOperations,
  canViewSecurityDeposits,
} from "@/lib/operations/permissions";
import { canViewPayments } from "@/lib/payments/permissions";
import { canManageStaff } from "@/lib/staff/permissions";
import { cn } from "@/lib/utils";

export type AdminNavItem = {
  label: string;
  href?: string;
  exact?: boolean;
  children?: AdminNavItem[];
  visible?: (role: StaffRole) => boolean;
};

export const adminNavigation: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Bookings", href: "/admin/bookings", visible: canViewBookings },
  { label: "Enquiries", href: "/admin/enquiries", visible: canViewEnquiries },
  {
    label: "Fleet",
    children: [
      { label: "Vehicle Classes", href: "/admin/fleet/classes" },
      { label: "Vehicle Models", href: "/admin/fleet/models" },
      { label: "Vehicles", href: "/admin/fleet/vehicles" },
    ],
  },
  { label: "Availability", href: "/admin/availability" },
  {
    label: "Rates & Extras",
    visible: canManageRates,
    children: [
      { label: "Rates", href: "/admin/rates", exact: true },
      { label: "Extras", href: "/admin/rates/extras" },
      { label: "Promotions", href: "/admin/rates/promotions" },
    ],
  },
  { label: "Customers", href: "/admin/customers", visible: canViewCustomers },
  { label: "Payments", href: "/admin/payments", visible: canViewPayments },
  {
    label: "Security deposits",
    href: "/admin/deposits",
    visible: canViewSecurityDeposits,
  },
  {
    label: "Operations",
    visible: canViewOperations,
    children: [
      { label: "Active rentals", href: "/admin/operations/rentals" },
      { label: "Maintenance", href: "/admin/maintenance", visible: canViewMaintenance },
    ],
  },
  {
    label: "Website",
    children: [
      { label: "Pages", href: "/admin/content/pages" },
      { label: "News & video", href: "/admin/content/stories" },
      { label: "Gallery", href: "/admin/content/gallery" },
      { label: "FAQs", href: "/admin/content/faqs" },
      { label: "Media", href: "/admin/content/media" },
    ],
  },
  { label: "Settings", href: "/admin/settings/site" },
  { label: "Staff", href: "/admin/staff", visible: canManageStaff },
];

function NavItem({
  item,
  onNavigate,
  pathname,
}: {
  item: AdminNavItem;
  onNavigate?: () => void;
  pathname: string;
}) {
  if (item.href) {
    const current =
      item.exact || item.href === "/admin"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={cn(
          "block rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
          current && "bg-sidebar-accent text-sidebar-accent-foreground",
        )}
      >
        {item.label}
      </Link>
    );
  }

  if (item.children?.some((child) => child.href)) {
    return (
      <p className="px-3 py-2 text-sm font-medium text-sidebar-foreground">
        {item.label}
      </p>
    );
  }

  return (
    <span
      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground"
      title="Available in a later phase"
    >
      {item.label}
      <span className="sr-only">, available in a later phase</span>
    </span>
  );
}

function filterNavItems(items: AdminNavItem[], role?: StaffRole): AdminNavItem[] {
  return items
    .filter((item) => !role || !item.visible || item.visible(role))
    .map((item) =>
      item.children
        ? {
            ...item,
            children: filterNavItems(item.children, role),
          }
        : item,
    )
    .filter((item) => !item.children || item.children.length > 0);
}

export function AdminNav({
  id,
  onNavigate,
  role,
}: {
  id?: string;
  onNavigate?: () => void;
  role?: StaffRole;
}) {
  const pathname = usePathname();
  const items = filterNavItems(adminNavigation, role);

  return (
    <nav id={id} aria-label="Admin" className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <NavItem item={item} onNavigate={onNavigate} pathname={pathname} />
          {item.children ? (
            <ul className="mt-1 ml-3 space-y-1 border-l border-sidebar-border pl-3">
              {item.children.map((child) => (
                <li key={child.label}>
                  <NavItem
                    item={child}
                    onNavigate={onNavigate}
                    pathname={pathname}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </nav>
  );
}
