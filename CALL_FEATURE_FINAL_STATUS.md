# Call Feature - Final Debug Status

## ✅ Đã hoàn thành
1. **Socket infrastructure** - Singleton pattern, no duplicates
2. **Call cleanup** - Cả 2 users thoát đúng khi end call
3. **Event filtering** - Caller skip callIncoming event đúng
4. **Callee flow** - Người dùng 2 nhận call, accept, và vào cuộc gọi HOÀN HẢO

## ❌ Vấn đề còn lại
**Caller (Hatties) không vào được cuộc gọi sau khi callee accept**

### Root Cause
Caller không nhận được `callAccepted` event từ backend, hoặc không xử lý đúng.

### Flow hiện tại
1. ✅ Hatties click call → `startCall()` → status="calling", receiver="Người dùng 2"
2. ✅ Peer connection tạo signal → emit `callInitiate`
3. ✅ Backend emit `callIncoming` tới conversation room
4. ✅ Hatties nhận event nhưng SKIP đúng (vì from.id === currentUser.id)
5. ✅ Người dùng 2 nhận event → `receiveCall()` → status="ringing", caller="Hatties"
6. ✅ Người dùng 2 click accept → `acceptCall()` → status="connected"
7. ✅ Người dùng 2 tạo peer connection as CALLEE → emit `call:accept` với signal
8. ❌ **Hatties KHÔNG nhận được `callAccepted` event** (hoặc không xử lý)
9. ❌ Hatties vẫn ở status="calling", không vào cuộc gọi

### Debug đã làm
- ✅ Thêm log "🎉🎉🎉 CALLER: callAccepted event received!" trong useSocket
- ⏳ Cần test xem Hatties có thấy log này không

### Next Steps
1. Test lại và check console của Hatties sau khi Người dùng 2 accept
2. Nếu KHÔNG thấy "🎉🎉🎉", có nghĩa là:
   - Backend không emit `callAccepted` đúng
   - Hoặc emit tới sai socket/room
3. Nếu CÓ thấy "🎉🎉🎉", có nghĩa là:
   - `signalPeer()` không hoạt động
   - Hoặc peer connection không được tạo đúng

### Backend Check Needed
File: `backend/src/socket/callHandler.js`
```javascript
socket.on("call:accept", ({ to, signal }) => {
  logger.info(`Call accepted: ${socket.userId} -> ${to}`);
  
  io.to(to).emit("callAccepted", {
    signal,
  });
});
```

Cần check:
- `to` có đúng là userId của Hatties không?
- `io.to(to)` có emit đúng không?
- Có log backend khi Người dùng 2 accept không?

### Files Modified (Latest)
- `frontend/hooks/useSocket.ts` - Added debug logs for callAccepted
- `frontend/stores/useCallStore.ts` - Cleaned up logs
- `backend/src/socket/callHandler.js` - Emit to conversation room

### Key Insight
Callee flow hoạt động HOÀN HẢO → Socket infrastructure OK
Vấn đề chỉ ở caller không nhận `callAccepted` → Có thể là backend emit issue
