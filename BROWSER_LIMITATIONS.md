# Browser Limitations - Call Feature

## ⚠️ Vấn đề: Browser không tự động mở lên khi có cuộc gọi

### Nguyên nhân:
Browsers (Chrome, Firefox, Safari, Edge) **không cho phép** website tự động mở/focus window từ background vì lý do bảo mật và UX.

**Lý do:**
- Ngăn chặn popup spam
- Ngăn chặn website làm phiền user
- Bảo vệ privacy

### Giải pháp hiện tại:

#### 1. ✅ Browser Notification (Khuyến nghị)
**Cách hoạt động:**
- Khi có cuộc gọi → Hiện notification
- User click notification → Browser tự động focus window
- Notification có âm thanh hệ thống

**Ưu điểm:**
- Hoạt động ngay cả khi browser minimized
- Có âm thanh hệ thống
- User có thể thấy ngay

**Nhược điểm:**
- Cần user cho phép notification permission
- Không tự động mở browser (phải click)

#### 2. ✅ Ringtone + Title Flash
**Cách hoạt động:**
- Ringtone reo liên tục
- Title flash "📞 [Tên] đang gọi..."
- Nếu browser đang mở (nhưng ở tab khác) → Dễ nhận biết

**Ưu điểm:**
- Không cần permission
- Hoạt động tốt nếu browser đang mở

**Nhược điểm:**
- Không hoạt động nếu browser minimized/closed

#### 3. ✅ Vibration (Mobile)
**Cách hoạt động:**
- Rung điện thoại khi có cuộc gọi
- Pattern: 200ms-100ms-200ms

**Ưu điểm:**
- Hiệu quả trên mobile
- Không cần permission

**Nhược điểm:**
- Chỉ hoạt động trên mobile
- Không hoạt động trên desktop

---

## 🔍 So sánh với các app khác

### Zoom, Google Meet, Discord:
**Họ làm gì?**
- Dùng **Desktop App** (Electron) → Có thể focus window
- Dùng **Browser Extension** → Có thêm permissions
- Dùng **Service Worker** → Push notifications

**Tại sao họ làm được?**
- Desktop app có quyền OS-level
- Extension có quyền cao hơn website thường
- Service Worker có thể chạy background

### Web App thuần (như app của chúng ta):
**Giới hạn:**
- Không thể tự động focus window từ background
- Không thể chạy background khi browser closed
- Phụ thuộc vào browser permissions

---

## 💡 Giải pháp nâng cao (Tương lai)

### Option 1: Progressive Web App (PWA)
**Cài đặt:**
- Thêm Service Worker
- Thêm manifest.json
- User "install" app

**Lợi ích:**
- Push notifications ngay cả khi browser closed
- Icon trên desktop/home screen
- Gần giống native app hơn

**Nhược điểm:**
- Phức tạp để setup
- Cần backend hỗ trợ push notifications
- iOS Safari hỗ trợ hạn chế

### Option 2: Browser Extension
**Cài đặt:**
- Tạo Chrome/Firefox extension
- User cài extension

**Lợi ích:**
- Có thể focus window
- Có thể chạy background
- Nhiều permissions hơn

**Nhược điểm:**
- User phải cài extension
- Phải maintain 2 codebases
- Review process phức tạp

### Option 3: Desktop App (Electron)
**Cài đặt:**
- Wrap web app trong Electron
- Distribute như desktop app

**Lợi ích:**
- Full control
- Có thể focus window
- Native notifications

**Nhược điểm:**
- File size lớn
- Phải maintain desktop app
- Distribution phức tạp

---

## 📱 Khuyến nghị cho User

### Để nhận cuộc gọi tốt nhất:

#### Desktop:
1. ✅ **Cho phép notifications** (quan trọng nhất)
2. ✅ Giữ browser tab mở
3. ✅ Bật âm thanh
4. ⚠️ Không minimize browser (nếu có thể)

#### Mobile:
1. ✅ **Cho phép notifications**
2. ✅ Bật âm thanh
3. ✅ Cho phép vibration
4. ✅ "Add to Home Screen" (PWA)

### Nếu miss call:
- Sẽ có notification history (nếu implement)
- Có thể gọi lại
- Có thể nhắn tin

---

## 🎯 Current Implementation Status

### ✅ Đã implement:
- Browser notification với click handler
- Ringtone (Web Audio API)
- Title flash
- Vibration (mobile)
- Auto-request notification permission

### ⏳ Chưa implement:
- Service Worker / PWA
- Push notifications khi browser closed
- Notification actions (accept/reject buttons)
- Desktop app
- Browser extension

### 🚫 Không thể implement (browser limitation):
- Tự động mở browser từ background
- Tự động focus window khi minimized
- Chạy khi browser closed (cần PWA)

---

## 📊 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Notification API | ✅ | ✅ | ✅ (macOS) | ✅ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| Vibration API | ✅ | ✅ | ❌ | ✅ |
| window.focus() | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited |
| Service Worker | ✅ | ✅ | ✅ | ✅ |

⚠️ Limited = Chỉ hoạt động trong cùng browser window, không thể focus từ background

---

## 🔧 Workarounds cho User

### Nếu thường xuyên miss calls:

1. **Pin tab** - Right click tab → Pin
   - Tab sẽ nhỏ hơn, khó đóng nhầm
   - Luôn ở đầu tab bar

2. **Separate window** - Mở app trong window riêng
   - Dễ switch qua lại
   - Có thể để ở màn hình phụ

3. **Sound alerts** - Bật âm thanh loa
   - Nghe được ringtone
   - Không bỏ lỡ cuộc gọi

4. **Check regularly** - Thường xuyên check tab
   - Xem title có flash không
   - Xem có notification không

---

**Kết luận:**
Đây là **limitation của web platform**, không phải bug. Tất cả web apps đều gặp vấn đề này. Để có trải nghiệm tốt nhất, user nên:
1. Cho phép notifications
2. Giữ browser tab mở
3. Bật âm thanh

Nếu cần trải nghiệm như native app, cần implement PWA hoặc desktop app.

---

**Date:** November 24, 2025
