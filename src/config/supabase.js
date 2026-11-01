import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { getSession } from "./session.js";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL || "https://fitzjlgakfqfaftirpjl.supabase.co";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_Ma7xJPxbyWKm4ZFKL8tfOQ_b87tX1ys";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.",
  );
  process.exit(1);
}

// Restore session globally if it exists so supabase client mounts it
const savedSession = getSession();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
  global: {
    headers: savedSession?.access_token
      ? {
          Authorization: `Bearer ${savedSession.access_token}`,
        }
      : {},
  },
  realtime: {
    transport: ws,
  },
});
