import { supabase } from "../config/supabase.js";
import { areFriends, checkBlockStatus } from "./friendService.js";
import { encryptText, decryptText } from "../utils/crypto.js";

export async function sendMessage(senderId, receiverId, body, friendUsername) {
  const friends = await areFriends(senderId, receiverId);
  if (!friends) {
    throw new Error(
      `You can't message @${friendUsername || "them"} yet. Wait until they accept your friend request.`,
    );
  }

  const isBlocked = await checkBlockStatus(senderId, receiverId);
  if (isBlocked) {
    throw new Error("Message could not be sent.");
  }

  const encryptedBody = encryptText(body);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      body_encrypted: encryptedBody,
      status: "sent",
    })
    .select()
    .single();

  if (error) throw error;

  data.body = decryptText(data.body_encrypted);
  return data;
}

export async function getChatMessages(userId, friendId, limit = 50) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  return data.map((msg) => ({
    ...msg,
    body: decryptText(msg.body_encrypted),
  }));
}

export async function markMessagesAsRead(senderId, receiverId) {
  const { error } = await supabase
    .from("messages")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .neq("status", "read");
  if (error) throw error;
}

export async function markAllReceivedAsDelivered(receiverId) {
  const { error } = await supabase
    .from("messages")
    .update({ status: "delivered" })
    .eq("receiver_id", receiverId)
    .eq("status", "sent");
  if (error) throw error;
}

export async function updateMessageStatus(messageId, status) {
  const { error } = await supabase
    .from("messages")
    .update({ status })
    .eq("id", messageId);
  if (error) throw error;
}
