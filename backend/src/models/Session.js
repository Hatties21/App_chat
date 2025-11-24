import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      lastUsedAt: Date,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
sessionSchema.index({ userId: 1, expiresAt: 1 });
sessionSchema.index({ userId: 1, isRevoked: 1 });

// TTL index - tự động xoá khi hết hạn
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method: Cleanup expired sessions
sessionSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

// Static method: Limit sessions per user
sessionSchema.statics.limitUserSessions = async function(userId, maxSessions = 5) {
  const sessions = await this.find({ userId, isRevoked: false })
    .sort({ createdAt: -1 })
    .lean();
  
  if (sessions.length >= maxSessions) {
    // Xóa sessions cũ nhất
    const sessionsToDelete = sessions.slice(maxSessions - 1);
    const idsToDelete = sessionsToDelete.map(s => s._id);
    await this.deleteMany({ _id: { $in: idsToDelete } });
  }
};

// Static method: Revoke all user sessions (for logout all devices)
sessionSchema.statics.revokeAllUserSessions = async function(userId) {
  const result = await this.updateMany(
    { userId },
    { $set: { isRevoked: true } }
  );
  return result.modifiedCount;
};

export default mongoose.model("Session", sessionSchema);