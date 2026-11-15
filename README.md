# DeliveryMate

**YOUR DELIVERY. YOUR NUMBERS.**

Mobile-first PWA for tracking delivery income, kilometres, fuel costs and net earnings.

## Run locally

Open `index.html` in a browser for a basic preview. For service-worker/offline testing, serve the folder over HTTP, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a new GitHub repository (e.g. `deliverymate`).
2. Upload all files and the `assets` folder from this project to the repository root.
3. In **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
4. Wait for GitHub Pages to publish the HTTPS URL.
5. Open that URL in Safari on iPhone, tap Share → **Add to Home Screen** → Add.

## Data and limitations

- Entries are saved locally in the browser using `localStorage` on that device.
- Export a JSON backup from Profile. Clearing Safari website data or changing browser/device can remove access to local entries; there is no cloud sync/account system yet.
- The app does not use GPS or read delivery platform apps automatically. Enter order totals and kilometres manually.
- Installability requires HTTPS; GitHub Pages provides HTTPS.
