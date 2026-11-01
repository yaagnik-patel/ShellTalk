import chalk from "chalk";
import boxen from "boxen";

export const colors = {
  primary: chalk.green,
  secondary: chalk.gray,
  highlight: chalk.cyan,
  warning: chalk.yellow,
  error: chalk.red,
};

export const symbols = {
  online: colors.primary("●"),
  offline: colors.secondary("○"),
  sent: colors.secondary("✓"),
  delivered: colors.secondary("✓✓"),
  read: colors.primary("✓✓"),
};
