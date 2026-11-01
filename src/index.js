#!/usr/bin/env node
import { program } from "commander";
import { login } from "./commands/login.js";
import { setup } from "./commands/setup.js";
import { startShell } from "./commands/shell.js";
import { logout } from "./services/authService.js";

program
  .name("shelltalk")
  .description("Terminal-based messaging app for developers")
  .version("1.0.3");

program.command("login").description("Login with your email").action(login);

program
  .command("setup")
  .description("Setup your profile (username, display name, phone)")
  .action(setup);

program
  .command("logout")
  .description("Logout of your account")
  .action(async () => {
    await logout();
    process.exit(0);
  });

program
  .command("start", { isDefault: true })
  .description("Start the ShellTalk interactive environment")
  .action(startShell);

program.parse(process.argv);
