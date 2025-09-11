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

export default function LoginPage() {
  const [email, setEmail] = useState("GYGJ240328@example.com"); // Using a valid email format
  const [password, setPassword] = useState("GYGJ240328hdy");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(app);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);
      // Create user if they don't exist
      if (error.code === 'auth/user-not-found') {
        try {
          const { createUserWithEmailAndPassword } = await import("firebase/auth");
          await createUserWithEmailAndPassword(auth, email, password);
          toast({
            title: "Account Created",
            description: "Logging you in...",
          });
          router.push("/dashboard");
        } catch (creationError: any) {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: creationError.message || "Could not create account.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "An unexpected error occurred.",
        });
      }
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
        <h1 className="text-2xl font-bold text-foreground font-headline">TaskMaster Pro</h1>
      </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="GYGJ240328"
                value={email.split('@')[0]}
                onChange={(e) => setEmail(`${e.target.value}@example.com`)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Built for production excellence.
      </p>
    </main>
  );
}
