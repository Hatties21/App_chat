# Logging Configuration

## Cấu hình hiện tại

### Console (Terminal)
- **Development**: Chỉ hiển thị `warn` và `error`
- **Production**: Không hiển thị console logs

### File Logs
- **logs/error.log**: Chỉ errors
- **logs/combined.log**: Tất cả logs (info, warn, error)

## Log Levels

1. **error**: Lỗi nghiêm trọng cần xử lý ngay
2. **warn**: Cảnh báo, cần chú ý
3. **info**: Thông tin hoạt động bình thường (chỉ ghi vào file)
4. **debug**: Chi tiết debug (nếu cần)

## Xem logs

### Xem real-time
```bash
# Xem tất cả logs
tail -f logs/combined.log

# Chỉ xem errors
tail -f logs/error.log
```

### Xem logs cũ
```bash
# Xem 50 dòng cuối
tail -n 50 logs/combined.log

# Tìm kiếm
grep "Message sent" logs/combined.log
grep "error" logs/combined.log
```

## Dọn dẹp logs

### Xóa logs thủ công
```bash
# Windows
del backend\logs\*.log

# Linux/Mac
rm backend/logs/*.log
```

## Thay đổi log level

### Tạm thời (cho session hiện tại)
```bash
# Hiển thị tất cả logs trên console
LOG_LEVEL=info npm run dev

# Chỉ errors
LOG_LEVEL=error npm run dev
```

### Vĩnh viễn
Thêm vào file `.env`:
```
LOG_LEVEL=warn
```

## Log rotation (Optional)

Nếu logs quá lớn, có thể dùng `winston-daily-rotate-file`:

```bash
npm install winston-daily-rotate-file
```

Sau đó update logger.js để tự động rotate logs theo ngày.

## Các logs quan trọng

- **Message sent**: Tin nhắn đã được lưu
- **User login**: User đăng nhập
- **Session cleanup**: Dọn dẹp sessions cũ
- **Socket connected/disconnected**: WebSocket events
- **API errors**: Lỗi từ API requests

## Tips

- Logs được ghi vào file ngay cả khi không hiện trên console
- File logs giúp debug sau khi vấn đề xảy ra
- Trong production, nên dùng log management service (như Datadog, LogRocket)
