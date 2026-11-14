# VibeCheck

A comic-book page that shows how I'm feeling today, told by Moody McMugface, a tough little coffee mug. The colours change with the seasons.

**Live:** https://hichamabd.github.io/VibeCheck/

## How it works

- **Friends** open the link I send them (it ends with `#k=…`). They see today's moods only: Moody's expression, the time, and a short comment in a speech bubble.
- **Me:** I post from the app on my iPhone. I pick one of Moody's 5 moods, add a few words, and can mark a mood "Just me". My private side has a year grid, where I can tap any day to see, edit or delete its moods.

## Install on iPhone

1. Open https://hichamabd.github.io/VibeCheck/#owner in Safari.
2. Tap Share, then Add to Home Screen.
3. Open VibeCheck from the Home Screen and follow the setup (GitHub key, then a 6-digit PIN).
4. Save the backup file and share the friends' link from the setup screen.

If the setup screen doesn't appear, press and hold the VibeCheck label at the top.

## What it stores, and where

- **On GitHub, in this repository (`data/`):** two encrypted files (AES-256-GCM). `today.json` holds today's shared moods and opens with the friends' link. `vault.json` holds the whole history and opens only with a key that never leaves my phone and my backup file. GitHub can see *when* I post, but not *what* I post.
- **On my phone:** my GitHub key and both encryption keys, locked with my PIN.
- **On friends' phones:** the friends' key from the link, plus the last moods they saw, so the page also works offline.

There is no tracking, no account, no ads and no cookies. The page only loads its own files. The one exception is the owner's phone, which talks to GitHub to save moods.
