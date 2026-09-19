COZY GAME DAY CLEAN REBUILD V9

THIS VERSION CHANGES THE NETWORK ARCHITECTURE:
- Modern Netlify .mjs function.
- The function itself owns /api/sports (no redirect required).
- The browser tries /api/sports first and /.netlify/functions/sports as a fallback.
- Every request has a timeout and real error handling.
- Old service workers/caches are unregistered and cleared.
- ESPN requests do not use date ranges.
- site.web.api.espn.com is primary; site.api.espn.com is fallback.
- Data Doctor tests BOTH Netlify routes separately.

UPLOAD THESE FILES, REPLACING OLD COPIES:
index.html
diagnostics.html
manifest.webmanifest
netlify.toml
netlify/functions/sports.mjs

IMPORTANT: DELETE netlify/functions/sports.js if it still exists in GitHub.
You should have sports.mjs, NOT sports.js.

After deploy:
1. /api/sports?feed=health should say cozy-game-day-clean-v9
2. /.netlify/functions/sports?feed=health should say cozy-game-day-clean-v9
3. /diagnostics.html should show green checks.
