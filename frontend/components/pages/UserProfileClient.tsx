"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MessageSquare, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { friendService } from "@/services/friendService";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  createdAt: string;
}

interface UserProfileClientProps {
  userId: string;
}

export default function UserProfileClient({ userId }: UserProfileClientProps) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { friends, removeFriend: removeFriendFromStore } = useFriendStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const isFriend = friends.some(f => f._id === userId);
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    console.log("UserProfileClient mounted, userId:", userId);
    // Force iframe reload on mount
    setIframeKey(Date.now());
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log("Loading profile for userId:", userId);
      
      if (!userId || userId === 'undefined') {
        throw new Error("Invalid userId");
      }
      
      const { data } = await api.get(`/api/users/${userId}`);
      console.log("Profile loaded:", data);
      setProfile(data.user);
    } catch (error: any) {
      console.error("Error loading profile:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      const errorMsg = error.response?.data?.message || error.message || "Không thể tải thông tin người dùng";
      toast.error(errorMsg);
      
      // Don't redirect immediately, let user see the error
      setTimeout(() => router.push("/"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!confirm("Bạn có chắc muốn hủy kết bạn?")) return;

    try {
      setActionLoading(true);
      await friendService.removeFriend(userId);
      removeFriendFromStore(userId);
      toast.success("Đã hủy kết bạn");
      router.push("/"); // Redirect to home instead of /friends
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Không thể hủy kết bạn");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    router.push(`/?userId=${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Không tìm thấy người dùng</p>
      </div>
    );
  }

  // Redirect to own profile if viewing self
  if (isOwnProfile) {
    router.push("/profile");
    return null;
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
                onClick={() => router.back()}
              >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Thông tin người dùng</h1>
          </div>
        </div>
      </div>

        {/* Content */}
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card className="backdrop-blur-xl bg-card/95 shadow-2xl">
          <CardHeader>
            <CardTitle>Hồ sơ</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar & Name Section */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="text-3xl">
                    {profile.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{profile.displayName}</h2>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  {isFriend && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      Bạn bè
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isFriend && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartChat}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Nhắn tin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFriend}
                    disabled={actionLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    {actionLoading ? "Đang xử lý..." : "Hủy kết bạn"}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Info Section */}
            <div className="space-y-4">
              {/* Bio */}
              {profile.bio && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Giới thiệu</h3>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Email (only show to friends) */}
              {isFriend && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Email</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              )}

              {/* Phone (only show to friends) */}
              {isFriend && profile.phone && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Số điện thoại</h3>
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Account Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Thông tin tài khoản</h3>
              <div className="text-sm text-muted-foreground">
                <p>
                  Tham gia:{" "}
                  {new Date(profile.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
