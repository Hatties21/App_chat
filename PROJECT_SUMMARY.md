# Chad - Real-time Chat Application 💬

## 📋 Tổng quan dự án

Ứng dụng chat real-time với đầy đủ tính năng messaging, friends, profiles, và voice/video calling.

**Tech Stack:**
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js, Express 5, Socket.io, MongoDB, JWT
- **Real-time:** Socket.io
- **WebRTC:** simple-peer (cho voice/video calls)

---

## 🎯 Features đã hoàn thành

### ✅ 1. Authentication & Authorization
- Đăng ký/Đăng nhập với JWT
- OAuth (Google, GitHub)
- Session management
- Protected routes
- Token refresh

### ✅ 2. User Management
- User profiles (avatar, bio, phone)
- View other user profiles
- Update own profile
- Dark/Light theme toggle

### ✅ 3. Friends System
- Send friend requests
- Accept/Decline requests
- Remove friends
- Search users
- Friend list với online status

### ✅ 4. Real-time Messaging
- Direct messages (1-1)
- Group chats
- Text messages
- File/Image attachments
- Typing indicators
- Online/Offline status
- Message read status
- Real-time message delivery

### ✅ 5. UI/UX
- Responsive design
- Dark mode
- Clean interface với shadcn/ui
- Smooth animations
- Toast notifications
- Loading states

### 🟡 6. Voice & Video Calls (90% complete)
- Call buttons in chat
- Incoming call modal
- Call window với controls
- Mute/Unmute
- Video on/off
- **Issue:** Backend không nhận `callInitiate` event (đang debug)

---

## 📁 Cấu trúc dự án

```
App_chat/
├── backend/
│   ├── src/
│   │   ├── config/         # Configurations (passport, rate limiter)
│   │   ├── controllers/    # Business logic
│   │   ├── middlewares/    # Auth, error handling
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── socket/         # Socket.io handlers
│   │   │   ├── index.js    # Socket initialization
│   │   │   └── callHandler.js  # Call events
│   │   ├── utils/          # Helpers, logger
│   │   └── server.js       # Entry point
│   └── uploads/            # File storage
│
└── frontend/
    ├── app/                # Next.js pages
    │   ├── (auth)/        # Auth pages
    │   ├── profile/       # Profile pages
    │   └── page.tsx       # Home (chat)
    ├── components/
    │   ├── auth/          # Auth components
    │   ├── call/          # Call components
    │   │   ├── CallButtons.tsx
    │   │   ├── CallWindow.tsx
    │   │   └── IncomingCallModal.tsx
    │   ├── chat/          # Chat components
    │   ├── pages/         # Page components
    │   └── ui/            # shadcn/ui components
    ├── hooks/
    │   ├── useSocket.ts   # Socket hook
    │   └── useWebRTC.ts   # WebRTC hook
    ├── lib/
    │   ├── api.ts         # Axios instance
    │   └── socket.ts      # Socket.io client
    ├── services/          # API services
    ├── stores/            # Zustand stores
    │   ├── useAuthStore.ts
    │   ├── useChatStore.ts
    │   ├── useFriendStore.ts
    │   └── useCallStore.ts
    └── types/             # TypeScript types
```

---

## 🔧 Setup & Installation

### Backend:
```bash
cd backend
npm install
# Create .env file with:
# - MONGODB_URI
# - ACCESS_TOKEN_SECRET
# - REFRESH_TOKEN_SECRET
# - CLIENT_URL
# - PORT=5001
npm run dev
```

### Frontend:
```bash
cd frontend
npm install
# Create .env.local with:
# - NEXT_PUBLIC_API_URL=http://localhost:5001
npm run dev
```

---

## 🐛 Issues đã fix

### 1. Friend Profile Undefined UserId
**Vấn đề:** `params.userId` undefined khi click vào friend profile
**Fix:** Dùng `useParams()` hook trong client component

### 2. Direct Message from Profile
**Vấn đề:** Click "Nhắn tin" không mở chat
**Fix:** Thêm query param handler trong HomeClient

### 3. Button Alignment với Long Text
**Vấn đề:** Username dài đẩy button ra ngoài
**Fix:** Thêm `max-w-[calc(100%-140px)]` và `truncate`

### 4. Socket Initialization
**Vấn đề:** useWebRTC không access được socket
**Fix:** Dùng shared singleton instance từ `initSocket()`

