import Link from "next/link";

import styles from "../page.module.scss";

const navItems = [
  { href: "/dashboard", label: "Agent", icon: "✦", active: true },
  { href: "/dashboard/matches", label: "Matches", icon: "♡", active: false },
  { href: "#", label: "Discover", icon: "⌁", active: false },
  { href: "/signin", label: "Profile", icon: "◌", active: false },
] as const;

export function DashboardNav() {
  return (
    <nav aria-label="Primary" className={styles.bottomNav}>
      <div className={styles.bottomNavInner}>
        {navItems.map((item) => {
          const className = item.active ? styles.navItemActive : styles.navItem;

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
