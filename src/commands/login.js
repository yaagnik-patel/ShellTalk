import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import { loginWithEmail, verifyOtp, getUser } from "../services/authService.js";

export async function login() {
  try {
    const existingUser = await getUser();
    if (existingUser) {
      console.log(chalk.green(`Already logged in as ${existingUser.email}`));
      console.log(chalk.gray("Use `shelltalk logout` to switch accounts."));
      return;
    }

    const { email } = await inquirer.prompt([
      { type: "input", name: "email", message: "Enter your email:" },
    ]);

    const spinner = ora("Sending OTP...").start();
    try {
      await loginWithEmail(email);
      spinner.succeed("OTP sent. Check your email inbox/spam folder.");
    } catch (err) {
      if (
        err.status === 429 ||
        (err.message && err.message.toLowerCase().includes("rate limit"))
      ) {
        spinner.fail("Too many OTP requests. Please wait and try again.");
      } else {
        spinner.fail("OTP email could not be sent. Please try again later.");
      }
      if (process.env.DEBUG) console.error(err);
      return;
    }

    let success = false;
    while (!success) {
      const { otp } = await inquirer.prompt([
        {
          type: "input",
          name: "otp",
          message: 'Enter the OTP (or type "resend" to send a new code):',
        },
      ]);

      if (otp.toLowerCase() === "resend") {
        const resendSpinner = ora("Resending OTP...").start();
        try {
          await loginWithEmail(email);
          resendSpinner.succeed(
            "OTP sent. Check your email inbox/spam folder.",
          );
        } catch (err) {
          if (
            err.status === 429 ||
            (err.message && err.message.toLowerCase().includes("rate limit"))
          ) {
            resendSpinner.fail(
              "Too many OTP requests. Please wait and try again.",
            );
          } else {
            resendSpinner.fail(
              "OTP email could not be sent. Please try again later.",
            );
          }
          if (process.env.DEBUG) console.error(err);
        }
        continue;
      }

      const verifyingSpinner = ora("Verifying OTP...").start();
      try {
        await verifyOtp(email, otp.trim());
        verifyingSpinner.succeed("Logged in successfully!");

        console.log("\n" + chalk.bold.green("✓ Login Complete!\n"));
        console.log(chalk.gray("Next steps:"));
        console.log("  1. Run: " + chalk.cyan("shelltalk"));
        console.log("  2. Complete your profile setup");
        console.log("  3. Start messaging!\n");

        success = true;
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes("expired")) {
          verifyingSpinner.fail(
            "OTP expired. Please run `shelltalk login` again.",
          );
          return;
        } else {
          verifyingSpinner.fail(
            "Invalid OTP. Please check the code and try again.",
          );
        }
        if (process.env.DEBUG) console.error(err);
      }
    }
  } catch (error) {
    console.error(chalk.red("Login flow error: " + error.message));
  }
}
