import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    mime: { type: String },
    size: { type: Number },
    name: { type: String, trim: true },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "file"],
      default: "text",
    },
    text: { type: String, trim: true },
    attachments: [attachmentSchema],
    clientMsgId: { type: String }, // idempotency từ FE
    editedAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Phân trang ngược theo thời gian trong 1 conversation
messageSchema.index({ conversationID: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
