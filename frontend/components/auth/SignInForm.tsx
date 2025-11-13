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
      <Card className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Sign in
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Đang vào..." : "Sign in"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Chưa có tài khoản?{" "}
                <Link href="/signup" className="underline">
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
