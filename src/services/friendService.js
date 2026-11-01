import { supabase } from "../config/supabase.js";

export async function sendFriendRequest(senderId, receiverId) {
  const { error } = await supabase
    .from("friend_requests")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
    });
  if (error) {
    if (error.code === "23505")
      throw new Error("Friend request already pending.");
    throw error;
  }
}

export async function listIncomingRequests(userId) {
  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      `
      id,
      sender_id,
      profiles!friend_requests_sender_id_fkey ( username, display_name )
    `,
    )
    .eq("receiver_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return data.map((r) => ({
    requestId: r.id,
    userId: r.sender_id,
    username: r.profiles.username,
    displayName: r.profiles.display_name,
  }));
}

export async function listOutgoingPendingRequests(userId) {
  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      `
      receiver_id,
      profiles!friend_requests_receiver_id_fkey ( username )
    `,
    )
    .eq("sender_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return data.map((r) => ({
    userId: r.receiver_id,
    username: r.profiles.username,
  }));
}

export async function acceptFriendRequest(requestId) {
  const { error } = await supabase.rpc("accept_friend_request", {
    request_id: requestId,
  });
  if (error) throw error;
}

export async function rejectFriendRequest(requestId) {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;
}

export async function areFriends(userId, friendId) {
  const { data, error } = await supabase
    .from("friends")
    .select("id")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return !!data;
}

export async function getFriends(userId) {
  const { data, error } = await supabase
    .from("friends")
    .select(
      `
      friend_id,
      profiles!friends_friend_id_fkey ( username, display_name )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;
  return data.map((f) => ({
    id: f.friend_id,
    username: f.profiles.username,
    displayName: f.profiles.display_name,
  }));
}

export async function checkBlockStatus(userId, targetId) {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id")
    .or(
      `and(blocker_id.eq.${userId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${userId})`,
    )
    .limit(1);
  if (error && error.code !== "PGRST116") throw error;
  return data && data.length > 0;
}

export async function blockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from("blocked_users")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && error.code !== "23505") throw error;
}

export async function unblockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

import { decryptText } from "../utils/crypto.js";

export async function getFriendsWithStats(userId) {
  const friends = await getFriends(userId);

  for (let friend of friends) {
    const { count: unreadCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", friend.id)
      .eq("receiver_id", userId)
      .neq("status", "read");

    friend.unreadCount = unreadCount || 0;

    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("body_encrypted, created_at")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${userId})`,
      )
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastMsgs && lastMsgs.length > 0) {
      const decrypted = decryptText(lastMsgs[0].body_encrypted);
      friend.lastMessagePreview =
        decrypted === "[Unable to decrypt message]"
          ? decrypted
          : decrypted.substring(0, 30);
    } else {
      friend.lastMessagePreview = null;
    }
    friend.online = false; // Add presence support later
  }
  return friends;
}