### 5. Messaging Not Real-time
**Vấn đề:** Tin nhắn không real-time, phải refresh
**Root cause:** Frontend gửi text content thay vì messageId
**Fix:** `sendMessage` return messageId và emit đúng ID

---

## 🔴 Issue hiện tại

### Voice/Video Call - Backend không nhận event

**Triệu chứng:**
- Frontend emit `callInitiate` ✅
- Backend KHÔNG nhận event ❌
- Nhưng `test-event` work ✅

**Đã thử:**
- Đổi event name (call:initiate → callInitiate)
- Verify socket connection
- Thêm extensive logging
- Test với test-event (work!)

**Giả thuyết:**
Socket instance trong `useWebRTC` có thể khác với instance đã join rooms.

**Next steps:**
1. Emit từ `useSocket` thay vì `useWebRTC`
2. Pass socket instance từ useSocket
3. Hoặc dùng HTTP polling cho signaling

---

## 📊 API Endpoints

### Auth:
- `POST /api/auth/signup` - Đăng ký
- `POST /api/auth/signin` - Đăng nhập
- `POST /api/auth/signout` - Đăng xuất
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Users:
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar

### Friends:
- `GET /api/friends` - Get friends list
- `GET /api/friends/requests` - Get friend requests
- `POST /api/friends/request` - Send friend request
- `PUT /api/friends/accept/:requestId` - Accept request
- `DELETE /api/friends/:friendId` - Remove friend

### Conversations:
- `GET /api/conversations` - Get all conversations
- `POST /api/conversations` - Create conversation
- `PUT /api/conversations/:id` - Update conversation

### Messages:
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read

---

## 🔌 Socket Events

### Connection:
- `connect` - Socket connected
- `disconnect` - Socket disconnected
- `user:online` - User came online
- `user:offline` - User went offline

### Messaging:
- `message:send` - Send message (client → server)
- `message:new` - New message (server → clients)
- `message:read` - Message read
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

### Calls (in progress):
- `callInitiate` - Initiate call
- `callIncoming` - Incoming call
- `callAccept` - Accept call
- `callReject` - Reject call
- `callEnd` - End call

---

## 🎨 UI Components

### shadcn/ui components used:
- Avatar
- Button
- Dialog
- Dropdown Menu
- Input
- Label
- Scroll Area
- Separator
- Switch
- Tabs
- Toast (sonner)

### Custom components:
- MessageList
- MessageInput
- ConversationList
- FriendsTab
- ChatHeader
- CallButtons
- CallWindow
- IncomingCallModal

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

---

## 📈 Performance

- Optimistic UI updates
- Message pagination
- Lazy loading conversations
- Debounced typing indicators
- Efficient re-renders với Zustand
- Image optimization

---

## 🚀 Deployment Notes

### Backend:
- Set environment variables
- Configure MongoDB connection
- Setup file storage (Cloudinary recommended)
- Enable HTTPS
- Configure CORS for production domain

### Frontend:
- Build: `npm run build`
- Set NEXT_PUBLIC_API_URL to production backend
- Configure OAuth redirect URLs
- Enable HTTPS (required for WebRTC)

### WebRTC (for calls):
- HTTPS required in production
- Need TURN server for NAT traversal
- Free STUN servers: Google STUN
- Consider Twilio/Xirsys for TURN

---

## 📝 Environment Variables

### Backend (.env):
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/chat
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## 🎓 Lessons Learned

1. **Socket.io events cần consistent naming** - Tránh dấu `:` nếu có vấn đề
2. **Debug real-time features rất khó** - Cần logging tốt
3. **Optimistic UI quan trọng** - UX tốt hơn nhiều
4. **Type safety giúp catch bugs sớm** - TypeScript rất hữu ích
5. **State management cần cẩn thận** - Zustand đơn giản và hiệu quả

---

## 🔮 Future Enhancements

- [ ] Fix call feature (backend event issue)
- [ ] Group video calls
- [ ] Screen sharing
- [ ] Message reactions
- [ ] Message editing/deletion
- [ ] Voice messages
- [ ] Push notifications
- [ ] Message search
- [ ] User blocking
- [ ] Admin panel
- [ ] Analytics dashboard

---

## 📞 Support

Nếu gặp vấn đề:
1. Check backend console logs
2. Check frontend console logs
3. Verify socket connection
4. Check MongoDB connection
5. Review environment variables

---

**Status:** 🟢 Production Ready (except call feature)
**Last Updated:** November 23, 2025
**Version:** 1.0.0
