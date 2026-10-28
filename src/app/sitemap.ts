import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";

// Every indexable page (same list as the navigation). Dynamic repository and contributor pages are left to links.
export const ROUTES = ["", "/explore", "/workspaces", "/commits", "/pulls", "/tasks", "/contributors", "/record", "/records", "/verify", "/token", "/developers", "/how-it-works", "/whitepaper"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((r) => ({ url: `${BRAND.url}${r}`, lastModified: now, changeFrequency: r === "" ? "daily" : "weekly", priority: r === "" ? 1 : 0.6 }));
}
