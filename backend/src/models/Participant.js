import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    conversationID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    lastReadAt: { type: Date },
    mute: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    nickname: { type: String, trim: true },
    joinedAt: { type: Date },
    leftAt: { type: Date },
  },
  { timestamps: true }
);

// Một user chỉ có 1 participant trong 1 conversation
participantSchema.index({ conversationID: 1, userID: 1 }, { unique: true });
// Lấy danh sách hội thoại của tôi nhanh
participantSchema.index({ userID: 1, updatedAt: -1 });
// Liệt kê members theo conversation
participantSchema.index({ conversationID: 1 });

const Participant = mongoose.model("Participant", participantSchema);
export default Participant;
