RESTORING `hero-food.jpg` (BiteBest frontend)

Goal: Place an image named `hero-food.jpg` inside the `frontend/public/` folder so the homepage hero displays it.

1) Image requirements
- File name: `hero-food.jpg` (exact)
- Location: `frontend/public/`
- Recommended size: 1200x800 or at least 560x420
- Keep file size reasonable (< 1MB) for dev/testing

2) How to add the image in VS Code
- Open the Explorer (left sidebar).
- Expand the `frontend` folder, then the `public` folder.
- Drag your image file from your OS file manager into the `frontend/public/` folder in VS Code Explorer.
- Confirm the file appears as `frontend/public/hero-food.jpg` in the Explorer tree.

3) Verify the static file is served locally
- Start your dev server from the `frontend` folder (if not running):

```bash
cd frontend
npm run dev
```

- Open this URL in your browser to verify the file is directly reachable:

http://localhost:3000/hero-food.jpg

If you see the image, proceed to the next step.

4) Homepage uses Next.js `Image`
- The homepage component already imports `Image` from `next/image`.
- The hero `Image` tag should look like this:

```tsx
import Image from "next/image";

<Image
 src="/hero-food.jpg"
 alt="Food comparison"
 width={560}
 height={420}
 className="rounded-[32px] object-cover shadow-lg border-2 border-[#DDD2BD]"
/>
```

Ensure `src` is exactly `/hero-food.jpg` (leading slash). Do NOT use relative paths like `./hero-food.jpg` or `public/hero-food.jpg`.

5) Troubleshooting if the image is not visible
- Confirm file name is exactly `hero-food.jpg` and not `hero-food.JPG` or `hero-food.jpeg`.
- Confirm the file is inside the `frontend/public/` folder.
- Try to open the direct URL above. If it returns 404 or error:
  - Restart the dev server (Ctrl+C then `npm run dev`).
  - Clear browser cache and hard reload (Ctrl+Shift+R / Ctrl+F5).
- If the direct URL loads but the homepage still does not show the image:
  - Confirm the page source contains the `<img>` or `<Image>` markup referencing `/hero-food.jpg`.
  - Check browser console for loading or MIME errors.

6) Quick restart commands

```bash
# stop the running server (press Ctrl+C in the terminal running it)
cd frontend
npm run dev
```

7) Need help?
If you want, I can create a temporary placeholder image named `hero-food.jpg` inside `frontend/public/` so the hero shows immediately. Tell me to proceed and I'll add it for you.
