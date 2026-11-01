# ShellTalk - Quick Start Guide After Improvements

## 🎯 What's New

Your app now has:

- ✅ **Persistent login** - You stay logged in between sessions
- ✅ **Auto JWT refresh** - No more "JWT expired" errors
- ✅ **Smart welcome screen** - Shows what to do next
- ✅ **Guided setup flow** - Easy onboarding for first-time users

## 🚀 How to Test

### Test 1: First Time Login

```bash
$ shelltalk
# You'll see: "Welcome to ShellTalk! Press Enter to login"
# → Press Enter
# → Enter your email
# → Enter OTP from email
# → Success! Run `shelltalk` again
$ shelltalk
# You'll see: "Complete Your Profile"
# → Enter Display Name
# → Enter Username
# → Enter Phone number
# → Success! Welcome screen appears
```

### Test 2: Session Persistence

```bash
$ shelltalk
# Shell starts normally, showing your friends list
# Close terminal (Ctrl+C, then exit)
# Open terminal again and run:
$ shelltalk
# You're still logged in! Session persisted!
```

### Test 3: Logout and Login Again

```bash
$ shelltalk
# Once in the shell:
>>> logout
# Session cleared, you're logged out
# Now run:
$ shelltalk
# You'll see the login prompt again
```

### Test 4: JWT Expiration Auto-Refresh (Optional)

If your JWT expires (usually after ~1 hour):

```bash
$ shelltalk
# App automatically refreshes your token
# You never see an error, it just works!
```

## 📍 Startup Flow

```
┌─────────────────────────────────────┐
│     shelltalk command entered       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Check if user is logged in        │
└────────────┬────────────────────────┘
             │
        ┌────┴─────┐
        │           │
        ▼           ▼
    ✓ YES      ✗ NO
        │           │
        │      ┌────▼────────────┐
        │      │ Show Login      │
        │      │ Prompt & Login  │
        │      └────┬────────────┘
        │           │
        ▼           ▼
┌─────────────────────────────────────┐
│   Check if profile is complete      │
└────────────┬────────────────────────┘
             │
        ┌────┴─────┐
        │           │
        ▼           ▼
    ✓ YES      ✗ NO
        │           │
        │      ┌────▼────────────┐
        │      │ Show Setup      │
        │      │ Prompt & Setup  │
        │      └────┬────────────┘
        │           │
        └─┬─────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Show Welcome Screen with Quick     │
│  Start Commands                     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Start Interactive Shell - Ready    │
│  to Chat!                           │
└─────────────────────────────────────┘
```

## 🔧 Key Features

### Auto-Refresh JWT

- **Before**: JWT expired → Error
- **After**: JWT expired → Auto-refresh → No error

### Session Storage

- Sessions saved in: `~/.config/shelltalk-cli/config.json`
- Survives terminal restarts
- Clear with `shelltalk logout`

### Welcome Messages

1. **Not Logged In**: "Press Enter to login"
2. **Logged In, No Profile**: "Complete your profile"
3. **Everything Ready**: "Welcome @username, Quick Start..."

### Commands Always Available

- `help` - See all commands
- `ls` - List friends
- `add @username` - Add friend
- `cd @username` - Chat with friend
- `logout` - Logout
- `exit` - Exit app

## 📝 Files Modified

- ✅ `src/services/authService.js` - JWT refresh logic
- ✅ `src/commands/shell.js` - Startup flow
- ✅ `src/commands/login.js` - Better feedback
- ✅ `src/config/session.js` - Session validation

## ❓ FAQ

**Q: How do I switch accounts?**
A: Run `shelltalk logout` then `shelltalk login`

**Q: How do I change my profile?**
A: Run `shelltalk setup` to update display name, username, or phone

**Q: What if I forget my password?**
A: Login uses email OTP, no passwords needed. Check your email!

**Q: Can I run shelltalk from any directory?**
A: Yes! Session is stored globally in config folder

**Q: Is my data safe?**
A: Yes! Phone numbers are encrypted, sessions use secure tokens

## 🚨 Troubleshooting

**Issue**: Still getting JWT expired error

- Solution: Delete `~/.config/shelltalk-cli/config.json` and login again

**Issue**: Login prompt keeps appearing

- Solution: Make sure you completed the OTP verification

**Issue**: Profile setup prompt won't go away

- Solution: Make sure you entered a valid username (3-20 chars, alphanumeric + \_)

**Issue**: Can't add friends

- Solution: Make sure you're logged in and profile is complete

## ✨ Next Steps

1. Test the startup flow as shown above
2. Verify session persists between restarts
3. Try adding a friend
4. Send a test message
5. Enjoy ShellTalk! 🎉

---

**Created**: May 11, 2026
**Version**: 1.0.6+improvements
