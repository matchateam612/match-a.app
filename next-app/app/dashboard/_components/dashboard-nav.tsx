"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "../page.module.scss";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/dashboard/agent", label: "Agent", icon: "✦" },
  { href: "/dashboard/matches", label: "Matches", icon: "♡" },
  { href: "/dashboard/profile", label: "Profile", icon: "◌" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className={styles.bottomNav}>
      <div className={styles.bottomNavInner}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const className = isActive ? styles.navItemActive : styles.navItem;

          return (
            <Link className={className} href={item.href} key={item.label}>
              <span aria-hidden="true" className={styles.navIcon}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
