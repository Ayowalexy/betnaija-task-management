import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { loginSchema } from "../schemas";
import type { LoginFormValues } from "../types";
import logo from "@/assets/logo.png";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const navigate = useNavigate();
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoginError(null);
    try {
      await loginWithCredentials(values.email, values.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;

      if (msg === "ACCOUNT_SETUP_REQUIRED") {
        // Silently send OTP so the user can set a permanent password
        await authApi.forgotPassword(values.email).catch(() => {});
        sessionStorage.setItem("flowdesk:setup_email", values.email);
        navigate("/reset-password?setup=1");
        return;
      }

      setLoginError(msg ?? "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src={logo} alt="Bet9ja" style={{ height: 48, objectFit: 'contain' }} />
        </div>

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>Sign in to your workspace</p>

        <form
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {loginError && <div className={styles.errorBanner}>{loginError}</div>}

          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: "var(--font-size-sm)",
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: `1px solid ${errors.email ? "var(--color-error)" : "var(--color-border-default)"}`,
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-sm)",
                background: "var(--color-bg-elevated)",
                color: "var(--color-text-primary)",
                outline: "none",
                boxSizing: "border-box",
              }}
              {...register("email")}
            />
            {errors.email && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-error)",
                }}
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: "var(--font-size-sm)",
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 14px",
                  border: `1px solid ${errors.password ? "var(--color-error)" : "var(--color-border-default)"}`,
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--font-size-sm)",
                  background: "var(--color-bg-elevated)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-tertiary)",
                  padding: 0,
                  display: "flex",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-error)",
                }}
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
            style={{
              padding: "10px 16px",
              background: isSubmitting
                ? "var(--color-primary-hover)"
                : "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "var(--transition-base)",
              opacity: isSubmitting ? 0.8 : 1,
            }}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
