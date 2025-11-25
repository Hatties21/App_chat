# Chad - Real-time Chat Application 💬

## 📋 Tổng quan

Ứng dụng chat real-time với đầy đủ tính năng messaging, friends, profiles, file uploads, và voice/video calling.

**Tech Stack:**
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js, Express 5, Socket.io, MongoDB, JWT
- **Real-time:** Socket.io
- **WebRTC:** simple-peer (voice/video calls)
- **File Storage:** Cloudinary (với fallback local storage)

---

## 🎯 Tính năng

### ✅ Authentication & Authorization
- Đăng ký/Đăng nhập với JWT
- OAuth (Google, GitHub)
- Session management
- Protected routes
- Token refresh

### ✅ User Management
- User profiles (avatar, bio, phone)
- View other user profiles
- Update own profile
- Avatar upload với Cloudinary
- Dark/Light theme toggle

### ✅ Friends System
- Send friend requests
- Accept/Decline requests
- Remove friends
- Search users
- Friend list với online status

### ✅ Real-time Messaging
- Direct messages (1-1)
- Group chats
- Text messages
- File/Image attachments (Cloudinary)
- Typing indicators
- Online/Offline status
- Message read status
- Message reactions
- Message editing/deletion
- Real-time delivery

### ✅ File Upload
- Avatar upload (5MB max, images only)
- Message attachments (10MB max, multiple types)
- Auto-delete old avatars
- Cloudinary integration với fallback local storage
- Image optimization và transformations

### ✅ Voice & Video Calls
- 1-1 voice calls
- 1-1 video calls
- Call buttons in chat
- Incoming call modal với ringtone
- Browser notifications
- Call window với controls (mute, video on/off)
- Disconnect handling
- Call timeout (60s)

### ✅ UI/UX
- Responsive design
- Dark mode
- Clean interface với shadcn/ui
- Smooth animations
- Toast notifications
- Loading states
- Optimistic UI updates

---

## 📁 Cấu trúc dự án

```
App_chat/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.js      # Cloudinary config
│   │   │   ├── passport.js        # OAuth config
│   │   │   └── rateLimiter.js     # Rate limiting
│   │   ├── controllers/           # Business logic
│   │   ├── middlewares/           # Auth, error handling, upload
│   │   ├── models/                # MongoDB schemas
│   │   ├── routes/                # API routes
│   │   ├── socket/                # Socket.io handlers
│   │   ├── utils/                 # Logger, file cleanup
│   │   └── server.js              # Entry point
│   ├── logs/                      # Log files
│   ├── uploads/                   # Temporary file storage
│   └── .env                       # Environment variables
│
└── frontend/
    ├── app/                       # Next.js pages
    ├── components/                # React components
    ├── hooks/                     # Custom hooks
    ├── lib/                       # Utilities
    ├── services/                  # API services
    ├── stores/                    # Zustand stores
    └── types/                     # TypeScript types
```

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB
- Cloudinary account (optional)

### Backend Setup

```bash
cd backend
npm install
```

**Environment Variables (.env):**
```env
PORT=5001
MONGODB_CONNECTIONSTRING=your_mongodb_uri
ACCESS_TOKEN_SECRET=your_secret_here
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Cloudinary (optional - fallback to local storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

**Start Backend:**
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

**Create .env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

**Start Frontend:**
```bash
npm run dev
```

**Access:** http://localhost:3000

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Đăng ký
- `POST /api/auth/signin` - Đăng nhập
- `POST /api/auth/signout` - Đăng xuất
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:userId` - Get user profile
- `PATCH /api/users/profile` - Update profile

### Friends
- `GET /api/friends` - Get friends list
- `GET /api/friends/requests` - Get friend requests
- `POST /api/friends/request` - Send friend request
- `PATCH /api/friends/accept/:requestId` - Accept request
- `DELETE /api/friends/:friendId` - Remove friend

### Conversations
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create conversation
- `PATCH /api/conversations/:id` - Update conversation

### Messages
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/:id/reactions` - Add reaction
- `DELETE /api/messages/:id/reactions` - Remove reaction

### Upload
- `POST /api/upload` - Upload file (10MB max)
- `POST /api/upload/avatar` - Upload avatar (5MB max)
- `DELETE /api/upload/avatar` - Delete avatar

---

## 🔌 Socket Events

### Connection
- `connect` - Socket connected
- `disconnect` - Socket disconnected
- `user:online` - User came online
- `user:offline` - User went offline

### Messaging
- `message:send` - Send message
- `message:new` - New message received
- `message:read` - Message read
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

### Calls
- `callInitiate` - Initiate call
- `callIncoming` - Incoming call notification
- `callAccept` - Accept call
- `callAccepted` - Call accepted
- `callReject` - Reject call
- `callRejected` - Call rejected
- `callEnd` - End call
- `callEnded` - Call ended (with reason)
- `callSignal` - WebRTC signaling

---

## 🎨 Cloudinary Integration

### Features
- ✅ Avatar upload với auto-delete old avatar
- ✅ Message attachments (images, videos, documents)
- ✅ Auto cleanup khi delete message
- ✅ Image optimization và transformations
- ✅ Fallback to local storage nếu không config

### Folder Structure
```
cloudinary/
├── avatars/              # User avatars
└── chat-attachments/     # Message attachments
```

### Image Optimization
```typescript
// Circular avatar (100x100)
const avatarUrl = getCircularAvatarUrl(url, 100);

