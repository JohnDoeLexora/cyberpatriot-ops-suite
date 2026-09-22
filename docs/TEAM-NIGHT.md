# Team night

One page for the round. Read [SAFETY.md](./SAFETY.md) before anyone turns **Practice data** off.

This tool only hardens **your** image. It does not talk to the scoring server, other teams, or the internet.

## First five minutes

1. Leave **Practice data** on until you are on the competition image.
2. **Beginner** can stay on. It shows starter checks and larger tips. **All checks** shows the full list.
3. Open **Edit allowlists**. Paste the README users into `allowed-users.txt` and the admins into `allowed-admins.txt`. Download those files into `config/` on the image. Do not put passwords in them.
4. Pick a playlist and press **Run next** (or **Run all** while still on practice data):

| Image | Start here |
| --- | --- |
| Linux | **Linux starter**, or **Forensics first** if questions are still unread |
| Windows | **Windows starter**, or **Forensics first** |
| After the starter | **Linux deep** or **Windows deep** |

5. Copy forensics answers into **Team notes** before you change files, accounts, or services.

Each playlist step is an existing check. The coach tip says why it is next. **How-to** (or `?`) is the longer explainer.

## Practice data vs this computer

| Toggle | Use it when | Mutations |
| --- | --- | --- |
| **Practice data** | Laptop, Mac, rehearsal | Simulated. The host is not changed. |
| **This computer** | The competition image only | Anything that **changes** the box asks you to confirm. Cancel if you have not read the step. |

**Run all** on **This computer** stops at the first change and waits. Confirm, then it continues. It will not skip the dialog.

## Panes

- A click in the check list **replaces the focused pane**. An empty pane just fills.
- **Split right** or **Split down** (or drop a check on a pane edge) to keep the previous result open.
- Two across, then two below, is the 2×2. The fifth pane becomes tabs. Clicking a sixth check does **not** add a tab — it replaces the focused one.

## What not to do

- Do not confirm a change you have not read. Guest, firewall, SSH, and package removal are the usual ones.
- Do not query the CCS or paste scoring-server URLs into this tool.
- Do not delete homes you might need for a forensics question. Disable or lock instead.
- New accounts from **Sync allowlist users** are created **without a password**. Set one yourself.

## If you get stuck

- Playlist progress is the checklist on the left. **Reset** clears the checkmarks, not the image.
- Search with `/`. Beginner mode still finds advanced checks when you type.
- [OPS.md](./OPS.md) lists every check. [howto/](./howto/) is the same text as the drawer.
