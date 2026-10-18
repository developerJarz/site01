# site01

## Image storage

Install dependencies with `npm install`. Set the server-only `CLOUDINARY_URL` in
`.env` for development and in your hosting provider's environment settings for
production, then restart/redeploy the app. Use the URL from your Cloudinary
console; never prefix it with `NEXT_PUBLIC_` or commit real credentials.

Profile settings include a photo preview, upload, replacement and removal.
Only the signed-in account can change its photo; old Cloudinary avatars are
removed after a successful replacement. Listing photos also use Cloudinary.
Existing image URLs continue to work, and verification papers retain their
existing storage flow.

Raster photos up to 25 MB are accepted. Large photos are reduced in the browser
before transfer, then validated and processed with sharp on the server. Profile
photos are square, up to 512 px; listing photos fit within 2048 × 2048 px.
The stored output is high-quality WebP (quality 85, effort 6), with phone
orientation corrected and EXIF/location metadata removed. Animated uploads
become still images. This aims for a small file with good visual quality;
resizing and lossy compression are not mathematically lossless.

The Cloudinary hostname is allowed in `next.config.ts` and `netlify.toml`.
If you change the cloud name, update the Cloudinary path in `next.config.ts`
and `src/components/CarImage.tsx` as well. No unsigned upload preset is needed.
