import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

export default function Auth() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
    nav("/");
  };

  const signUp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) return toast({ title: "Sign-up failed", description: error.message, variant: "destructive" });
    toast({ title: "Check your email to confirm your account." });
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm border border-border rounded-lg bg-card p-6 shadow-industrial">
        <div className="flex items-center gap-2 mb-5">
          <LogIn className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-display font-bold">Technician access</h1>
        </div>
        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-3 pt-4">
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Password" value={password} onChange={setPassword} type="password" />
            <Button onClick={signIn} disabled={busy || !email || !password} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Sign in
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 pt-4">
            <Field label="Full name" value={fullName} onChange={setFullName} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Password" value={password} onChange={setPassword} type="password" />
            <Button onClick={signUp} disabled={busy || !email || !password} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Create account
            </Button>
          </TabsContent>
        </Tabs>
        <div className="my-5 flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <Button variant="outline" onClick={google} className="w-full">
          Continue with Google
        </Button>
        <p className="mt-5 text-[11px] text-muted-foreground text-center">
          Browsing equipment is public. Sign in only to log tests or upload photos.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} />
    </div>
  );
}
