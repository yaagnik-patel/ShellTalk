# 💬 ShellTalk CLI

> **Terminal-based messaging for developers.** Chat with friends directly from your terminal — no browser, no Electron, just your shell.

![npm version](https://img.shields.io/npm/v/shelltalk-cli)
![license](https://img.shields.io/npm/l/shelltalk-cli)
![node](https://img.shields.io/node/v/shelltalk-cli)

---

## ✨ Features

- 🔐 **Passwordless login** via email OTP — no passwords to remember
- 🔒 **End-to-end encrypted messages** using AES-256-GCM
- 👫 **Friend requests** — nobody can message you without your approval
- 📡 **Real-time messaging** powered by Supabase Realtime
- ✅ **Read receipts** — see when your messages are delivered and read
- 🔁 **Persistent sessions** — stay logged in across terminal restarts
- 🚫 **Block / Unblock** users

---

## 🚀 Installation

> **Prerequisites:** [Node.js](https://nodejs.org) v20 or higher and npm.

```bash
npm install -g shelltalk-cli
```

That's it! The `shelltalk` command is now available globally.

---

## ⚙️ Setup (One-Time)

ShellTalk uses **Supabase** as its backend. You need to point it to a Supabase project.

### Option A — Use the hosted instance (if provided by the maintainer)

The maintainer may share a pre-configured `.env` file or environment values. Ask them for:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SHELLTALK_ENCRYPTION_KEY` | A shared 32-character secret for message encryption |

Set them in your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."
export SHELLTALK_ENCRYPTION_KEY="your-32-character-secret-key-here"
```

Or create a `.env` file in your working directory:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SHELLTALK_ENCRYPTION_KEY=your-32-character-secret-key-here
```

### Option B — Self-host your own Supabase backend

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run the schema from [`supabase/schema.sql`](./supabase/schema.sql) to create all required tables.
3. Copy your **Project URL** and **anon public key** from `Settings → API`.
4. Set the three environment variables above.

> **For production email OTP delivery**, configure a Custom SMTP provider in Supabase (Brevo, Resend, or SendGrid all work with the free tier).

---

## 🗣️ Start Chatting — Step by Step

### Step 1 — Login

```bash
shelltalk login
```

Enter your email address. You'll receive a one-time password (OTP) in your inbox. Paste it in the terminal to authenticate. No password needed, ever.

### Step 2 — Set up your profile

```bash
shelltalk setup
```

Choose your **username** (public), **display name**, and optionally your **phone number** (stored encrypted). This only needs to be done once.

### Step 3 — Launch the shell

```bash
shelltalk
```

You're in! ShellTalk opens an interactive shell prompt.

---

## 💡 Commands Reference

Once inside the ShellTalk shell (`shelltalk`):

| Command | Description |
|---|---|
| `ls` | List your accepted friends |
| `add @username` | Send a friend request by username |
| `add phoneNumber` | Send a friend request by phone number |
| `requests` | View incoming pending friend requests |
| `pending` | View your outgoing pending requests |
| `accept @username` | Accept a friend request |
| `reject @username` | Reject a friend request |
| `block @username` | Block a user |
| `unblock @username` | Unblock a user |
| `cd @username` | Open a chat with a friend |
| `cd ..` | Close the current chat |
| `me` | Show your profile info |
| `clear` | Clear the terminal |
| `help` | Show all commands |
| `logout` | Log out of your account |
| `exit` | Exit ShellTalk |

---

## 🔐 Privacy & Security

- **Friend-gated messaging** — users can only message you after you accept their friend request.
- **AES-256-GCM encryption** — message bodies and phone numbers are encrypted before being saved to the database. Plain text is never stored.
- **Usernames are public** — they are your identity. Everything else is private.
- **Read receipts** indicate active engagement, not just app presence:
  - `✓` — sent
  - `✓✓` — delivered
  - `✓✓` *(green)* — read (only when the recipient opens `cd @username`)

---

## 🛠️ Troubleshooting

| Issue | Fix |
|---|---|
| Login OTP not arriving | Check your spam folder, or configure Custom SMTP in Supabase |
| `JWT expired` error | Delete `~/.config/shelltalk-cli/config.json` and run `shelltalk login` again |
| Profile setup loops forever | Ensure username is 3–20 chars, alphanumeric + underscores only |
| Can't add friends | Make sure your profile setup is complete (`shelltalk setup`) |
| `shelltalk` not found | Ensure npm global bin is in your `$PATH` (run `npm bin -g`) |

---

## 🙋 FAQ

**Q: Do I need an account on a website?**  
A: No. Just install the CLI, set the environment variables, and log in with your email.

**Q: Can I use this on Windows, Mac, or Linux?**  
A: Yes! Any platform that runs Node.js v20+ is supported.

**Q: Is my chat history stored?**  
A: Messages are stored encrypted in Supabase. Only someone with the correct `SHELLTALK_ENCRYPTION_KEY` can decrypt them.

**Q: How do I switch accounts?**  
A: Run `shelltalk logout` then `shelltalk login`.

**Q: Can I run shelltalk from any directory?**  
A: Yes — sessions are stored globally in `~/.config/shelltalk-cli/config.json`.

---

## 📦 Tech Stack

- **[Supabase](https://supabase.com)** — Auth, database, and realtime subscriptions
- **[Chalk](https://github.com/chalk/chalk)** — Terminal colors
- **[Inquirer](https://github.com/SBoudrias/Inquirer.js)** — Interactive prompts
- **[Commander](https://github.com/tj/commander.js)** — CLI argument parsing
- **[Conf](https://github.com/sindresorhus/conf)** — Persistent local config
- **[Ora](https://github.com/sindresorhus/ora)** — Spinners

---

## 📄 License

MIT © [Yagnik Patel](https://github.com/yagnikpatel)
