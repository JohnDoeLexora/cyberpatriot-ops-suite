# Team night — 60 seconds

Defensive checks for an **authorized CyberPatriot image** only. Read [SAFETY.md](SAFETY.md) before anyone turns practice data off. Anything that **changes** the box asks first.

## 1. Clone, install, run

You need [Node 20+](https://nodejs.org/).

```bash
git clone https://github.com/JohnDoeLexora/cyberpatriot-ops-suite.git
cd cyberpatriot-ops-suite
npm install
npm run dev
```

Open the URL Vite prints (http://localhost:5173).

## 2. Practice data ON on a Mac

Leave the header switch on **Practice data**. That is the default, and the status bar says **practice**. You get fake accounts and services. Nothing on the Mac changes.

Switch to **This computer** only when you are on the Linux or Windows competition image.

## 3. Pick a starter playlist

Open **Round playlist** on the left and choose **Linux starter** or **Windows starter**.

- **Run next** — one check, then the progress count moves (1/…, 2/…).
- **Run all** — walks the rest of the list. It should finish, not sit on “Running…”.

Each step is an existing check, with a short coach tip and a how-to.

## 4. Paste the README users

Click **Edit allowlists**. Paste this image’s README user list into the users box: one username per line, `#` for comments, same shape as `config/allowed-users.txt`. Paste admins into the admins box the same way. It stays in this browser.

## 5. Changes ask first

Steps and checks marked **changes** do not apply on their own. On **This computer** you get a confirm dialog (**Yes, apply** / **Cancel**). If you are not sure, press **Cancel**.

Full rules: [SAFETY.md](SAFETY.md).
