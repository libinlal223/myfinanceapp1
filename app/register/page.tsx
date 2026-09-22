import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-xl">₹</span>
            </div>
            <span className="text-xl font-bold tracking-tight">MoneyTracker</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Track your money. Simply.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 border border-border/50">
          <h1 className="text-lg font-semibold mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-6">Start tracking your finances today</p>
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
