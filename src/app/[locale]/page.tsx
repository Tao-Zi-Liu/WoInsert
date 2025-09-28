"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/icons";
import { Loader2 } from "lucide-react";
import { useParams } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState("GYGJ240328");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'zh'; // Default to Chinese
  const auth = getAuth(app);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push(`/${locale}/dashboard`);
      } else {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth, router, locale]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate credentials directly (since Firebase requires email)
      // We'll use a fixed email format for Firebase Auth
      if (username === "GYGJ240328" && password === "GYGJ240328hdy") {
        // Use a fixed email for Firebase authentication
        const fixedEmail = "gygj240328@system.local";
        const fixedPassword = "GYGJ240328hdy";
        
        await signInWithEmailAndPassword(auth, fixedEmail, fixedPassword);
        
        toast({
          title: "登录成功",
          description: "正在跳转到仪表板...",
        });
        router.push(`/${locale}/dashboard`);
      } else {
        throw new Error("用户名或密码错误");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "登录失败",
        description: error.message || "用户名或密码错误",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 mb-4">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground font-headline">生产任务管理系统</h1>
      </div>
      
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">登录</CardTitle>
          <CardDescription>输入您的账户信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              登录
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="mt-4 text-center text-sm text-muted-foreground">
        专为生产卓越而设计
      </p>
    </main>
  );
}