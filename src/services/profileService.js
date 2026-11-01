import { supabase } from "../config/supabase.js";
import { hashText } from "../utils/crypto.js";

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function upsertProfile(profileData) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profileData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findProfileByUsernameOrPhone(identifier) {
  const isUsername =
    identifier.startsWith("@") ||
    isNaN(parseInt(identifier.replace(/[\s\-\+\(\)]/g, "").trim()[0]));

  if (isUsername) {
    const normalizedUsername = identifier
      .trim()
      .replace(/^@+/, "") // remove leading @
      .toLowerCase();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("username", normalizedUsername)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  } else {
    // Phone lookup
    const normalizedPhone = identifier.replace(/[\s\-\+\(\)]/g, "").trim();
    const hashed = hashText(normalizedPhone);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("phone_hash", hashed)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  }
}
