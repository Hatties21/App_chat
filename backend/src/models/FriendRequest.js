import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "blocked"],
      default: "pending",
    },
    message: { type: String, trim: true },
  },
  { timestamps: true }
);

// Không cho trùng pending A->B
friendRequestSchema.index(
  { from: 1, to: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

// Hộp thư đến cho tôi
friendRequestSchema.index({ to: 1, createdAt: -1 });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;
