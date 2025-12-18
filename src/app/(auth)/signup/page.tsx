import { SignupForm } from "@/components/auth/SignupForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <SignupForm />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--glass-border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-3 py-1 rounded-full bg-[var(--color-card-dark-1)] text-[var(--color-text-muted)]">
            Ou continue com
          </span>
        </div>
      </div>
      <GoogleButton />
    </div>
  );
}
