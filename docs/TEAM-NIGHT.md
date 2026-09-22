# Team night

One page for the round. The first minute is setup. The rest is how to run checks on an **authorized CyberPatriot image** without changing the wrong machine.

This tool only hardens **your** image. It does not talk to the scoring server, other teams, or the internet. Read [SAFETY.md](SAFETY.md) before anyone turns **Practice data** off. Anything that **changes** the box asks first.

## 1. Clone, install, run

You need [Node 20+](https://nodejs.org/).

```bash
git clone https://github.com/JohnDoeLexora/cyberpatriot-ops-suite.git
cd cyberpatriot-ops-suite
npm install
npm run dev
```

Open the URL Vite prints (http://localhost:5173).

## 2. Practice data on until you are on the image

Leave the header switch on **Practice data**. That is the default, and the status bar says **practice**. You get fake accounts and services. Nothing on your laptop changes.

Switch to **This computer** only when you are on the Linux or Windows competition image.

**Beginner** can stay on. It shows starter checks and larger tips. Turn it off for **All checks**, or press **Show advanced** for the rest of the list.

## 3. Pick a playlist

Open **Round playlist** on the left.

| Image | Start here |
| --- | --- |
| Linux | **Linux starter**, or **Forensics first** if questions are still unread |
| Windows | **Windows starter**, or **Forensics first** |
| After the starter | **Linux deep** or **Windows deep** |

- **Run next** runs one check, then the progress count moves (1/…, 2/…).
- **Run all** walks the rest of the list. On practice data it should finish, not sit on “Running…”.

Each step is an existing check. The coach tip says why it is next. **How-to** (or `?`) is the longer explainer.

Copy forensics answers into **Team notes** before you change files, accounts, or services.

## 4. Paste the README users

Click **Edit allowlists**. Paste this image’s README user list into the users box: one username per line, `#` for comments, same shape as `config/allowed-users.txt`. Paste admins into the admins box the same way. It stays in this browser.

When you are on the image, download those files into `config/`. Do not put passwords in them.

## 5. Changes ask first

| Toggle | Use it when | What a change does |
| --- | --- | --- |
| **Practice data** | Laptop, Mac, rehearsal | Simulated. The host is not changed. |
| **This computer** | The competition image only | Anything that **changes** the box asks you to confirm. Cancel if you have not read the step. |

Steps and checks marked **changes** do not apply on their own. On **This computer** you get a confirm dialog (**Yes, apply** / **Cancel**). If you are not sure, press **Cancel**.

**Run all** on **This computer** stops at the first change and waits. Confirm, then it continues. It will not skip the dialog.

Full rules: [SAFETY.md](SAFETY.md).

## Panes

- A click in the check list **replaces the focused pane**. An empty pane just fills.
- **Split right** or **Split down**, or drop a check on a pane edge, to keep the previous result open.
- Two across, then two below, is the 2×2. A fifth pane (from a split) becomes tabs. Another catalog click does not add a pane or a tab. It replaces the focused one.

## What not to do

- Do not confirm a change you have not read. Guest, firewall, SSH, and package removal are the usual ones.
- Do not query the CCS or paste scoring-server URLs into this tool.
- Do not delete homes you might need for a forensics question. Disable or lock instead.
- New accounts from **Sync allowlist users** are created **without a password**. Set one yourself.

## If you get stuck

- Playlist progress is the checklist on the left. **Reset** clears the checkmarks, not the image.
- Search with `/`. Beginner mode still finds advanced checks when you type.
- [OPS.md](OPS.md) lists every check. [howto/](howto/) is the same text as the drawer.
