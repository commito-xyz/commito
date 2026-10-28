/*
 * Every brand image path in one place. All files are built from the owner's artwork (a "C" made of white square pixels
 * and the "COMMITO" word mark typed in characters) by the project's brand script; the hero art reads the same pixel grid
 * from src/content/mark-grid.ts. The mark is white, so every slot that may sit on a light background uses the dark plate.
 */
export const ASSETS = {
  /** Mark, transparent, white (header, footer; the site is dark only). */
  mark: "/brand/mark.webp",
  /** Mark on the dark rounded plate (avatars, anywhere the background may be light). */
  markSquare: "/brand/mark-square.webp",
  /** Owner word mark "COMMITO", white characters on transparent (token page). 1120x231. */
  wordmark: "/brand/wordmark.webp",
  /** Square PNG served by Next from src/app/icon.png (dark plate; structured data needs a PNG logo). */
  icon: "/icon.png",
  /** Same file, kept under the name the structured data uses. */
  logoPng: "/icon.png",
  /** Share card served from src/app/opengraph-image.jpg (owner word mark + slogan); twitter-image.jpg is the same image. */
  og: "/opengraph-image.jpg",
} as const;
