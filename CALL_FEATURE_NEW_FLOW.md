# Call Feature - New Simplified Flow

## 🎯 Flow mới (Đơn giản hơn)

### 1. UserA (Caller) nhấn gọi UserB
**Frontend (UserA):**
- Click call button → `startCall()` → status = "calling"
- `useWebRTC` emit `callInitiate` với conversationId
- Vào CallWindow ngay lập tức, hiển thị "Đang gọi..."

**Backend:**
- Nhận `callInitiate` event
- Emit `callIncoming` tới conversation room (cả 2 users)

**Frontend (UserB):**
- Nhận `callIncoming` event
- Check: `from.id !== currentUser.id` → Tôi là callee
- `receiveCall()` → status = "ringing"
- Hiển thị IncomingCallModal

**Frontend (UserA):**
- Nhận `callIncoming` event
- Check: `from.id === currentUser.id` → Skip (tôi là caller)

### 2. UserB chấp nhận cuộc gọi
**Frontend (UserB):**
- Click "Chấp nhận" → `emitCallAccept(conversationId, callerId)`
- `acceptCall()` → status = "connected"

**Backend:**
- Nhận `callAccept` event
- Emit `callAccepted` tới conversation room (cả 2 users)

**Frontend (Cả 2):**
- Nhận `callAccepted` event
- `setStatus("connected")`
- `useWebRTC` tạo peer connection:
  - Caller: initiator = true
  - Callee: initiator = false
- Request media (audio/video)
- Trao đổi WebRTC signals qua `callSignal` event
- Kết nối stream → Cuộc gọi bắt đầu!

### 3. UserB từ chối cuộc gọi
**Frontend (UserB):**
- Click "Từ chối" → `emitCallReject(conversationId)`
- `rejectCall()` → status = "ended"

**Backend:**
- Nhận `callReject` event
- Emit `callRejected` tới conversation room

**Frontend (Cả 2):**
- Nhận `callRejected` event
- `cleanupCall()` → Reset về idle
- Toast: "Cuộc gọi bị từ chối"

### 4. Kết thúc cuộc gọi
**Frontend (Bất kỳ user nào):**
- Click "End Call" → `emitCallEnd(conversationId)`
- `endCall()` → status = "ended"

**Backend:**
- Nhận `callEnd` event
- Emit `callEnded` tới conversation room

**Frontend (Cả 2):**
- Nhận `callEnded` event
- `cleanupCall()` → Reset về idle
- Toast: "Cuộc gọi đã kết thúc"

---

## 🔄 Socket Events

### Client → Server:
- `callInitiate` - Bắt đầu cuộc gọi
  ```js
  { conversationId, to, from, type }
  ```

- `callAccept` - Chấp nhận cuộc gọi
  ```js
  { conversationId, callerId }
  ```

- `callReject` - Từ chối cuộc gọi
  ```js
  { conversationId }
  ```

- `callEnd` - Kết thúc cuộc gọi
  ```js
  { conversationId }
  ```

- `callSignal` - WebRTC signaling
  ```js
  { conversationId, to, signal }
  ```

### Server → Client:
- `callIncoming` - Thông báo cuộc gọi đến
  ```js
  { from, type, conversationId }
  ```

- `callAccepted` - Cuộc gọi được chấp nhận
  ```js
  { conversationId }
  ```

- `callRejected` - Cuộc gọi bị từ chối
  ```js
  { conversationId }
  ```

- `callEnded` - Cuộc gọi kết thúc
  ```js
  { conversationId }
  ```

- `callSignal` - WebRTC signal từ peer
  ```js
  { signal, from }
  ```

---

## ✅ Ưu điểm của flow mới

1. **Đơn giản hơn:** Không cần đợi accept mới tạo room
2. **Ít bug hơn:** Cả 2 users đều ở trong conversation room sẵn
3. **Dễ debug:** Events đều emit tới conversation room
4. **UX tốt hơn:** Caller thấy UI ngay, không phải đợi
5. **Giống các app phổ biến:** Zoom, Google Meet, Discord đều dùng flow này

---

## 📁 Files đã thay đổi

### Backend:
- `backend/src/socket/callHandler.js` - Simplified event handlers

### Frontend:
- `frontend/hooks/useWebRTC.ts` - Simplified peer connection logic
- `frontend/hooks/useSocket.ts` - Updated event listeners
- `frontend/stores/useCallStore.ts` - Updated comments
- `frontend/components/call/IncomingCallModal.tsx` - Emit socket events
- `frontend/components/call/CallWindow.tsx` - Emit socket events

---

## 🧪 Testing Steps

1. **Test voice call:**
   - UserA gọi UserB
   - UserB thấy modal incoming call
   - UserB chấp nhận
   - Cả 2 nghe thấy nhau

2. **Test video call:**
   - UserA gọi UserB với video
   - UserB thấy modal incoming call
   - UserB chấp nhận
   - Cả 2 thấy video của nhau

3. **Test reject:**
   - UserA gọi UserB
   - UserB từ chối
   - UserA thấy toast "Cuộc gọi bị từ chối"
   - Cả 2 về idle state

4. **Test end call:**
   - UserA gọi UserB, UserB chấp nhận
   - UserA end call
   - Cả 2 thấy toast "Cuộc gọi đã kết thúc"
   - Cả 2 về idle state

---

**Status:** ✅ Ready for testing
**Date:** November 24, 2025
