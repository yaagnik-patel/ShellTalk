import { supabase } from "../config/supabase.js";
import { getSession, saveSession, clearSession } from "../config/session.js";
import chalk from "chalk";

export async function loginWithEmail(email) {
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
  return data;
}

export async function verifyOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
  saveSession(data.session);
  return data.session;
}

export async function getUser() {
  const session = getSession();
  if (!session) return null;

  try {
    // Restore the session to the Supabase client so it can manage refresh tokens
    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

    if (sessionError || !sessionData.session) {
      clearSession();
      return null;
    }

    // Update our stored session in case it was refreshed
    saveSession(sessionData.session);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(sessionData.session.access_token);
    if (error) {
      // Try to refresh the token if expired
      if (error.message && error.message.includes("invalid")) {
        const refreshed = await refreshSession();
        if (refreshed) {
          return getUser(); // Retry recursively
        }
      }
      clearSession();
      return null;
    }
    return user;
  } catch (error) {
    clearSession();
    return null;
  }
}

export async function refreshSession() {
  const session = getSession();
  if (!session || !session.refresh_token) return false;

  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      clearSession();
      return false;
    }
    saveSession(data.session);
    return true;
  } catch (error) {
    clearSession();
    return false;
  }
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    console.log(
      chalk.red(`\nPlease login first using: ${chalk.bold("shelltalk login")}`),
    );
    process.exit(1);
  }
  return user;
}

export async function isLoggedIn() {
  const user = await getUser();
  return !!user;
}

export async function getUserIfLoggedIn() {
  try {
    return await getUser();
  } catch (error) {
    return null;
  }
}

export async function logout() {
  await supabase.auth.signOut();
  clearSession();
  console.log(chalk.green("Logged out successfully."));
}
