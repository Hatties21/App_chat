"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/useAuthStore";

const schema = z.object({
  username: z.string().min(1, "Nhập email hoặc username"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
});
type FormValues = z.infer<typeof schema>;

export default function SignInForm() {
  const signIn = useAuthStore((s) => s.signIn);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await signIn(values);
      toast.success("Đăng nhập thành công!");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại."
      );
    }
  };

  return (
    <>
      <Card className="w-full max-w-md backdrop-blur-xl bg-white/5 dark:bg-black/15 border-white/20 shadow-2xl shadow-black/20 text-white animate-in fade-in-0 slide-in-from-left-5 duration-500">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">
            Đăng nhập
          </CardTitle>
        </CardHeader>
        <CardContent className="text-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                name="username"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email hoặc Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com hoặc yourname"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full shadow-md hover:shadow-lg transition-shadow"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-white/60">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              {/* OAuth Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/google`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Tiếp tục với Google
              </Button>

              <p className="text-sm text-white/70 text-center">
                Chưa có tài khoản?{" "}
                <Link href="/signup" className="text-white underline hover:text-white/90">
                  Đăng ký
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
