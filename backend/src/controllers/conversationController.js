import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Participant from "../models/Participant.js";
import Message from "../models/Message.js"; // dùng khi xoá nhóm muốn xoá luôn tin nhắn
import User from "../models/User.js";

/** Helper: chuẩn hoá cặp user và tạo pairKey (dùng cho DM) */
function normalizePair(a, b) {
  const A = a.toString();
  const B = b.toString();
  const [minId, maxId] = A < B ? [A, B] : [B, A];
  return { pairKey: `${minId}#${maxId}` };
}

/** Tạo (hoặc lấy) hội thoại direct giữa tôi và 1 user khác */
export const directConversation = async (req, res) => {
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

    return res.status(200).json({ conversationId: conversation._id });
  } catch (err) {
    console.error("Lỗi tạo/lấy hội thoại direct:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Tạo nhóm */
export const createGroupConversation = async (req, res) => {
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

    return res.status(201).json({ conversationId: conversation._id });
  } catch (err) {
    console.error("Lỗi tạo nhóm:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Lấy danh sách hội thoại của tôi (paginate đơn giản) */
export const getMyConversations = async (req, res) => {
  try {
    const me = req.user._id;
    const { limit = 20, cursor } = req.query;

    // lấy list participant của tôi (đang còn trong hội thoại)
    const pQuery = { userID: me };
    const participants = await Participant.find(pQuery)
      .sort({ updatedAt: -1 })
      .limit(Math.min(Number(limit) || 20, 100))
      .lean();

    const conversationIDs = participants.map(p => p.conversationID);
    const convs = await Conversation.find({ _id: { $in: conversationIDs } })
      .sort({ lastMessageAt: -1 })
      .lean();

    // Có thể enrich thêm sau: số thành viên, unread, peer info...
    return res.status(200).json({ conversations: convs });
  } catch (err) {
    console.error("Lỗi lấy danh sách hội thoại:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Đổi tên / avatar nhóm (owner/admin) */
export const updateGroupInfo = async (req, res) => {
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
    return res.status(200).json({ message: "Cập nhật nhóm thành công" });
  } catch (err) {
    console.error("Lỗi cập nhật thông tin nhóm:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};

/** Xoá nhóm (owner) – xoá conversation, participants, messages */
export const deleteGroupConversation = async (req, res) => {
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
    console.error("Lỗi xoá nhóm:", err);
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
};
