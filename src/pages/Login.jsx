import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import axios from "axios";
import { loginUser } from "../services/api.js";

const extractErrorMessage = (error) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Invalid email or password";
    }

    if (!error.response) {
      return "Unable to reach server. Check your connection and try again.";
    }

    const data = error.response.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
      }

      if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item.msg === "string") return item.msg;
            return "";
          })
          .filter(Boolean)
          .join(", ");
      }

      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
    }

    return "Login failed. Please try again.";
  }

  return "Something went wrong. Please try again.";
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  const isSubmitDisabled = useMemo(() => loading, [loading]);

  const validateForm = () => {
    const nextErrors = { email: "", password: "" };

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required";
    }

    setFieldErrors(nextErrors);

    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      console.log("Sending request:", email.trim(), password);

      const response = await loginUser({
        email: email.trim(),
        password,
      });

      console.log("Response:", response.data);

      const accessToken = response?.data?.access_token;

      if (!accessToken) {
        throw new Error("Token missing in login response");
      }

      localStorage.setItem("token", accessToken);
      console.log("Login successful. Token stored.");
      setSuccessMessage("Login successful. Redirecting to resume flow...");

      window.setTimeout(() => {
        window.location.assign("/resume");
      }, 700);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_600px_at_20%_-10%,rgba(14,165,233,0.22),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(56,189,248,0.16),transparent_55%),linear-gradient(180deg,#0b1220_0%,#111827_100%)] px-4 py-10 sm:py-16">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/10 bg-white/95 p-8 shadow-2xl shadow-black/25 backdrop-blur transition-all duration-300 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-600">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                  fieldErrors.email
                    ? "border-rose-400 bg-rose-50/80 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                }`}
                placeholder="you@example.com"
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
              />
              {fieldErrors.email ? (
                <p id="email-error" className="mt-1.5 text-xs text-rose-600">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                  className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition ${
                    fieldErrors.password
                      ? "border-rose-400 bg-rose-50/80 focus:ring-2 focus:ring-rose-200"
                      : "border-slate-300 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  }`}
                  placeholder="Enter your password"
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-slate-500 transition hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {fieldErrors.password ? (
                <p id="password-error" className="mt-1.5 text-xs text-rose-600">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition-all duration-200">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 transition-all duration-200">
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition duration-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-sky-700 transition hover:text-sky-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
