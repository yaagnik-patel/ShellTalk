import { supabase } from "../config/supabase.js";
import { decryptText } from "../utils/crypto.js";

export function subscribeToMessages(userId, callbacks) {
  const { onNewMessage, onMessageUpdate } = callbacks;

  const channel = supabase
    .channel("messages_channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        if (onNewMessage) {
          const msg = payload.new;
          msg.body = decryptText(msg.body_encrypted);
          onNewMessage(msg);
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${userId}`,
      },
      (payload) => {
        if (onMessageUpdate) onMessageUpdate(payload.new);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
