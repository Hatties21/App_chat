import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionString = process.env.MONGODB_CONNECTIONSTRING;
    
    if (!connectionString) {
      throw new Error("MONGODB_CONNECTIONSTRING không được định nghĩa trong .env");
    }
    
    console.log("🔄 Đang kết nối đến MongoDB...");
    // @ts-ignore
    await mongoose.connect(connectionString);
    console.log("✅ Liên kết CSDL thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi kết nối CSDL:", error);
    process.exit(1);
  }
};