"use client";

import SignInForm from "@/components/auth/SignInForm";
import { MessageSquare, Users, Zap, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export default function Page() {
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    // Force iframe reload on mount
    setIframeKey(Date.now());
  }, []);

  return (
    <main className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Stars Background - Full Screen */}
      <div className="absolute inset-0 z-0">
        <iframe
          key={iframeKey}
          src="https://hatties21.github.io/Stars/"
          className="w-full h-full border-0 pointer-events-none"
          title="Stars Background"
          sandbox="allow-scripts"
          loading="eager"
        />
        {/* Subtle overlay for dreamy effect */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      </div>

      {/* Left Side - Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <SignInForm />
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-primary-foreground p-12 w-full">
          <div className="space-y-8 max-w-md">
            {/* Logo */}
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm shadow-2xl">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-5xl font-bold mb-2">Chad</h1>
                <p className="text-xl text-primary-foreground/80">
                  Kết nối mọi lúc, mọi nơi
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-6 pt-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Nhanh chóng</h3>
                  <p className="text-primary-foreground/70">
                    Tin nhắn real-time, không delay
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Bảo mật</h3>
                  <p className="text-primary-foreground/70">
                    Dữ liệu được mã hóa an toàn
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Kết nối</h3>
                  <p className="text-primary-foreground/70">
                    Chat 1-1 và nhóm dễ dàng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
