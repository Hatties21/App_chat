import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Participant from "../models/Participant.js";
import Message from "../models/Message.js";
import { AppError } from "../middlewares/errorHandler.js";
import logger from "../utils/logger.js";

/** Gửi tin nhắn */
export const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { conversationID, type = "text", text, attachments = [], clientMsgId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationID)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    // kiểm tra tôi là participant
    const participant = await Participant.findOne({ conversationID, userID: senderId });
    if (!participant) {
      return res.status(403).json({ error: "Bạn không thuộc hội thoại này" });
    }

    // idempotency (nếu FE gửi trùng clientMsgId)
    if (clientMsgId) {
      const dup = await Message.findOne({ conversationID, senderId, clientMsgId }).lean();
      if (dup) return res.status(200).json({ message: dup });
    }

    const msg = await Message.create({
      senderId,
      conversationID,
      type,
      text: (text || "").trim(),
      attachments,
      clientMsgId,
    });

    // Populate sender info
    const populatedMsg = await Message.findById(msg._id)
      .populate('senderId', '_id username displayName avatarUrl')
      .lean();

    // cập nhật lastMessagePreview + lastMessageAt
    const preview = {
      content: type === "text" ? (msg.text || "") : `[${type}]`,
      createdAt: msg.createdAt,
      sender: senderId,
    };
    await Conversation.updateOne(
      { _id: conversationID },
      { $set: { lastMessagePreview: preview, lastMessageAt: msg.createdAt } }
    );

    logger.info(`Message sent: ${msg._id} in conversation ${conversationID}`);
    return res.status(201).json({ 
      success: true,
      message: populatedMsg 
    });
  } catch (err) {
    next(err);
  }
};

/** Lấy tin nhắn theo conversation (phân trang ngược) */
export const getMessages = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { conversationId } = req.params;
    let { limit = 25, before } = req.query;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    // phải là participant
    const isP = await Participant.exists({ conversationID: conversationId, userID: me });
    if (!isP) return res.status(403).json({ error: "Bạn không thuộc hội thoại này" });

    const query = { conversationID: conversationId };
    if (before) {
      // before theo thời gian
      const beforeDate = new Date(isNaN(before) ? before : Number(before));
      if (!isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    const limitNum = Math.min(Number(limit) || 25, 100);
    const rows = await Message.find(query)
      .populate('senderId', '_id username displayName avatarUrl')
      .populate('readBy.userId', '_id username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    const hasMore = rows.length === limitNum;
    const nextCursor = rows.length ? rows[rows.length - 1].createdAt : null;
    
    return res.status(200).json({ 
      success: true,
      messages: rows, 
      nextCursor,
      hasMore
    });
  } catch (err) {
    next(err);
  }
};

/** Sửa tin nhắn (chỉ người gửi) */
export const editMessage = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { messageId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "ID tin nhắn không hợp lệ" });
    }

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: "Không tìm thấy tin nhắn" });
    if (msg.senderId.toString() !== me.toString()) {
      return res.status(403).json({ error: "Bạn không có quyền sửa tin nhắn này" });
    }

    msg.text = (text || "").trim();
    msg.editedAt = new Date();
    await msg.save();

    // Nếu đây là tin nhắn mới nhất, cập nhật preview
    const last = await Message.findOne({ conversationID: msg.conversationID }).sort({ createdAt: -1 }).lean();
    if (last && last._id.toString() === msg._id.toString()) {
      await Conversation.updateOne(
        { _id: msg.conversationID },
        {
          $set: {
            "lastMessagePreview.content": msg.text || "[text]",
            "lastMessagePreview.createdAt": msg.createdAt,
            "lastMessagePreview.sender": msg.senderId,
          },
        }
      );
    }

    return res.status(200).json({ 
      success: true,
      message: msg 
    });
  } catch (err) {
    next(err);
  }
};

/** Xoá tin nhắn (soft delete hoặc hard delete tuỳ chọn – ở đây hard delete) */
export const deleteMessage = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "ID tin nhắn không hợp lệ" });
    }

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: "Không tìm thấy tin nhắn" });

    // chỉ người gửi mới được xoá (có thể mở rộng: admin/owner xoá)
    if (msg.senderId.toString() !== me.toString()) {
      return res.status(403).json({ error: "Bạn không có quyền xoá tin nhắn này" });
    }

    const convId = msg.conversationID;
    const wasLatest = !!(await Message.findOne({ conversationID: convId }).sort({ createdAt: -1 }).lean())
      && (await Message.findOne({ conversationID: convId }).sort({ createdAt: -1 }).lean())._id.toString() === msg._id.toString();

    await Message.findByIdAndDelete(messageId);

    // Nếu vừa xoá tin mới nhất → cập nhật preview sang tin kế tiếp
    if (wasLatest) {
      const nextLast = await Message.find({ conversationID: convId }).sort({ createdAt: -1 }).limit(1).lean();
      if (nextLast[0]) {
        const next = nextLast[0];
        await Conversation.updateOne(
          { _id: convId },
          {
            $set: {
              lastMessagePreview: {
                content: next.type === "text" ? (next.text || "") : `[${next.type}]`,
                createdAt: next.createdAt,
                sender: next.senderId,
              },
              lastMessageAt: next.createdAt,
            },
          }
        );
      } else {
        // không còn tin nhắn nào
        await Conversation.updateOne(
          { _id: convId },
          { $unset: { lastMessagePreview: "" }, $set: { lastMessageAt: null } }
        );
      }
    }

    logger.info(`Message deleted: ${messageId}`);
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

/** Thêm reaction vào tin nhắn */
export const addReaction = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "ID tin nhắn không hợp lệ" });
    }

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: "Emoji không hợp lệ" });
    }

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: "Không tìm thấy tin nhắn" });

    // Kiểm tra user có quyền react (phải là participant)
    const isParticipant = await Participant.exists({ 
      conversationID: msg.conversationID, 
      userID: me 
    });
    if (!isParticipant) {
      return res.status(403).json({ error: "Bạn không thuộc hội thoại này" });
    }

    // Xóa reaction cũ của user này (nếu có) với cùng emoji
    msg.reactions = msg.reactions.filter(
      r => !(r.userId.toString() === me.toString() && r.emoji === emoji)
    );

    // Thêm reaction mới
    msg.reactions.push({
      userId: me,
      emoji,
      createdAt: new Date()
    });

    await msg.save();

    // Populate để trả về
    const populatedMsg = await Message.findById(msg._id)
      .populate('senderId', '_id username displayName avatarUrl')
      .populate('reactions.userId', '_id username displayName avatarUrl')
      .lean();

    logger.info(`Reaction added to message ${messageId} by user ${me}`);
    return res.status(200).json({ 
      success: true,
      message: populatedMsg 
    });
  } catch (err) {
    next(err);
  }
};

/** Xóa reaction khỏi tin nhắn */
export const removeReaction = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "ID tin nhắn không hợp lệ" });
    }

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: "Không tìm thấy tin nhắn" });

    // Xóa reaction của user
    msg.reactions = msg.reactions.filter(
      r => !(r.userId.toString() === me.toString() && r.emoji === emoji)
    );

    await msg.save();

    // Populate để trả về
    const populatedMsg = await Message.findById(msg._id)
      .populate('senderId', '_id username displayName avatarUrl')
      .populate('reactions.userId', '_id username displayName avatarUrl')
      .lean();

    logger.info(`Reaction removed from message ${messageId} by user ${me}`);
    return res.status(200).json({ 
      success: true,
      message: populatedMsg 
    });
  } catch (err) {
    next(err);
  }
};
