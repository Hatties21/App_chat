import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: function() {
        // Password not required for OAuth users
        return !this.googleId;
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String, //link CDN
    },
    avartarId: {
      type: String, //cloudinary public_id để sửa hoặc xóa ảnh
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    phone: {
      type: String,
      sparse: true, //không nhập cũng được nhưng khi nhập thì không được trùng
      unique: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    // OAuth fields
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    // Preferences
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
