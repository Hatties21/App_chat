# Call Feature - Enhancements

## 🔔 Tính năng mới đã thêm

### 1. Ringtone (Nhạc chuông)
**File:** `frontend/lib/ringtone.ts`

- Sử dụng Web Audio API để tạo ringtone
- Không cần file audio, tạo âm thanh trực tiếp
- Pattern: beep-beep-pause (giống điện thoại thật)
- Volume: 30% (không quá to)
- Tự động dừng khi accept/reject

**Cách hoạt động:**
```typescript
playRingtone()  // Bắt đầu reo
stopRingtone()  // Dừng reo
```

### 2. Tab Focus & Notification
**File:** `frontend/components/call/IncomingCallModal.tsx`

Khi có cuộc gọi đến:

#### a) Focus Window
```typescript
window.focus()
```
- Đưa tab lên foreground
- Hoạt động ngay cả khi đang ở tab khác

#### b) Browser Notification
- Hiển thị notification nếu tab không visible
- Yêu cầu permission lần đầu
- Notification có:
  - Title: "Cuộc gọi đến"
  - Body: "[Tên người gọi] đang gọi cho bạn"
  - Icon: Avatar của người gọi
  - requireInteraction: true (không tự đóng)
- Click notification → Focus tab

#### c) Title Flash
```typescript
document.title = "📞 [Tên] đang gọi..."
```
- Flash title mỗi 1 giây
- Dễ nhận biết khi có nhiều tab
- Tự động restore title khi kết thúc

### 3. Permission Request
**File:** `frontend/components/pages/HomeClient.tsx`

- Request notification permission khi user đăng nhập
- Chỉ request 1 lần (nếu chưa có permission)
- Không làm phiền user nếu đã từ chối

---

## 🎯 User Experience Flow

### Scenario 1: User đang ở tab chat
1. Cuộc gọi đến
2. ✅ Ringtone reo
3. ✅ Modal hiện lên ngay
4. ✅ Title flash
5. User accept/reject → Ringtone dừng

### Scenario 2: User đang ở tab khác
1. Cuộc gọi đến
2. ✅ Ringtone reo
3. ✅ Tab tự động focus (đưa lên foreground)
4. ✅ Modal hiện lên
5. ✅ Title flash
6. User accept/reject → Ringtone dừng

### Scenario 3: User đang ở app khác
1. Cuộc gọi đến
2. ✅ Ringtone reo (nếu tab vẫn mở)
3. ✅ Browser notification hiện lên
4. ✅ Title flash
5. User click notification → Tab focus
6. User accept/reject → Ringtone dừng

---

## 🔧 Technical Details

### Ringtone Implementation
```typescript
class RingtonePlayer {
  - AudioContext: Web Audio API
  - OscillatorNode: Tạo âm thanh sine wave
  - GainNode: Điều chỉnh volume
  - Pattern: setInterval với beep-beep-pause
  - Frequency: 800 Hz (cao, dễ nghe)
  - Duration: 200ms mỗi beep
}
```

### Notification API
```typescript
Notification.requestPermission()
new Notification(title, {
  body: string,
  icon: string,
  tag: "incoming-call",
  requireInteraction: true,
})
```

### Window Focus
```typescript
window.focus()  // Bring tab to front
document.hidden // Check if tab is visible
```

---

## 📱 Browser Compatibility

### Ringtone (Web Audio API)
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ⚠️ Mobile: May require user interaction first

### Notification API
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Supported (macOS only)
- ❌ iOS Safari: Not supported

### Window Focus
- ✅ All modern browsers
- ⚠️ May be blocked by browser settings

---

## 🎨 Customization Options

### Ringtone
Có thể customize trong `frontend/lib/ringtone.ts`:
- `frequency`: Thay đổi cao độ (Hz)
- `gain.value`: Thay đổi volume (0-1)
- `interval`: Thay đổi tốc độ reo (ms)
- `oscillator.type`: Thay đổi loại âm thanh (sine, square, triangle)

### Notification
Có thể customize trong `IncomingCallModal.tsx`:
- `body`: Nội dung thông báo
- `icon`: Icon hiển thị
- `requireInteraction`: Tự động đóng hay không
- `badge`: Badge icon (mobile)

---

## 🧪 Testing

### Test Ringtone:
1. UserA gọi UserB
2. Kiểm tra âm thanh reo
3. Accept → Âm thanh dừng
4. Reject → Âm thanh dừng

### Test Tab Focus:
1. Mở tab khác
2. UserA gọi UserB
3. Tab chat tự động focus
4. Modal hiện lên

### Test Notification:
1. Minimize browser hoặc chuyển app khác
2. UserA gọi UserB
3. Notification hiện lên
4. Click notification → Tab focus

### Test Title Flash:
1. UserA gọi UserB
2. Kiểm tra title flash
3. Accept/Reject → Title restore

---

## 🔐 Privacy & Permissions

### Notification Permission
- Chỉ request khi cần thiết
- User có thể từ chối
- App vẫn hoạt động bình thường nếu bị từ chối
- Có thể reset trong browser settings

### Audio Permission
- Web Audio API không cần permission
- Tự động hoạt động
- Không access microphone

---

## 📝 Files Changed

1. **frontend/lib/ringtone.ts** (NEW)
   - Ringtone player implementation

2. **frontend/components/call/IncomingCallModal.tsx**
   - Added ringtone playback
   - Added window focus
   - Added browser notification
   - Added title flash

3. **frontend/components/pages/HomeClient.tsx**
   - Added notification permission request

---

**Status:** ✅ Complete
**Date:** November 24, 2025
**Priority:** 🔴 High (Incoming calls now have maximum visibility)
