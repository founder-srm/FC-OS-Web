"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { signupSchema } from "@/lib/validation/onboarding";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse({ email, password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid details.");
      return;
    }

    setLoading(true);
    // Neon Auth requires a name for email sign-up; the real name is collected
    // at onboarding, so seed it from the email local-part for now.
    const provisionalName = email.split("@")[0];
    const { error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name: provisionalName,
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message ?? "Could not create your account.");
      return;
    }

    const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message ?? "Could not send the verification code.");
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center font-serif text-3xl text-primary">
            Request Access
          </CardTitle>
          <CardDescription className="text-center font-sans">
            Sign up with your <strong>@srmist.edu.in</strong> email.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="my-4 flex flex-col gap-6 font-sans">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@srmist.edu.in"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Sign up"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
