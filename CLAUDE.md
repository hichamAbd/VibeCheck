# VibeCheck: notes for future sessions

## Brief
A mood tracker web app for one owner (hichamAbd, a non-developer on iPhone, no Mac).
Friends open a shared link to see the owner's mood. Only the owner can post.
Data is stored encrypted.

## Decisions from the interview (Nov 2026)
- Kind: web app on GitHub Pages, added to the iPhone Home Screen.
- Name: VibeCheck. Language: English or French, following each visitor's phone language (`js/i18n.js`).
- Look: "Comic" (changed on the owner's request, who found the first round-face sticker diary too girly: keep it bold
  and cartoonishly tough). The page is a bold halftone colour that changes with the season. Content sits in white comic panels
  with 3px ink outlines and hard shadows. The date is a yellow caption box, and the comment is in a speech bubble.
  Dark mode deepens the background and uses dark panels. Typeface: the iPhone's rounded system font (`ui-rounded`) at heavy weights, with no font files.
- Mascot: **Moody McMugface**, a chunky diner mug with stubble and a chipped rim (`js/art.js`, `face(m)`).
  Great: aviators and a toothy grin, 3 puffs of steam. Good: one raised brow and a smirk. Okay: heavy lids and a flat mouth.
  Bad: a furrowed frown and a coffee drip. Awful: gritted teeth, a crack, a band-aid and smoke. 0 (nothing yet): asleep.
  Mood colours: 1 #D8392B, 2 #3D78D8, 3 #9AA6BA, 4 #2FB565, 5 #FFB21A (also used in the year grid).
- Moods: 5 levels (1 Awful … 5 Great), an optional comment of up to 140 characters, and several posts per day allowed.
- Friends see **today's moods only** (the latest one big, then "Earlier today"). They cannot post.
- Owner: PIN to post, a "Just me" switch per mood (never shown to friends), a year grid dashboard
  (tap a day to see, edit or delete its moods), and a backup file.
- Themes: seasons (northern hemisphere), New Year (31 Dec to 1 Jan), April Fools (1 Apr: the face is upside down until tapped),
  Halloween (24 to 31 Oct: witch hat), Christmas (18 to 26 Dec: Santa hat), New Year (party hat). **No personal dates**: the owner explicitly
  excluded birthdays and Valentine's Day. Preview any look with `?look=winter` (autumn, winter, spring,
  summer, halloween, christmas, newyear, aprilfools).
- Hidden surprises: peel the 4 seasonal stickers (a doodle shows underneath, and peeling all 4 sets off confetti), poke
  Moody (3 pokes get a message, 5 make him spin), a rare ladybug, letters that wave when the wordmark is tapped,
  and confetti on New Year.

## How it works
- `data/today.json`: `{v,iv,ct}`, AES-256-GCM with the **friends' key** (`ks`). Holds `{v,d,tz,at,entries:[{t,m,c}]}`
  for the owner's current day, with private entries removed. The friends' key lives in the share link fragment
  `#k=<base64url>`, which is never sent to a server. It is also kept in localStorage `vibecheck.shareKey`.
- `data/vault.json`: the full history `{v,rev,tz,entries:[{id,t,d,m,c,p,u?}]}`, encrypted with the **owner key** (`ko`).
- Owner device bundle: localStorage `vibecheck.owner`, which holds `{token, ko, ks, tz, tokenSetAt}`,
  encrypted with PBKDF2-SHA256 (600k iterations) from the 6-digit PIN. After 3 wrong PINs a growing wait applies.
  The app locks itself after 5 minutes in the background.
- Saving: the owner's phone calls the GitHub REST API directly with a fine-grained token (Contents: write on this
  repo only). It re-reads `vault.json`, applies the change, then writes both files in **one commit** to `gh-pages`
  (Git Data API: tree, then commit, then ref). It retries if the ref moved. Pages rebuilds, and friends see the change in a minute or two.
- Backup file: `{app:'vibecheck',kind:'backup',keys:<PIN-encrypted {ko,ks}>,vault:<ko-encrypted vault>}`.
  On a new phone, setup finds the existing vault and asks for the backup file and its PIN. It merges anything missing.
  "Start over" creates new keys, which kills the old history and the old friends' link.
- Known limit, accepted by the owner: old versions of `today.json` stay in git history, encrypted with the friends' key, so a
  technical friend could recover past days' shared lists. Commit times are public. The vault is safe.
- Owner entrance: open `…/VibeCheck/#owner`, or press and hold the wordmark for 0.7 s. Once set up, an "Unlock" pill appears in the header.

## House rules (apply silently)
- Light and dark follow the phone. No manual switch.
- No tracking, analytics, ads, accounts or cookies, and no outside requests. The CSP in `index.html` allows only `'self'`,
  plus `connect-src https://api.github.com`, which is needed for the owner's posting. Keep it that way.
- Never put personal details, real moods, tokens or keys in the repo, the sample content or commit messages.
- Every storage key, cache name and DB name starts with `vibecheck` (all of the owner's apps share hichamabd.github.io).
- iPhone fit: safe areas, inputs of 16px or more, touch targets of 44px or more, reduced motion respected.
- Plain HTML/CSS/JS, no build step. The repo holds exactly what runs. Relative links only.
- No inline `style="…"` in markup (the CSP blocks it). Set styles through CSSOM (`el.style.setProperty`) or classes.
  User text always goes through `textContent`.

## Files
`index.html`, `css/app.css`, `js/app.js` (state, rendering, flows), `js/art.js` (all drawings: Moody McMugface, seasonal
stickers with ink outlines, icons), `js/crypto.js`, `js/github.js`, `js/i18n.js`, `js/season.js`, `sw.js` (offline), `manifest.webmanifest`,
`icons/` (generated from `icons/icon.svg` with rsvg-convert), `dev/` (local test tools, not part of the app).

## Publishing
- Single branch `gh-pages`. Push straight to it (standing permission). GitHub Pages serves it at
  https://hichamabd.github.io/VibeCheck/. The owner's phone also commits `data/*.json` to this branch, so
  **always `git pull --rebase` (or fetch) before pushing code**, and never touch `data/`.
- When app files change, bump `CACHE` in `sw.js` (`vibecheck-vN`) so phones pick up the new version.
- Check that it's live: `gh api repos/hichamAbd/VibeCheck --jq .has_pages` and the latest "pages build and deployment" run.

## Testing
`dev/serve.sh &` then `python3 -I dev/e2e.py /tmp/shots`. Playwright with Chrome, at iPhone size, and a fake GitHub API.
It covers setup, posting, a private mood, the friend view (light, dark, 320px, French), a wrong link, the year grid, edit and delete,
lock and unlock, restore on a second phone, an expired key, the surprises, and every seasonal look.
