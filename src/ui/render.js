import chalk from "chalk";
import boxen from "boxen";
import { colors, symbols } from "./colors.js";

export function renderWelcome() {
  const welcomeText = `🚀 Welcome to ShellTalk! 🚀

A secure terminal-based messaging app.
Type ${colors.highlight("help")} for commands.`;

  console.log(
    boxen(welcomeText, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
      align: "center",
    }),
  );
}

export function formatMessage(msg, isMine, friendUsername) {
  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const senderPrefix = isMine
    ? colors.primary("Me:")
    : colors.highlight(`@${friendUsername}:`);

  let statusSymbol = "";
  if (isMine) {
    if (msg.status === "read") statusSymbol = symbols.read;
    else if (msg.status === "delivered") statusSymbol = symbols.delivered;
    else statusSymbol = symbols.sent;
  }

  return `[${colors.secondary(time)}] ${senderPrefix} ${msg.body} ${statusSymbol}`;
}
