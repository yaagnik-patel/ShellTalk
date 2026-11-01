import readline from "readline";
import chalk from "chalk";
import boxen from "boxen";
import { requireAuth, logout, getUser } from "../services/authService.js";
import {
  getProfile,
  findProfileByUsernameOrPhone,
} from "../services/profileService.js";
import {
  getFriendsWithStats,
  sendFriendRequest,
  listIncomingRequests,
  listOutgoingPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  blockUser,
  unblockUser,
  checkBlockStatus,
  areFriends,
} from "../services/friendService.js";
import {
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  updateMessageStatus,
  markAllReceivedAsDelivered,
} from "../services/messageService.js";
import { subscribeToMessages } from "../services/realtimeService.js";
import { renderWelcome, formatMessage } from "../ui/render.js";
import { symbols, colors } from "../ui/colors.js";

// Input normalization
function stripAnsi(string) {
  return string.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

function normalizeInput(input) {
  return stripAnsi(input).trim().replace(/\s+/g, " ");
}

function parsePastedInput(input) {
  return stripAnsi(input)
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.length > 0);
}
async function showStartupWelcome(user, profile) {
  console.clear();

  // 1. Format dynamic login string. Max length 34 to fit the new smaller box.
  const baseStr = `Logged in as: @${profile.username} | ${profile.display_name}`;
  const trimmedStr = baseStr.length > 34 ? baseStr.substring(0, 33) + "…" : baseStr;
  
  // Right width is 38. Left padding is 2. Dynamic right pad ensures it hits the wall exactly.
  const rightPadStr = " ".repeat(Math.max(0, 36 - stripAnsi(trimmedStr).length));
  
  // Apply colors
  const loginColored = trimmedStr
    .replace(`@${profile.username}`, chalk.cyan(`@${profile.username}`))
    .replace(profile.display_name, chalk.yellow(profile.display_name));

  // 2. Pre-calculated padding for commands to guarantee exactly 38 characters width
  const lsPad = " ".repeat(16);
  const addPad = " ".repeat(5);
  const cdPad = " ".repeat(2);
  const helpPad = " ".repeat(14);

  // 3. Render the newly compacted 77-character wide layout
  const welcomeText = 
`${chalk.gray("╭─────────────────────────────────────┬──────────────────────────────────────╮")}
${chalk.gray("│")}                                     ${chalk.gray("│")}                                      ${chalk.gray("│")}
${chalk.gray("│")}            ${chalk.bold.green("Welcome back!")}            ${chalk.gray("│")}  ${loginColored}${rightPadStr}${chalk.gray("│")}
${chalk.gray("│")}                                     ${chalk.gray("│")}  ${chalk.gray("──────────────────────────────────")}  ${chalk.gray("│")}
${chalk.gray("│")}             ${chalk.cyan("_ ▂ ▄ ▅ ▇ █")}             ${chalk.gray("│")}  ${chalk.bold("Quick Start:")}                        ${chalk.gray("│")}
${chalk.gray("│")}            ${chalk.cyan("[ ❯_       ]")}             ${chalk.gray("│")}    ${chalk.gray("→")} ${colors.highlight("ls")}${lsPad}View friends  ${chalk.gray("│")}
${chalk.gray("│")}            ${chalk.cyan("[ ShellTalk]")}             ${chalk.gray("│")}    ${chalk.gray("→")} ${colors.highlight("add @username")}${addPad}Send request  ${chalk.gray("│")}
${chalk.gray("│")}            ${chalk.cyan("[__________]")}             ${chalk.gray("│")}    ${chalk.gray("→")} ${colors.highlight("cd @username")}${cdPad}Chat with friend  ${chalk.gray("│")}
${chalk.gray("│")}                                     ${chalk.gray("│")}    ${chalk.gray("→")} ${colors.highlight("help")}${helpPad}See commands  ${chalk.gray("│")}
${chalk.gray("│")}    ${chalk.yellow("Private chats inside terminal")}    ${chalk.gray("│")}                                      ${chalk.gray("│")}
${chalk.gray("│")}                                     ${chalk.gray("│")}                                      ${chalk.gray("│")}
${chalk.gray("│")}  ${chalk.green("ShellTalk 1.0.7")} ${chalk.gray("· E2EE Messaging")}   ${chalk.gray("│")}                                      ${chalk.gray("│")}
${chalk.gray("╰─────────────────────────────────────┴──────────────────────────────────────╯")}`;

  console.log(welcomeText);
}

