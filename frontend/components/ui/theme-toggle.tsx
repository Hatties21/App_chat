"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "@/lib/api";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync theme from user preferences on mount
  useEffect(() => {
    if (mounted && user?.theme && theme !== user.theme) {
      setTheme(user.theme);
    }
  }, [mounted, user?.theme]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5" />
          <Label>Dark Mode</Label>
        </div>
        <Switch disabled />
      </div>
    );
  }

  const isDark = theme === "dark";

  const handleThemeChange = async (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    
    // Save to backend
    if (user) {
      try {
        await api.patch("/api/users/me", { theme: newTheme });
      } catch (error) {
        console.error("Failed to save theme preference:", error);
      }
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="w-5 h-5 text-primary" />
        ) : (
          <Sun className="w-5 h-5 text-primary" />
        )}
        <div>
          <Label className="cursor-pointer">Dark Mode</Label>
          <p className="text-xs text-muted-foreground">
            {isDark ? "Chế độ tối" : "Chế độ sáng"}
          </p>
        </div>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={handleThemeChange}
      />
    </div>
  );
}
