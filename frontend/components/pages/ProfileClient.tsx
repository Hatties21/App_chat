"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function ProfileClient() {
  const router = useRouter();
  const { user, fetchMe } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    // Force iframe reload on mount
    setIframeKey(Date.now());
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.patch("/api/users/me", formData);
      await fetchMe();
      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Stars Background - Dark Mode Only */}
      <div className="absolute inset-0 z-0 dark:block hidden">
        <iframe
          key={iframeKey}
          src="https://hatties21.github.io/Stars/"
          className="w-full h-full border-0 pointer-events-none"
          title="Stars Background"
          sandbox="allow-scripts"
          loading="eager"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      </div>

      {/* Light Mode Background - Gradient */}
      <div className="absolute inset-0 z-0 dark:hidden block bg-gradient-to-br from-primary/5 via-background to-primary/10" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b backdrop-blur-xl bg-background/50">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
              >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Thông tin cá nhân</h1>
          </div>
        </div>
      </div>

        {/* Content */}
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card className="backdrop-blur-xl bg-card/95 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hồ sơ của bạn</CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-3xl">
                  {user.displayName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{user.displayName}</h2>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>

            <Separator />

            {/* Info Section */}
            <div className="space-y-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Tên hiển thị</Label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    placeholder="Nhập tên hiển thị"
                  />
                ) : (
                  <p className="text-sm py-2">{user.displayName}</p>
                )}
              </div>

              {/* Username (Read-only) */}
              <div className="space-y-2">
                <Label>Username</Label>
                <p className="text-sm py-2 text-muted-foreground">
                  @{user.username}
                </p>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm py-2 text-muted-foreground">
                  {user.email}
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Giới thiệu</Label>
                {isEditing ? (
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Viết vài dòng về bạn..."
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    maxLength={500}
                  />
                ) : (
                  <p className="text-sm py-2 whitespace-pre-wrap">
                    {user.bio || (
                      <span className="text-muted-foreground italic">
                        Chưa có giới thiệu
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Nhập số điện thoại"
                    type="tel"
                  />
                ) : (
                  <p className="text-sm py-2">
                    {user.phone || (
                      <span className="text-muted-foreground italic">
                        Chưa có số điện thoại
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Appearance Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Giao diện</h3>
              <ThemeToggle />
            </div>

            <Separator />

            {/* Account Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Thông tin tài khoản</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Tham gia:{" "}
                  {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p>ID: {user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