// Optimized image
const optimizedUrl = getOptimizedImageUrl(url, {
  width: 400,
  quality: "auto",
  format: "auto"
});
```

---

## 📞 Voice & Video Calls

### Features
- ✅ 1-1 voice/video calls
- ✅ Ringtone (Web Audio API)
- ✅ Browser notifications
- ✅ Window focus khi có cuộc gọi
- ✅ Title flash
- ✅ Vibration (mobile)
- ✅ Call timeout (60s)
- ✅ Disconnect handling

### Browser Limitations
⚠️ **Web apps không thể tự động mở browser từ background** (browser security policy)

**Giải pháp hiện tại:**
1. ✅ Browser Notification - Click để focus window
2. ✅ Ringtone - Âm thanh liên tục
3. ✅ Title Flash - Dễ nhận biết khi ở tab khác
4. ✅ Vibration - Rung điện thoại (mobile)

**Khuyến nghị cho user:**
- Cho phép browser notifications
- Giữ browser tab mở
- Bật âm thanh

**Để có trải nghiệm tốt hơn (tương lai):**
- PWA (Progressive Web App)
- Browser Extension
- Desktop App (Electron)

### WebRTC Requirements
- HTTPS required in production
- STUN server: Google STUN (free)
- TURN server: Twilio/Xirsys (for NAT traversal)

---

## 🔐 Security

- JWT authentication
- Password hashing với bcrypt
- Protected routes
- Rate limiting
- CORS configuration
- Helmet security headers
- Input validation với Joi
- XSS protection
- File type validation
- File size limits

---

## 📈 Performance

- Optimistic UI updates
- Message pagination
- Lazy loading conversations
- Debounced typing indicators
- Efficient re-renders với Zustand
- Image optimization (Cloudinary)
- Socket.io singleton pattern
- Cleanup on disconnect

---

## 📝 Logging

### Console (Development)
- Chỉ hiển thị `warn` và `error`

### File Logs
- `logs/error.log` - Chỉ errors
- `logs/combined.log` - Tất cả logs

### Xem logs
```bash
# Real-time
tail -f backend/logs/combined.log

# Tìm kiếm
grep "error" backend/logs/combined.log
```

### Dọn dẹp logs
```bash
# Windows
del backend\logs\*.log

# Linux/Mac
rm backend/logs/*.log
```

---

## 🚀 Deployment

### Backend
1. Set environment variables
2. Configure MongoDB connection (MongoDB Atlas recommended)
3. Setup Cloudinary (recommended)
4. Enable HTTPS
5. Configure CORS for production domain
6. Setup TURN server for WebRTC

### Frontend
1. Build: `npm run build`
2. Set `NEXT_PUBLIC_API_URL` to production backend
3. Configure OAuth redirect URLs
4. Enable HTTPS (required for WebRTC)

### Recommended Platforms
- **Frontend:** Vercel, Netlify
- **Backend:** Render, Railway, Heroku
- **Database:** MongoDB Atlas (free tier)
- **File Storage:** Cloudinary (free tier)

---

## 🐛 Troubleshooting

### Backend không kết nối MongoDB
- Check MongoDB connection string
- Check MongoDB service đang chạy
- Check network/firewall

### Upload file fail - "Must supply api_key"
**Nguyên nhân:** ES modules hoisting - `import` statements chạy trước `dotenv.config()`

**Giải pháp:** Load dotenv trong `cloudinary.js`:
```javascript
import dotenv from 'dotenv';
dotenv.config();
```

### Call không hoạt động
- Check HTTPS (required for WebRTC)
- Check browser permissions (camera/microphone)
- Check firewall/NAT settings
- Check STUN/TURN server config

### Socket không connect
- Check backend đang chạy
- Check CORS configuration
- Check `NEXT_PUBLIC_API_URL` đúng
- Check browser console for errors

---

## 🎓 Key Learnings

1. **ES Modules hoisting** - `import` statements chạy trước code, cần load `dotenv` trong file config
2. **Socket.io singleton** - Tránh duplicate connections
3. **Optimistic UI** - Cải thiện UX đáng kể
4. **WebRTC signaling** - Cần backend để trao đổi signals
5. **Browser limitations** - Web apps không thể tự động focus window từ background
6. **Cloudinary transformations** - Optimize images qua URL parameters
7. **Call cleanup** - Quan trọng để tránh zombie states
8. **Disconnect handling** - Timeout và cleanup khi user tắt tab

---

## 🔮 Future Enhancements

- [ ] Group video calls
- [ ] Screen sharing
- [ ] Voice messages
- [ ] Push notifications (PWA)
- [ ] Message search
- [ ] User blocking
- [ ] Admin panel
- [ ] Analytics dashboard
- [ ] End-to-end encryption
- [ ] Message forwarding
- [ ] Stickers/GIFs

---

## 📚 Documentation

- Cloudinary: https://cloudinary.com/documentation
- Socket.io: https://socket.io/docs/
- WebRTC: https://webrtc.org/
- Next.js: https://nextjs.org/docs
- MongoDB: https://docs.mongodb.com/

---

## 📄 License

MIT

---

**Status:** ✅ Production Ready
**Last Updated:** November 24, 2025
**Version:** 1.0.1
