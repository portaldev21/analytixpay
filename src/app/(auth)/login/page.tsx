import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <LoginForm />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--color-border-light)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-3 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            Ou continue com
          </span>
        </div>
      </div>
      <GoogleButton />
    </div>
  );
}
