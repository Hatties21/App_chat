import mongoose from "mongoose";
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import Friend from "../models/Friend.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user._id;

    // validate
    if (!mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ error: "ID người nhận không hợp lệ" });
    }

    // không cho gửi lời mời kết bạn tới chính mình
    if (from.toString() === to.toString()) {
      return res
        .status(400)
        .json({ error: "Không thể gửi lời mời kết bạn tới chính mình" });
    }

    // kiểm tra người dùng tồn tại
    const userExists = await User.exists({ _id: to });
    if (!userExists) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    let userA = from.toString();
    let userB = to.toString();
    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }
    const pairKey = `${userA}#${userB}`; 

    // Kiểm tra xem đã là bạn chưa và đã gửi lời mời kết bạn chưa?
    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ pairKey }),
      FriendRequest.findOne({
        status: "pending",
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ error: "Đã là bạn bè" });
    }

    if (existingRequest) {
      return res
        .status(400)
        .json({ error: "Đã có lời mời kết bạn đang chờ xử lý" });
    }

    const request = await FriendRequest.create({
      from,
      to,
      message,
      status: "pending",
    });

    return res
      .status(201)
      .json({ message: "Gửi lời mời kết bạn thành công", request });
  } catch (error) {
    console.error("Lỗi khi gửi lời mời kết bạn:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "ID lời mời không hợp lệ" });
    }

    // tìm lời mời kết bạn
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: "Lời mời kết bạn không tồn tại" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Không có quyền chấp nhận lời mời kết bạn này" });
    }

    // tạo bạn bè theo pairKey (Friend không có field status)
    let a = request.from.toString();
    let b = request.to.toString();
    if (a > b) [a, b] = [b, a];
    const pairKey = `${a}#${b}`;

    await Friend.updateOne(
      { pairKey },
      { $setOnInsert: { userA: a, userB: b, pairKey } },
      { upsert: true }
    );

    // Xoá request sau khi chấp nhận
    await FriendRequest.findByIdAndDelete(requestId);

    const from = await User.findById(request.from)
      .select("_id displayName avatarUrl")
      .lean();

    return res.status(200).json({
      message: "Chấp nhận lời mời kết bạn thành công",
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Lỗi khi chấp nhận lời mời kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // validate
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "ID lời mời không hợp lệ" });
    }

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền từ chối lời mời này" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi từ chối lời mời kết bạn:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .populate("userA", "_id displayName avatarUrl")
      .populate("userB", "_id displayName avatarUrl")
      .lean();

    if (!friendships.length) {
      return res.status(200).json({ friends: [] });
    }

    const friends = friendships.map((f) =>
      f.userA._id.toString() === userId.toString() ? f.userB : f.userA
    );

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn bè:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields = "_id username displayName avatarUrl";

    const [sent, received] = await Promise.all([
      // lọc pending
      FriendRequest.find({ from: userId, status: "pending" }).populate("to", populateFields),
      FriendRequest.find({ to: userId, status: "pending" }).populate("from", populateFields),
    ]);

    res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lời mời kết bạn:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

export const cancelFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // validate
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "ID lời mời không hợp lệ" });
    }

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: "Lời mời kết bạn không tồn tại" });
    }
    if (request.from.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Không có quyền hủy lời mời kết bạn này" });
    }
    await FriendRequest.findByIdAndDelete(requestId);
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi hủy lời mời kết bạn:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // validate
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ error: "ID bạn bè không hợp lệ" });
    }

    let userA = userId.toString();
    let userB = friendId.toString();
    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }
    const pairKey = `${userA}#${userB}`; // xoá bạn bè theo pairKey

    const friendship = await Friend.findOne({ pairKey });

    if (!friendship) {
      return res.status(404).json({ error: "Bạn bè không tồn tại" });
    }

    await Friend.findByIdAndDelete(friendship._id);
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi xóa bạn bè:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};
