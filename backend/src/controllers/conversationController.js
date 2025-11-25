import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Participant from "../models/Participant.js";
import Message from "../models/Message.js"; // dùng khi xoá nhóm muốn xoá luôn tin nhắn
import User from "../models/User.js";
import { AppError } from "../middlewares/errorHandler.js";
import logger from "../utils/logger.js";

/** Helper: chuẩn hoá cặp user và tạo pairKey (dùng cho DM) */
function normalizePair(a, b) {
  const A = a.toString();
  const B = b.toString();
  const [minId, maxId] = A < B ? [A, B] : [B, A];
  return { pairKey: `${minId}#${maxId}` };
}

/** Tạo (hoặc lấy) hội thoại direct giữa tôi và 1 user khác */
export const directConversation = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { toUserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ error: "ID người nhận không hợp lệ" });
    }
    if (me.toString() === toUserId.toString()) {
      return res.status(400).json({ error: "Không thể tạo hội thoại với chính mình" });
    }

    const otherExists = await User.exists({ _id: toUserId });
    if (!otherExists) return res.status(404).json({ error: "Người dùng không tồn tại" });

    const { pairKey } = normalizePair(me, toUserId);

    // Upsert hội thoại direct dựa theo unique index pairKey (partial khi type=direct)
    const conversation = await Conversation.findOneAndUpdate(
      { type: "direct", pairKey },
      { $setOnInsert: { type: "direct", pairKey } },
      { new: true, upsert: true }
    );

    // Đảm bảo Participant cho cả hai bên
    await Promise.all([
      Participant.updateOne(
        { conversationID: conversation._id, userID: me },
        { $setOnInsert: { role: "member", joinedAt: new Date() } },
        { upsert: true }
      ),
      Participant.updateOne(
        { conversationID: conversation._id, userID: toUserId },
        { $setOnInsert: { role: "member", joinedAt: new Date() } },
        { upsert: true }
      ),
    ]);

    return res.status(200).json({ 
      success: true,
      conversationId: conversation._id 
    });
  } catch (err) {
    next(err);
  }
};

/** Tạo nhóm */
export const createGroupConversation = async (req, res, next) => {
  try {
    const me = req.user._id;
    let { groupname, avatarUrl, memberIds = [] } = req.body;

    // ép unique + loại bỏ chính chủ nếu có, rồi thêm chính chủ vào đầu
    memberIds = Array.from(new Set((memberIds || []).map(String))).filter(id => id !== me.toString());
    memberIds.unshift(me.toString());

    if (memberIds.length < 2) {
      return res.status(400).json({ error: "Nhóm cần ít nhất 2 thành viên" });
    }
    // validate ids
    for (const id of memberIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: `ID thành viên không hợp lệ: ${id}` });
      }
    }

    const conversation = await Conversation.create({
      type: "group",
      group: { groupname: groupname?.trim() || "New Group", avatarUrl, createdBy: me },
      lastMessageAt: new Date(),
    });

    // tạo participant (me = owner)
    const bulk = memberIds.map((uid, idx) => ({
      updateOne: {
        filter: { conversationID: conversation._id, userID: uid },
        update: {
          $setOnInsert: {
            role: idx === 0 ? "owner" : "member",
            joinedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));
    await Participant.bulkWrite(bulk);

    return res.status(201).json({ 
      success: true,
      conversationId: conversation._id 
    });
  } catch (err) {
    next(err);
  }
};

/** Lấy danh sách hội thoại của tôi (paginate đơn giản) */
export const getMyConversations = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { limit = 20, cursor } = req.query;

    // lấy list participant của tôi (đang còn trong hội thoại)
    const pQuery = { userID: me };
    const participants = await Participant.find(pQuery)
      .sort({ updatedAt: -1 })
      .limit(Math.min(Number(limit) || 20, 100))
      .lean();

    logger.info(`User ${me} has ${participants.length} participant records`);

    const conversationIDs = participants.map(p => p.conversationID);
    const convs = await Conversation.find({ _id: { $in: conversationIDs } })
      .sort({ lastMessageAt: -1 })
      .lean();

    // Enrich direct conversations with other user info and unread count
    const enrichedConvs = await Promise.all(
      convs.map(async (conv) => {
        const participant = participants.find(p => p.conversationID.toString() === conv._id.toString());
        
        // Calculate unread count
        const unreadQuery = {
          conversationID: conv._id,
          senderId: { $ne: me },
        };
        if (participant?.lastReadAt) {
          unreadQuery.createdAt = { $gt: participant.lastReadAt };
        }
        const unreadCount = await Message.countDocuments(unreadQuery);

        if (conv.type === 'direct' && conv.pairKey) {
          // Get other user from pairKey
          const [userA, userB] = conv.pairKey.split('#');
          const otherUserId = userA === me.toString() ? userB : userA;
          
          const otherUser = await User.findById(otherUserId)
            .select('_id username displayName avatarUrl')
            .lean();

          return {
            ...conv,
            otherUser,
            unreadCount,
          };
        }
        
        return {
          ...conv,
          unreadCount,
        };
      })
    );

    logger.info(`Returning ${enrichedConvs.length} conversations for user ${me}`);

    return res.status(200).json({ 
      success: true,
      conversations: enrichedConvs 
    });
  } catch (err) {
    next(err);
  }
};

