import { Listing } from "@/lib/models/Listing";
import { Favorite } from "@/lib/models/Favorite";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";

/** Deletes listings together with the saves, chats and messages that point at them. */
export async function deleteListingsCascade(ids: string[]) {
  if (ids.length === 0) return 0;
  const threads = await Conversation.find({ listing: { $in: ids } }).distinct("_id");
  const [result] = await Promise.all([
    Listing.deleteMany({ _id: { $in: ids } }),
    Favorite.deleteMany({ listingId: { $in: ids } }),
    Message.deleteMany({ conversation: { $in: threads } }),
    Conversation.deleteMany({ _id: { $in: threads } }),
  ]);
  return result.deletedCount;
}

/**
 * Before accounts are deleted: their cars come off sale (kept as "removed" so the team can still see them),
 * and their saved cars go.
 */
export async function retireUsersContent(userIds: string[]) {
  if (userIds.length === 0) return;
  await Promise.all([
    Listing.updateMany({ sellerId: { $in: userIds }, status: { $ne: "removed" } }, { $set: { status: "removed" } }),
    Favorite.deleteMany({ userId: { $in: userIds } }),
  ]);
}
