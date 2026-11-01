import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import { requireAuth } from "../services/authService.js";
import { getProfile, upsertProfile } from "../services/profileService.js";
import { encryptText, hashText } from "../utils/crypto.js";

export async function setup() {
  try {
    const user = await requireAuth();
    const currentProfile = (await getProfile(user.id)) || {};

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "displayName",
        message: "Display Name:",
        default: currentProfile.display_name || "",
      },
      {
        type: "input",
        name: "username",
        message: "Username (unique, 3-20 chars, letters/numbers/_):",
        default: currentProfile.username || "",
      },
      {
        type: "input",
        name: "phone",
        message: "Phone number (unique):",
        default: "", // Intentionally blanking out decrypted phone payload for security
      },
    ]);

    const spinner = ora("Saving profile...").start();

    let normalizedUsername = answers.username
      .trim()
      .replace(/^@/, "")
      .toLowerCase();
    const reservedWords = [
      "admin",
      "support",
      "root",
      "shelltalk",
      "system",
      "null",
      "undefined",
      "help",
      "exit",
      "logout",
    ];

    if (
      normalizedUsername.length < 3 ||
      normalizedUsername.length > 20 ||
      !/^[a-z0-9_]+$/.test(normalizedUsername)
    ) {
      spinner.fail(
        "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
      );
      return;
    }
    if (reservedWords.includes(normalizedUsername)) {
      spinner.fail("Username is reserved.");
      return;
    }

    let normalizedPhone = answers.phone.replace(/[\s\-\+\(\)]/g, "").trim();

    try {
      await upsertProfile({
        id: user.id,
        email: user.email,
        display_name: answers.displayName.trim(),
        username: normalizedUsername,
        phone_encrypted: encryptText(normalizedPhone),
        phone_hash: hashText(normalizedPhone),
      });
      spinner.succeed("Profile setup complete!");
    } catch (dbError) {
      if (dbError.message.includes("profiles_username_key")) {
        spinner.fail("Username already taken.");
      } else if (dbError.message.includes("profiles_phone_hash_key")) {
        spinner.fail("Phone number already linked with another account.");
      } else {
        spinner.fail("Setup failed: " + dbError.message);
      }
    }
  } catch (error) {
    console.error(chalk.red("Setup failed: " + error.message));
  }
}
