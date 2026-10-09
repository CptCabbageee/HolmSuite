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
