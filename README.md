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

## 🚀 How to Install & Start Chatting

### 1. Install the CLI

> **Requires:** [Node.js](https://nodejs.org) v20 or higher

```bash
npm install -g shelltalk-cli
```

### 2. Login with your email

```bash
shelltalk login
```

Enter your email — you'll get a one-time password (OTP) in your inbox. Paste it in the terminal. No password needed, ever.

### 3. Set up your profile (first time only)

```bash
shelltalk setup
```

Pick a **username** (public), a **display name**, and optionally your **phone number** (stored encrypted).

### 4. Start chatting!

```bash
shelltalk
```

You're in the ShellTalk shell. Add friends, send messages, and chat — all from your terminal.

---

## 💡 Commands

Once inside the ShellTalk shell:

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
| `cd ..` | Go back to the friends list |
| `me` | Show your profile info |
| `clear` | Clear the terminal |
| `help` | Show all commands |
| `logout` | Log out |
| `exit` | Exit ShellTalk |

---

## 🔐 Privacy & Security

- **Friend-gated messaging** — users can only message you after you accept their request
- **AES-256-GCM encryption** — messages and phone numbers are encrypted before saving. Plain text is never stored
- **Usernames are public** — everything else is private
- **Read receipts** reflect active engagement:
  - `✓` sent
  - `✓✓` delivered
  - `✓✓` *(green)* read (only when the recipient opens `cd @username`)

---

## 🛠️ Troubleshooting

| Issue | Fix |
|---|---|
| OTP not arriving | Check your spam folder |
| `JWT expired` error | Delete `~/.config/shelltalk-cli/config.json` and run `shelltalk login` again |
| Profile setup loops | Username must be 3–20 chars, alphanumeric + underscores only |
| `shelltalk` not found | Make sure npm global bin is in your `$PATH` — run `npm bin -g` |

---

## 📄 License

MIT © [Yagnik Patel](https://github.com/yaagnik-patel)