/** Đổi tên / avatar nhóm (owner/admin) */
export const updateGroupInfo = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { conversationId } = req.params;
    const { groupname, avatarUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv || conv.type !== "group") {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    const meP = await Participant.findOne({ conversationID: conversationId, userID: me });
    if (!meP || !["owner", "admin"].includes(meP.role)) {
      return res.status(403).json({ error: "Bạn không có quyền cập nhật nhóm" });
    }

    const update = {};
    if (typeof groupname === "string") update["group.groupname"] = groupname.trim();
    if (typeof avatarUrl === "string") update["group.avatarUrl"] = avatarUrl;

    await Conversation.updateOne({ _id: conversationId }, { $set: update });
    return res.status(200).json({ 
      success: true,
      message: "Cập nhật nhóm thành công" 
    });
  } catch (err) {
    next(err);
  }
};

/** Xoá nhóm (owner) – xoá conversation, participants, messages */
export const deleteGroupConversation = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv || conv.type !== "group") {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    const meP = await Participant.findOne({ conversationID: conversationId, userID: me });
    if (!meP || meP.role !== "owner") {
      return res.status(403).json({ error: "Chỉ chủ nhóm mới có quyền xoá nhóm" });
    }

    await Promise.all([
      Participant.deleteMany({ conversationID: conversationId }),
      Message.deleteMany({ conversationID: conversationId }),
      Conversation.findByIdAndDelete(conversationId),
    ]);

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

/** Mark conversation as read */
export const markAsRead = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { conversationId } = req.params;
    const { messageId } = req.body; // Optional: specific message to mark as read

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    // Check if user is participant
    const participant = await Participant.findOne({
      conversationID: conversationId,
      userID: me,
    });

    if (!participant) {
      return res.status(403).json({ error: "Bạn không thuộc hội thoại này" });
    }

    // Get latest message if no specific messageId provided
    let targetMessageId = messageId;
    if (!targetMessageId) {
      const latestMessage = await Message.findOne({ conversationID: conversationId })
        .sort({ createdAt: -1 })
        .select('_id')
        .lean();
      
      if (latestMessage) {
        targetMessageId = latestMessage._id;
      }
    }

    // Update participant's lastRead
    participant.lastReadMessageId = targetMessageId;
    participant.lastReadAt = new Date();
    await participant.save();

    // Mark all unread messages as read (add to readBy array)
    const unreadQuery = {
      conversationID: conversationId,
      senderId: { $ne: me }, // Don't mark own messages
      'readBy.userId': { $ne: me }, // Not already read
    };
    
    if (participant.lastReadAt) {
      unreadQuery.createdAt = { $lte: new Date() };
    }

    await Message.updateMany(
      unreadQuery,
      {
        $addToSet: {
          readBy: {
            userId: me,
            readAt: new Date(),
          },
        },
      }
    );

    logger.info(`User ${me} marked conversation ${conversationId} as read`);

    return res.status(200).json({
      success: true,
      message: "Đã đánh dấu đã đọc",
    });
  } catch (err) {
    next(err);
  }
};

/** Get unread count for a conversation */
export const getUnreadCount = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    const participant = await Participant.findOne({
      conversationID: conversationId,
      userID: me,
    });

    if (!participant) {
      return res.status(403).json({ error: "Bạn không thuộc hội thoại này" });
    }

    // Count messages after lastReadAt
    const query = {
      conversationID: conversationId,
      senderId: { $ne: me }, // Don't count own messages
    };

    if (participant.lastReadAt) {
      query.createdAt = { $gt: participant.lastReadAt };
    }

    const unreadCount = await Message.countDocuments(query);

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};
