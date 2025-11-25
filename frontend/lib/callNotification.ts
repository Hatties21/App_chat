// Call notification with actions (if Service Worker is available)
// Note: Notification actions require Service Worker, which is complex to setup
// For now, we use simple notification with click handler

export function showIncomingCallNotification(
  callerName: string,
  callerAvatar?: string,
  onAccept?: () => void,
  onReject?: () => void
): Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  if (Notification.permission !== "granted") {
    return null;
  }

  const notification = new Notification("📞 Cuộc gọi đến", {
    body: `${callerName} đang gọi cho bạn\n\nClick để trả lời`,
    icon: callerAvatar || "/next.svg",
    tag: "incoming-call",
    requireInteraction: true,
    silent: false, // Play system sound
    // Note: actions require Service Worker
    // actions: [
    //   { action: "accept", title: "Chấp nhận" },
    //   { action: "reject", title: "Từ chối" },
    // ],
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    // User will see the modal and can accept/reject there
  };

  return notification;
}

export function closeIncomingCallNotification() {
  // Close notification by tag
  // Note: This doesn't work in all browsers
  // Notifications are auto-closed when status changes in IncomingCallModal
}
