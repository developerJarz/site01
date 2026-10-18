# Watermark fonts

Used on the server to draw the listing-photo watermark (`src/lib/watermark.ts`). They ship with the
app (see `outputFileTracingIncludes` in `next.config.ts`) so text renders the same on every host.

All are licensed under the SIL Open Font License 1.1 (https://openfontlicense.org), which allows
bundling them with software. Sources:

| File | Family | Source |
| --- | --- | --- |
| geist.ttf | Geist | Vercel, via `next/dist/compiled/@vercel/og` |
| poppins.ttf, poppins-bold.ttf | Poppins | github.com/google/fonts `ofl/poppins` |
| anton.ttf | Anton | github.com/google/fonts `ofl/anton` |
| bebas-neue.ttf | Bebas Neue | github.com/google/fonts `ofl/bebasneue` |
| archivo-black.ttf | Archivo Black | github.com/google/fonts `ofl/archivoblack` |
| dm-serif-display.ttf | DM Serif Display | github.com/google/fonts `ofl/dmserifdisplay` |
| lobster.ttf | Lobster | github.com/google/fonts `ofl/lobster` |
| courier-prime.ttf | Courier Prime | github.com/google/fonts `ofl/courierprime` |

To add a font: drop the TTF here and add it to `WATERMARK_FONTS` in `src/lib/site-config.ts` with
its exact family name (and weight, for bold files).
