# BBA 2026 — Poster Landing Site

Static microsite for Dr Ganesh Hanumanthu's two posters at the British Burn Association Annual Meeting 2026 (Friday 19 June, Level 1 Foyer).

- **P117** · Lidocaine infusions in adult burn patients — `posters/p117-lidocaine.html`
- **P111** · Nebulised therapies for smoke inhalation injury — `posters/p111-smoke-inhalation.html`

The QR codes printed on the physical posters will resolve to the corresponding poster page on this site.

---

## Repository structure

```
bba-2026/
├── index.html                          ← landing page
├── styles.css                          ← shared stylesheet
├── posters/
│   ├── p117-lidocaine.html             ← P117 detail + references
│   └── p111-smoke-inhalation.html      ← P111 detail + references
├── files/
│   ├── P117.pdf                        ← lidocaine poster PDF (to be uploaded)
│   └── P111.pdf                        ← smoke inhalation poster PDF (to be uploaded)
└── README.md
```

---

## Deployment — GitHub Pages (free, permanent URL)

The whole site is plain HTML/CSS — no build step, no dependencies. To deploy:

### One-time setup

1. Create a GitHub account if you don't have one. Use a clean academic-looking username (e.g. `ganeshhanumanthu`, `ghanumanthu`, `drghanumanthu`).
2. Create a new **public** repository named `bba-2026`.
3. Upload everything in this folder to the repo (drag-and-drop in the GitHub web UI is fine).
4. Go to **Settings → Pages**. Under "Source", choose `Deploy from a branch`. Under "Branch", select `main` / root. Save.
5. Wait 1–2 minutes. GitHub will give you a URL of the form:

   ```
   https://<your-username>.github.io/bba-2026/
   ```

That's the URL the QR code will encode.

### After updating content

Edit any file via the GitHub web UI or push from your machine; GitHub Pages rebuilds automatically within a minute.

---

## Uploading the poster PDFs

After exporting each poster from its HTML source (Chrome → Print → Save as PDF, A0 portrait, background graphics on):

1. Rename them exactly: `P117.pdf` and `P111.pdf`.
2. Upload to the `files/` folder of the repo.
3. The download buttons on each poster's page will then work.

---

## QR code generation

Once GitHub Pages is live, the URLs you'll encode in the QR codes are:

- **P117 QR →** `https://<your-username>.github.io/bba-2026/posters/p117-lidocaine.html`
- **P111 QR →** `https://<your-username>.github.io/bba-2026/posters/p111-smoke-inhalation.html`

Generate the QR codes via any free tool (qr-code-monkey.com, goqr.me, qrcode-monkey.com). Download as SVG (vector — prints crisp at A0) or high-resolution PNG. Send the SVG/PNG to Claude and it can embed it directly into the poster HTML files, replacing the current placeholder QR.

---

## Custom domain (optional)

If you want a cleaner URL (e.g. `posters.hanumanthu.com`), buy a domain, point a CNAME at `<your-username>.github.io`, and add the custom domain in the GitHub Pages settings. Not necessary — the github.io URL is perfectly respectable.

---

Built 21 May 2026.
