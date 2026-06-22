"use client";

import { useRouter, useSearchParams } from "next/navigation";
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

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Missing email. Please sign up again.");
      return;
    }
    setLoading(true);
    const { error: verifyError } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message ?? "Invalid or expired code.");
      return;
    }
    router.push("/onboarding");
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Missing email. Please sign up again.");
      return;
    }
    const { error: resendError } =
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
    if (resendError) {
      setError(resendError.message ?? "Could not resend the code.");
      return;
    }
    setInfo("A new code has been sent to your email.");
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center font-serif text-3xl text-primary">
          Verify your email
        </CardTitle>
        <CardDescription className="text-center font-sans">
          Enter the code we sent to {email || "your email"}.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleVerify}>
        <CardContent className="my-4 flex flex-col gap-6 font-sans">
          <div className="grid gap-2">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="text-sm text-muted-foreground">{info}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleResend}
          >
            Resend code
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
