import mongoose from "mongoose";
import Participant from "../models/Participant.js";
import Conversation from "../models/Conversation.js";

/** Lấy danh sách participants của 1 hội thoại */
export const getParticipants = async (req, res) => {
  try {
    const me = req.user._id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    // phải là thành viên
    const isP = await Participant.exists({ conversationID: conversationId, userID: me });
    if (!isP) return res.status(403).json({ error: "Bạn không thuộc hội thoại này" });

    const members = await Participant.find({ conversationID: conversationId })
      .select("_id conversationID userID role lastReadAt mute pinned nickname joinedAt leftAt")
      .populate("userID", "_id username displayName avatarUrl")
      .lean();

    return res.status(200).json({ participants: members });
  } catch (err) {
    console.error("Lỗi lấy participants:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Đặt lastReadAt = now (đánh dấu đã đọc) */
export const markRead = async (req, res) => {
  try {
    const me = req.user._id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    const updated = await Participant.findOneAndUpdate(
      { conversationID: conversationId, userID: me },
      { $set: { lastReadAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Bạn không thuộc hội thoại này" });

    return res.status(200).json({ lastReadAt: updated.lastReadAt });
  } catch (err) {
    console.error("Lỗi đánh dấu đã đọc:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Bật/tắt mute hoặc pin hoặc đổi nickname (chỉ bản thân) */
export const updateMyParticipantSettings = async (req, res) => {
  try {
    const me = req.user._id;
    const { conversationId } = req.params;
    const { mute, pinned, nickname } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    const update = {};
    if (typeof mute === "boolean") update.mute = mute;
    if (typeof pinned === "boolean") update.pinned = pinned;
    if (typeof nickname === "string") update.nickname = nickname.trim();

    const p = await Participant.findOneAndUpdate(
      { conversationID: conversationId, userID: me },
      { $set: update },
      { new: true }
    );
    if (!p) return res.status(404).json({ error: "Bạn không thuộc hội thoại này" });

    return res.status(200).json({ participant: p });
  } catch (err) {
    console.error("Lỗi cập nhật participant:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Thêm thành viên vào nhóm (owner/admin) */
export const addMembers = async (req, res) => {
  try {
    const me = req.user._id;
    const { conversationId } = req.params;
    let { memberIds = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "ID hội thoại không hợp lệ" });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv || conv.type !== "group") {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    const meP = await Participant.findOne({ conversationID: conversationId, userID: me });
    if (!meP || !["owner", "admin"].includes(meP.role)) {
      return res.status(403).json({ error: "Bạn không có quyền thêm thành viên" });
    }

    memberIds = Array.from(new Set((memberIds || []).map(String))).filter(Boolean);
    if (!memberIds.length) return res.status(400).json({ error: "Danh sách thành viên trống" });

    for (const id of memberIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: `ID thành viên không hợp lệ: ${id}` });
      }
    }

    const ops = memberIds.map(uid => ({
      updateOne: {
        filter: { conversationID: conversationId, userID: uid },
        update: { $setOnInsert: { role: "member", joinedAt: new Date() } },
        upsert: true,
      },
    }));
    await Participant.bulkWrite(ops);

    return res.status(200).json({ message: "Đã thêm thành viên" });
  } catch (err) {
    console.error("Lỗi thêm thành viên:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Gỡ thành viên khỏi nhóm (owner/admin), không được gỡ owner */
export const removeMember = async (req, res) => {
  try {
    const me = req.user._id;
    const { conversationId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv || conv.type !== "group") {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    const meP = await Participant.findOne({ conversationID: conversationId, userID: me });
    if (!meP || !["owner", "admin"].includes(meP.role)) {
      return res.status(403).json({ error: "Bạn không có quyền gỡ thành viên" });
    }

    const target = await Participant.findOne({ conversationID: conversationId, userID: userId });
    if (!target) return res.status(404).json({ error: "Thành viên không tồn tại trong nhóm" });
    if (target.role === "owner") {
      return res.status(400).json({ error: "Không thể gỡ chủ nhóm" });
    }

    await Participant.deleteOne({ _id: target._id });
    return res.sendStatus(204);
  } catch (err) {
    console.error("Lỗi gỡ thành viên:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Chuyển quyền chủ nhóm */
export const transferOwnership = async (req, res) => {
  try {
    const me = req.user._id;
    const { conversationId, newOwnerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(newOwnerId)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv || conv.type !== "group") {
      return res.status(404).json({ error: "Không tìm thấy nhóm" });
    }

    const owner = await Participant.findOne({ conversationID: conversationId, userID: me });
    if (!owner || owner.role !== "owner") {
      return res.status(403).json({ error: "Chỉ chủ nhóm được chuyển quyền" });
    }

    const target = await Participant.findOne({ conversationID: conversationId, userID: newOwnerId });
    if (!target) return res.status(404).json({ error: "Thành viên mới không tồn tại trong nhóm" });

    await Participant.updateOne({ _id: owner._id }, { $set: { role: "admin" } });
    await Participant.updateOne({ _id: target._id }, { $set: { role: "owner" } });

    return res.status(200).json({ message: "Đã chuyển quyền chủ nhóm" });
  } catch (err) {
    console.error("Lỗi chuyển quyền chủ nhóm:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Rời nhóm (tự rời) – nếu là owner, yêu cầu chuyển quyền trước */
export const leaveGroup = async (req, res) => {
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
    if (!meP) return res.status(404).json({ error: "Bạn không thuộc nhóm này" });

    if (meP.role === "owner") {
      return res.status(400).json({ error: "Chủ nhóm cần chuyển quyền trước khi rời nhóm" });
    }

    await Participant.deleteOne({ _id: meP._id });
    return res.sendStatus(204);
  } catch (err) {
    console.error("Lỗi rời nhóm:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};
