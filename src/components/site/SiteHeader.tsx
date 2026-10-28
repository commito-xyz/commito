"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BRAND, hasGithub } from "@/config/brand";
import { Brand } from "@/components/site/Brand";
import { CaPill } from "@/components/site/CaCopy";
import { ChevronDown, CloseIcon, GitHubLogo, MenuIcon, XLogo } from "@/components/site/Icons";
import { EXPLORE_NAV, TOP_NAV } from "@/components/site/nav";
import { NavWallet } from "@/components/wallet/WalletButton";

const inExplore = (path: string) => EXPLORE_NAV.some((n) => path === n.href || path.startsWith(`${n.href}/`)) || path.startsWith("/repo/") || path.startsWith("/contributor/") || path.startsWith("/workspace");

export function SiteHeader() {
  const path = usePathname() ?? "/";
  // The drawer and the menu remember the path they were opened on, so navigating closes them without an effect.
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const [menuOn, setMenuOn] = useState<string | null>(null);
  const drawer = drawerOn === path;
  const menu = menuOn === path;
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const out = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOn(null);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOn(null);
    document.addEventListener("mousedown", out);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", out);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  return (
    <header className="cm-top">
      <a href="#main" className="cm-skip">
        Skip to content
      </a>
      <div className="cm-wrap cm-bar">
        <Brand />
        <nav className="cm-nav" aria-label="Main">
          <div className="cm-navmenu" ref={menuRef}>
            <button type="button" className={`cm-link${inExplore(path) ? " on" : ""}`} aria-expanded={menu} aria-haspopup="true" onClick={() => setMenuOn(menu ? null : path)} data-testid="explore-menu">
              Explore <ChevronDown size={12} />
            </button>
            {menu ? (
              <div className="cm-navmenu-panel" role="menu">
                {EXPLORE_NAV.map((n) => (
                  <Link key={n.href} href={n.href} role="menuitem" className={`cm-navmenu-item${path === n.href ? " on" : ""}`} onClick={() => setMenuOn(null)}>
                    <b>{n.label}</b>
                    <span>{n.blurb}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {TOP_NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`cm-link${path === n.href ? " on" : ""}`} aria-current={path === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="cm-bar-end">
          <CaPill className={path === "/token" ? "on" : ""} />
          {hasGithub ? (
            <a href={BRAND.github} target="_blank" rel="noreferrer" className="cm-icon" aria-label={`${BRAND.name} on GitHub`}>
              <GitHubLogo size={18} />
            </a>
          ) : null}
          <a href={BRAND.x} target="_blank" rel="noreferrer" className="cm-icon" aria-label={`${BRAND.name} on X`}>
            <XLogo size={16} />
          </a>
          <NavWallet />
          <Link href="/record" className="cm-btn lime sm ml-1.5 max-[1200px]:hidden" data-testid="nav-cta">
            Record work
          </Link>
        </div>
        <button type="button" className="cm-burger" aria-label={drawer ? "Close menu" : "Open menu"} aria-expanded={drawer} onClick={() => setDrawerOn(drawer ? null : path)} data-testid="burger">
          {drawer ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
        </button>
      </div>
      <nav className={`cm-drawer${drawer ? " open" : ""}`} aria-label="Menu">
        {[...EXPLORE_NAV, ...TOP_NAV, { href: "/token", label: BRAND.symbol }].map((n) => (
          <Link key={n.href} href={n.href} className={`dl${path === n.href ? " on" : ""}`}>
            {n.label}
          </Link>
        ))}
        <div className="row">
          <CaPill />
          <NavWallet />
          <a href={BRAND.x} target="_blank" rel="noreferrer" className="cm-icon" aria-label={`${BRAND.name} on X`}>
            <XLogo size={16} />
          </a>
        </div>
      </nav>
    </header>
  );
}
