import { Suspense } from "react";

import VerifyEmailForm from "./verify-email-form";

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