async function showLoginPrompt() {
  console.clear();
  const welcomeText = `🚀 ${chalk.bold.green("Welcome to ShellTalk!")} 🚀

${chalk.gray("A secure terminal-based messaging app for developers.")}

${chalk.bold("You need to login to continue.")}

Press ${chalk.cyan("Enter")} to login, or ${chalk.gray("Ctrl+C")} to exit.`;

  console.log(
    boxen(welcomeText, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
      align: "center",
    }),
  );

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("", () => {
      rl.close();
      resolve();
    });
  });
}

function showHelp() {
  const helpText = `
${chalk.bold("ShellTalk Commands")}

${chalk.bold("Account:")}
  ${colors.highlight("me")}                       Show my profile
  ${colors.highlight("logout")}                   Logout from ShellTalk
  ${colors.highlight("exit")}                     Exit ShellTalk

${chalk.bold("Friends:")}
  ${colors.highlight("ls")}                       Show accepted friends
  ${colors.highlight("add @username")}            Send friend request
  ${colors.highlight("add phoneNumber")}          Send friend request by phone
  ${colors.highlight("requests")}                 Show incoming friend requests
  ${colors.highlight("pending")}                  Show outgoing pending requests
  ${colors.highlight("accept @username")}         Accept friend request
  ${colors.highlight("reject @username")}         Reject friend request
  ${colors.highlight("block @username")}          Block a user
  ${colors.highlight("unblock @username")}        Unblock a user

${chalk.bold("Chat:")}
  ${colors.highlight("cd @username")}             Open chat with accepted friend
  ${colors.highlight("cd ..")}                    Go back to friends/root
  ${colors.highlight("clear")}                    Clear terminal

${chalk.bold("Messaging:")}
  Inside a chat, type any message and press Enter to send.
  Example:
    ${colors.primary("ShellTalk/@yagnik $")} hello bro

${chalk.bold("Status:")}
  ${symbols.sent}                        Sent
  ${symbols.delivered}                       Delivered
  ${symbols.read}                  Read
`;

  console.log(
    boxen(helpText.trim(), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "blue",
    }),
  );
}

