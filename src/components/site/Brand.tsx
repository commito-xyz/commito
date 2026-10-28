import Link from "next/link";
import { ASSETS } from "@/config/assets";
import { BRAND } from "@/config/brand";

/** Lockup: mark + name in the mono face. */
export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`cm-brand ${className}`} aria-label={`${BRAND.name} home`}>
      <img src={ASSETS.mark} alt="" width={28} height={28} />
      <span>{BRAND.name}</span>
    </Link>
  );
}
