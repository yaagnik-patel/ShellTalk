import Conf from "conf";

const conf = new Conf({ projectName: "shelltalk-cli" });

export function saveSession(session) {
  conf.set("supabase_session", session);
}

export function getSession() {
  return conf.get("supabase_session");
}

export function clearSession() {
  conf.delete("supabase_session");
}

export function isSessionValid() {
  const session = getSession();
  if (!session) return false;

  // Check if refresh token exists (needed for session refresh)
  return !!session.refresh_token;
}
