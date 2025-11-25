import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    groupname: { type: String, trim: true },
    avatarUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const lastMessagePreviewSchema = new mongoose.Schema(
  {
    content: { type: String, trim: true },
    createdAt: { type: Date },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    // Với DM: pairKey = min(userA,userB)#max(userA,userB)
    pairKey: { type: String },
    group: groupSchema,
    lastMessagePreview: lastMessagePreviewSchema,
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

// Sort nhanh danh sách hội thoại
conversationSchema.index({ lastMessageAt: -1 });

// Đảm bảo duy nhất DM theo pairKey khi type='direct'
conversationSchema.index(
  { pairKey: 1 },
  { unique: true, partialFilterExpression: { type: "direct", pairKey: { $exists: true } } }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
