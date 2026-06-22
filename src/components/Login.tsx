"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/auth/client";
import { srmistEmail } from "@/lib/validation/onboarding";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const Login = () => {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = srmistEmail.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }

    setLoading(true);
    const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message ?? "Could not send the login code.");
      return;
    }
    setStep("otp");
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await authClient.signIn.emailOtp({
      email,
      otp,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message ?? "Invalid or expired code.");
      return;
    }
    // The dashboard layout routes by profile state (onboarding / pending / ok).
    router.push("/dashboard");
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center font-serif text-3xl text-primary">
          Log In
        </CardTitle>
        <CardDescription className="text-center font-sans">
          {step === "email"
            ? "We'll email you a one-time code."
            : `Enter the code sent to ${email}.`}
        </CardDescription>
      </CardHeader>

      {step === "email" ? (
        <form onSubmit={sendCode}>
          <CardContent className="my-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@srmist.edu.in"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="font-sans"
              />
            </div>
            {error ? (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send code"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Need an account?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Request access
              </Link>
            </p>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <CardContent className="my-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">One-time code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="font-sans"
              />
            </div>
            {error ? (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying…" : "Log in"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
              }}
            >
              Use a different email
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
};

export default Login;
