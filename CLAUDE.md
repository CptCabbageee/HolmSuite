# CLAUDE.md

## Session handoff convention

Local and cloud Claude Code sessions cannot see each other's conversation history — only git state and session metadata (title/status/branch) are shared. To make handoff between sessions (local↔cloud, or session↔successor) possible, every session must maintain a handoff note before pausing, ending, or being superseded.

**File:** `HANDOFF.md` at repo root (or `.claude/handoffs/<branch-name>.md` if working on a branch other than the one currently checked out).

**When to update it:**
- Before ending a work session that isn't fully complete
- Before spawning a successor session (local or cloud) to continue the work
- After any significant decision or plan change

**What it must contain:**
1. **What this is** — one line: the task/feature/bug this branch addresses.
2. **Current state** — what's done, what's verified (tests passing, etc.), what's uncommitted.
3. **Plan / next steps** — the ordered list of what's left.
4. **Open questions / blockers** — anything that needs a human decision or external input.

**On starting a new session on an existing branch:** read `HANDOFF.md` first, before exploring the codebase from scratch.
