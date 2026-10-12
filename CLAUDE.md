# CLAUDE.md

Working notes and standing rules for Claude Code sessions in this repo (HolmSuite — the Holm hub landing site plus sub-sites like Oaty's Retreats, served via GitHub Pages).

## 🔴 End every turn with a TLDR (George, 2026-08-27)

Every response to George must end with a short TL;DR: what changed (or was found), and what's next (if anything). One or two lines is enough — it's an anchor for a long session, not a recap of the whole message.


## `musicroom/` — built output, don't hand-edit (2026-10-09)

`musicroom/` is The Music Room (Ipswich metal venue) loyalty-card + gigs PWA, served at
https://holmsuite.com/musicroom/. It is **compiled output** from the private Holm repo's `bar-app/`
folder — the source, database migrations and setup docs live there (`bar-app/README.md` § Hosting).
To update it: `npm run build:holmsuite` in `Holm/bar-app`, replace this folder with `dist-holmsuite/`,
PR, merge. Only the built app belongs here (this repo is public) — never source, and never any key
except the public Supabase publishable key the build already contains.

## `onthehuh/` — built output, don't hand-edit (2026-10-12)

`onthehuh/` is On The Huh café's loyalty-card + events PWA, served at https://holmsuite.com/onthehuh/
(George: "Make the on the huh version live", 2026-10-12). Same code and same rules as `musicroom/`: compiled
from Holm's `bar-app/` (brand `onthehuh`), rebuilt by `sync-web-builds.yml` as `sync-onthehuh` PRs. Every
live venue app gets a folder named after its venue id (Holm `bar-app/README.md` § Venues).

## `witstead/` — built output, don't hand-edit (2026-10-10)

`witstead/` is Witstead's web version, served at https://holmsuite.com/witstead/ (George's choice,
2026-10-10). It is **compiled output** from the private Holm repo's `apps/klu` (`expo export
--platform web` with `WITSTEAD_WEB_BASE_URL=/witstead`; steps in Holm `apps/klu/.claude/plan.md`
§ Web app). Same rule as `musicroom/`: only the built app, never source, never any key except the
public Supabase publishable key. The root `404.html` sends refreshes of Witstead's inner routes
back to `/witstead/`, and shows a plain "not found" everywhere else.

## 🔴 Never edit `witstead/` or `musicroom/` here: edit the app code in Holm (George, 2026-10-12)
George: "when working on the websites, unless it's something that only a Web build can use, the app codebase
is the one edited". These folders (and every venue folder, e.g. `onthehuh/`) are rebuilt from Holm by `sync-web-builds.yml`, which opens `sync-<site>` PRs
here, so a hand edit is overwritten on the next sync and never reaches the phone app. Make the change in Holm
(`apps/klu`, `packages/shared`, `bar-app`). Web-only behaviour goes there too, behind `Platform.OS === 'web'` or
in a `.web.tsx` file. Only site-level files (root `index.html`, `404.html`, `CNAME`, `ads.txt`, `.well-known/`,
`privacy/`, `terms/`, `ps-family/`, `oatyretreats/`, `scripts/`) are edited here directly. Merge an open
`sync-*` PR once its site check is green. Full rule: Holm `.claude/build.md`.

## `.well-known/assetlinks.json` — Android app trust file, shared (2026-10-09)

Tells Android which apps holmsuite.com trusts (Digital Asset Links). Currently one entry: The Music
Room APK (`com.holmsuite.musicroom`, built by Holm's `bar-apk.yml`), which makes it open full-screen
with no address bar. **Add to the array, never replace it** — the Holmstead Suite apps' own App Links
will need entries here too, and each Music Room APK rebuild adds a new signing fingerprint (see Holm
`bar-app/README.md` § Android APK).

## Branch clean-up (Lark 5, 2026-10-09; updated by Lark 8, 2026-10-11)

**Merged PRs now delete their own branch.** George ticked Settings → General → "Automatically delete
head branches" on 11 Oct 2026, about 03:50 BST (relayed by Lark 7; updated by Lark 8). After a merge there's
nothing to do. Cloud sessions still can't delete a branch directly (the sandbox's proxy returns 403), so for
a PR **closed without merging**, or a branch with no PR, run `.github/workflows/delete-branches.yml`
(workflow_dispatch) with the exact branch names. It refuses `main`.
