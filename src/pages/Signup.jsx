import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import axios from "axios";
import { registerUser } from "../services/api.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateValues = (values) => {
  const errors = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  if (!values.name.trim()) {
    errors.name = "Name is required";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
};

const isEmptyErrors = (errors) => Object.values(errors).every((message) => !message);

const extractErrorMessage = (error) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 400) {
      return "User already exists";
    }

    if (!error.response) {
      return "Server not reachable";
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

    return "Signup failed. Please try again.";
  }

  return "Signup failed. Please try again.";
};

function Signup() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const nextValidation = useMemo(() => validateValues(values), [values]);
  const isFormValid = isEmptyErrors(nextValidation);

  const updateField = (field, value) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setErrors(validateValues(nextValues));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validation = validateValues(values);
    setErrors(validation);

    if (!isEmptyErrors(validation)) {
      return;
    }

    const formData = {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    };

    try {
      setLoading(true);

      console.log("Signup request:", formData);
      const response = await registerUser(formData);
      console.log("Signup response:", response.data);

      setSuccessMessage("Account created successfully");

      window.setTimeout(() => {
        navigate("/login");
      }, 900);
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
              <UserPlus className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
            <p className="mt-2 text-sm text-slate-600">Sign up to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Your full name"
                disabled={loading}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                  errors.name
                    ? "border-rose-400 bg-rose-50/80 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                }`}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <p className="mt-1.5 text-xs text-rose-600">{errors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                  errors.email
                    ? "border-rose-400 bg-rose-50/80 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                }`}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="mt-1.5 text-xs text-rose-600">{errors.email}</p> : null}
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
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="At least 6 characters"
                  disabled={loading}
                  className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition ${
                    errors.password
                      ? "border-rose-400 bg-rose-50/80 focus:ring-2 focus:ring-rose-200"
                      : "border-slate-300 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  }`}
                  aria-invalid={Boolean(errors.password)}
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
              {errors.password ? <p className="mt-1.5 text-xs text-rose-600">{errors.password}</p> : null}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  placeholder="Repeat your password"
                  disabled={loading}
                  className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition ${
                    errors.confirmPassword
                      ? "border-rose-400 bg-rose-50/80 focus:ring-2 focus:ring-rose-200"
                      : "border-slate-300 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  }`}
                  aria-invalid={Boolean(errors.confirmPassword)}
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
              {errors.confirmPassword ? (
                <p className="mt-1.5 text-xs text-rose-600">{errors.confirmPassword}</p>
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
              disabled={loading || !isFormValid}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition duration-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-sky-700 transition hover:text-sky-800">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