export async function startShell() {
  // First check if user is logged in
  let user = null;
  try {
    user = await getUser();
  } catch (error) {
    user = null;
  }

  // If not logged in, prompt to login
  if (!user) {
    await showLoginPrompt();
    const { login } = await import("./login.js");
    await login();

    // Try to get user again after login
    try {
      user = await getUser();
    } catch (error) {
      console.log(colors.error("\n✗ Login failed. Exiting."));
      process.exit(1);
    }

    if (!user) {
      console.log(
        colors.error("\n✗ Could not verify login. Please try again."),
      );
      process.exit(1);
    }
  }

  // User is logged in, check profile
  let profile;
  try {
    profile = await getProfile(user.id);
  } catch (error) {
    console.log(colors.error("Error fetching profile: " + error.message));
    process.exit(1);
  }

  // If profile not complete, ask to setup
  if (!profile || !profile.username) {
    console.clear();
    const setupPrompt = boxen(
      `${chalk.bold("Complete Your Profile")}

You'll be asked for:
  ${chalk.gray("•")} Display Name
  ${chalk.gray("•")} Username (unique, 3-20 chars)
  ${chalk.gray("•")} Phone number (encrypted)`,
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      },
    );
    console.log(setupPrompt);

    const { setup } = await import("./setup.js");
    await setup();

    profile = await getProfile(user.id);
    if (!profile || !profile.username) {
      console.log(colors.error("Setup incomplete. Exiting."));
      process.exit(1);
    }

    console.log(colors.primary("\n✓ Setup complete! Loading your shell...\n"));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Show welcome message
  await showStartupWelcome(user, profile);

  let currentChatUser = null;
  let friendsCache = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: colors.primary("ShellTalk $ "),
  });

  function updatePrompt() {
    if (currentChatUser) {
      rl.setPrompt(colors.primary(`ShellTalk/@${currentChatUser.username} $ `));
    } else {
      rl.setPrompt(colors.primary("ShellTalk $ "));
    }
    rl.prompt(true);
  }

  const unsubscribe = subscribeToMessages(user.id, {
    onNewMessage: async (msg) => {
      if (currentChatUser && msg.sender_id === currentChatUser.id) {
        await markMessagesAsRead(currentChatUser.id, user.id);
        msg.status = "read";
        process.stdout.write("\n");
        console.log(formatMessage(msg, false, currentChatUser.username));
        updatePrompt();
      } else {
        await updateMessageStatus(msg.id, "delivered");
        const friend = friendsCache.find((f) => f.id === msg.sender_id);
        const username = friend ? friend.username : "Unknown";
        process.stdout.write("\n");
        console.log(colors.warning(`🔔 New message from @${username}`));
        updatePrompt();
      }
    },
    onMessageUpdate: (msg) => {
      if (currentChatUser && msg.receiver_id === currentChatUser.id) {
        if (msg.status === "read") {
          process.stdout.write("\n");
          console.log(
            colors.primary(
              `✓✓ @${currentChatUser.username} read your messages.`,
            ),
          );
          updatePrompt();
        } else if (msg.status === "delivered") {
          process.stdout.write("\n");
          console.log(
            colors.warning(
              `✓✓ @${currentChatUser.username} received your message.`,
            ),
          );
          updatePrompt();
        }
      }
    },
  });

  try {
    friendsCache = await getFriendsWithStats(user.id);
    await markAllReceivedAsDelivered(user.id);
  } catch (e) {
    console.log(
      colors.error("Failed to load friends or update delivery statuses."),
    );
  }

  updatePrompt();

  async function handleInputLine(line) {
    const originalInput = line;
    const input = normalizeInput(line);
    if (!input) return;

    const baseInputTokens = input.split(" ");
    const cmd = baseInputTokens[0];

    // Global Commands
    if (cmd === "exit") {
      unsubscribe();
      process.exit(0);
    } else if (cmd === "logout") {
      await logout();
      unsubscribe();
      process.exit(0);
    } else if (cmd === "clear") {
      console.clear();
      renderWelcome();
    } else if (cmd === "help" || cmd === "/help" || cmd === "?") {
      showHelp();
    } else if (cmd === "cd") {
      const target = baseInputTokens[1];
      if (!target) return;
      if (target === "..") {
        currentChatUser = null;
      } else {
        const targetProf = await findProfileByUsernameOrPhone(target);
        if (!targetProf) {
          console.log(colors.warning("User not found."));
        } else {
          const isFriend = await areFriends(user.id, targetProf.id);
          if (isFriend) {
            currentChatUser = targetProf;
            await markMessagesAsRead(targetProf.id, user.id);
            const messages = await getChatMessages(user.id, targetProf.id);
            console.log();
            messages.forEach((m) => {
              console.log(
                formatMessage(
                  m,
                  m.sender_id === user.id,
                  m.sender_id === user.id
                    ? profile.username
                    : targetProf.username,
                ),
              );
            });
            console.log();
          } else {
            // Context logic
            const incoming = await listIncomingRequests(user.id);
            const outgoing = await listOutgoingPendingRequests(user.id);

            if (outgoing.find((r) => r.userId === targetProf.id)) {
              console.log(
                colors.warning(
                  `Friend request pending. Wait until @${targetProf.username} accepts your request.`,
                ),
              );
            } else if (incoming.find((r) => r.userId === targetProf.id)) {
              console.log(
                colors.warning(
                  `@${targetProf.username} sent you a request. Use \`accept @${targetProf.username}\` to start chatting.`,
                ),
              );
            } else {
              console.log(
                colors.warning(
                  `You are not friends with @${targetProf.username} yet. Send request using \`add @${targetProf.username}\`.`,
                ),
              );
            }
          }
        }
      }
    }
    // Root specific
    else if (!currentChatUser) {
      if (cmd === "ls") {
        try {
          friendsCache = await getFriendsWithStats(user.id);
          console.log(chalk.bold("\nFriends"));
          if (friendsCache.length === 0) {
            console.log(
              colors.secondary(
                "No friends yet. Add one with `add <username/phone>`",
              ),
            );
          } else {
            friendsCache.forEach((f) => {
              const statusIcon = f.online ? symbols.online : symbols.offline;
              const unreadStr =
                f.unreadCount > 0
                  ? colors.primary(`${f.unreadCount} unread`)
                  : colors.secondary("no unread");
              const lastStr = f.lastMessagePreview
                ? `last: ${f.lastMessagePreview}`
                : "";
              console.log(
                `  ${statusIcon} @${f.username.padEnd(12)} ${unreadStr.padEnd(20)} ${colors.secondary(lastStr)}`,
              );
            });
          }
          console.log();
        } catch (e) {
          console.error(colors.error("Error listing friends."));
        }
      } else if (cmd === "requests") {
        try {
          const reqs = await listIncomingRequests(user.id);
          console.log(chalk.bold("\nPending Requests"));
          if (reqs.length === 0) {
            console.log(colors.secondary("No pending requests."));
          } else {
            reqs.forEach((r, idx) => {
              console.log(`  ${idx + 1}. @${r.username}`);
            });
            console.log(
              colors.secondary(
                "\nUse `accept @username` or `reject @username`",
              ),
            );
          }
          console.log();
        } catch (e) {}
      } else if (cmd === "pending") {
        try {
          const reqs = await listOutgoingPendingRequests(user.id);
          console.log(chalk.bold("\nWaiting for acceptance"));
          if (reqs.length === 0) {
            console.log(colors.secondary("No outgoing pending requests."));
          } else {
            reqs.forEach((r) => {
              console.log(`  @${r.username.padEnd(10)} pending`);
            });
          }
          console.log();
        } catch (e) {}
      } else if (cmd === "add") {
        const target = baseInputTokens[1];
        if (target) {
          try {
            const targetProf = await findProfileByUsernameOrPhone(target);
            if (!targetProf) {
              console.log(colors.warning("User not found."));
            } else if (targetProf.id === user.id) {
              console.log(colors.warning("You cannot add yourself."));
            } else {
              const blocked = await checkBlockStatus(user.id, targetProf.id);
              const isFriend = await areFriends(user.id, targetProf.id);
              if (blocked) {
                console.log(colors.warning("Could not send friend request."));
              } else if (isFriend) {
                console.log(
                  colors.warning(
                    `You are already friends with @${targetProf.username}.`,
                  ),
                );
              } else {
                const incoming = await listIncomingRequests(user.id);
                if (incoming.find((r) => r.userId === targetProf.id)) {
                  console.log(
                    colors.warning(
                      `@${targetProf.username} already sent you a request. Use \`accept @${targetProf.username}\`.`,
                    ),
                  );
                } else {
                  await sendFriendRequest(user.id, targetProf.id);
                  console.log(
                    colors.primary(
                      `Friend request sent to @${targetProf.username}. Wait until they accept.`,
                    ),
                  );
                }
              }
            }
          } catch (e) {
            if (e.message.includes("already pending")) {
              console.log(colors.warning("Friend request already pending."));
            } else {
              console.error(colors.error("Error: " + e.message));
            }
          }
        }
      } else if (cmd === "accept") {
        const target = baseInputTokens[1];
        if (target) {
          try {
            const targetProf = await findProfileByUsernameOrPhone(target);
            if (!targetProf) {
              console.log(colors.warning("User not found."));
            } else {
              const reqs = await listIncomingRequests(user.id);
              const req = reqs.find((r) => r.userId === targetProf.id);
              if (!req) {
                console.log(
                  colors.warning(
                    `No pending request from @${targetProf.username}.`,
                  ),
                );
              } else {
                await acceptFriendRequest(req.requestId);
                console.log(
                  colors.primary(
                    `You are now friends with @${targetProf.username}.`,
                  ),
                );
                friendsCache = await getFriendsWithStats(user.id);
              }
            }
          } catch (e) {
            console.error(colors.error("Failed to accept: " + e.message));
          }
        }
      } else if (cmd === "reject") {
        const target = baseInputTokens[1];
        if (target) {
          try {
            const targetProf = await findProfileByUsernameOrPhone(target);
            if (!targetProf) {
              console.log(colors.warning("User not found."));
            } else {
              const reqs = await listIncomingRequests(user.id);
              const req = reqs.find((r) => r.userId === targetProf.id);
              if (!req) {
                console.log(
                  colors.warning(
                    `No pending request from @${targetProf.username}.`,
                  ),
                );
              } else {
                await rejectFriendRequest(req.requestId);
                console.log(colors.warning(`Friend request rejected.`));
              }
            }
          } catch (e) {
            console.error(colors.error("Failed to reject: " + e.message));
          }
        }
      } else if (cmd === "block") {
        const target = baseInputTokens[1];
        if (target) {
          try {
            const targetProf = await findProfileByUsernameOrPhone(target);
            if (!targetProf) {
              console.log(colors.warning("User not found."));
            } else if (targetProf.id === user.id) {
              console.log(colors.warning("You cannot block yourself."));
            } else {
              await blockUser(user.id, targetProf.id);
              console.log(colors.primary(`Blocked @${targetProf.username}.`));
            }
          } catch (e) {}
        }
      } else if (cmd === "unblock") {
        const target = baseInputTokens[1];
        if (target) {
          try {
            const targetProf = await findProfileByUsernameOrPhone(target);
            if (!targetProf) {
              console.log(colors.warning("User not found."));
            } else {
              await unblockUser(user.id, targetProf.id);
              console.log(colors.primary(`Unblocked @${targetProf.username}.`));
            }
          } catch (e) {}
        }
      } else if (cmd === "me") {
        const decryptedPhone = profile.phone_encrypted
          ? "******" +
            profile.phone_encrypted.slice(-4) /* Mock decrypt masking */
          : "[encrypted]";
        console.log(chalk.bold(`\n@${profile.username}`));
        console.log(`Name: ${profile.display_name}`);
        console.log(`Email: ${profile.email}`);
        console.log(`Phone: ${decryptedPhone}\n`);
      } else {
        console.log(
          colors.warning(
            "Unknown command. Type `help` to see available commands.",
          ),
        );
      }
    }
    // Chat specific
    else {
      let msgBody = stripAnsi(originalInput);
      if (msgBody.length > 1000) {
        console.log(colors.warning("Message too long. Max 1000 characters."));
        return;
      }

      try {
        const sent = await sendMessage(
          user.id,
          currentChatUser.id,
          msgBody,
          currentChatUser.username,
        );
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);
        console.log(formatMessage(sent, true, profile.username));
      } catch (e) {
        console.log(colors.error("Error: " + e.message));
      }
    }
  }

  rl.on("line", async (rawLine) => {
    const lines = parsePastedInput(rawLine);
    for (let line of lines) {
      await handleInputLine(line);
    }
    updatePrompt();
  });
}
