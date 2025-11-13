import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    userA: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // pairKey = min(userA,userB)#max(userA,userB) (set ở service trước khi save)
    pairKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Hỗ trợ truy vấn 1 chiều
friendSchema.index({ userA: 1 });
friendSchema.index({ userB: 1 });

const Friend = mongoose.model("Friend", friendSchema);
export default Friend;
