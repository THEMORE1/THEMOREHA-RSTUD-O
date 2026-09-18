# The More Hair Studio — Website

A single static site: hero, services, about, team, gallery, a 5-step
booking wizard, and TR/EN/RU language switching. No backend, no build
step — plain HTML/CSS/JS.

```
index.html        →  the page (markup only, links out to css/ and js/)
css/style.css      →  all styling
js/translations.js →  the TR/EN/RU dictionary + language-switch engine
js/booking.js       →  the booking wizard (calendar, slots, .ics + WhatsApp)
js/menu.js          →  mobile nav toggle
js/services-link.js →  clicking a homepage service card jumps into the booking wizard
images/             →  all photos used on the page
```

## Deploy

Any static host works — drag-and-drop the whole folder, or connect the
GitHub repo:

**GitHub Pages**
```bash
git init
git add .
git commit -m "The More Hair Studio site"
git branch -M main
git remote add origin https://github.com/<your-username>/the-more-hair-studio.git
git push -u origin main
```
Then in the repo: Settings → Pages → deploy from `main` / root. Live at
`https://<your-username>.github.io/the-more-hair-studio/`.

**Netlify / Vercel** — connect the repo (or drag-and-drop the folder in
Netlify's dashboard) with no build command and `index.html` as the
publish root. `vercel.json` and `_redirects` are included for parity
with hosts that expect them, though this site has no client-side
routes that need rewriting (it's one page with `#anchor` links).

## Booking system — current state

The wizard collects service, staff, date and time (respecting business
hours, Tuesday closed) and on confirm gives the visitor a downloadable
`.ics` calendar file and a pre-filled WhatsApp message to the chosen
stylist. It does **not** check a live calendar for conflicts — two
people could pick the same slot. Turning that into a real
conflict-checked booking synced to Google Calendar needs a small
backend (a serverless function with a Google service account) — see
`claude-code-handoff.md` from the chat that built this for the exact
steps, or use Google Calendar's own "Appointment Schedule" feature and
embed it instead.

## Local preview

No build needed — open `index.html` directly in a browser, or serve
the folder (`python3 -m http.server`) so relative image paths resolve
the same way they will in production.
