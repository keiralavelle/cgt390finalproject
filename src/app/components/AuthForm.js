"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./AuthForm.module.css";

const stripTags = (s) => String(s ?? "").replace(/<\/?[^>]+>/g, "");

function friendlyAuthError(code) {
  if (!code) return "";
  switch (code) {
    case "CredentialsSignin":
    case "CallbackRouteError":
      return "Email or password is incorrect. If you don't have an account yet, register below.";
    case "Configuration":
      return "Sign-in is temporarily unavailable. Please try again shortly.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

const AuthForm = () => {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const callbackUrl  = searchParams.get("callbackUrl") || "/";
  const [isLogin, setIsLogin] = useState(true);
  const [data, setData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (callbackUrl !== "/") {
      setStatusMessage("Please sign in to continue");
    }
  }, [callbackUrl]);

  // If NextAuth ever does redirect back here with ?error=… (e.g. when an
  // OAuth provider fails), surface that message instead of leaving the user
  // wondering why nothing happened. Strip the param from the URL after
  // reading so a refresh doesn't re-show the error.
  useEffect(() => {
    const errParam = searchParams.get("error");
    if (errParam) {
      setErrors(friendlyAuthError(errParam));
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      router.replace(url.pathname + url.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = () => {
    setIsLogin((prev) => !prev);
    setErrors("");
    setData({ email: "", password: "" });
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors("");
    setIsSubmitting(true);

    const email = stripTags(data.email);
    const password = stripTags(data.password);

    try {
      if (isLogin) {
        // redirect: false → the promise resolves with { ok, error, status, url }
        // on the same page, so we can show an inline error message instead of
        // bouncing the user back to /auth/signin?error=CredentialsSignin and
        // losing the form state.
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (!result || result.error) {
          setErrors(friendlyAuthError(result?.error || "CredentialsSignin"));
        } else if (result.ok) {
          // Sign-in succeeded — go to wherever the user was originally headed.
          router.push(callbackUrl);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const responseData = await res.json();

        if (!res.ok || responseData.error) {
          setErrors(responseData.error || "Could not create your account. Please try again.");
        } else {
          const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
          });

          if (!result || result.error) {
            // Account was created but auto-sign-in failed — unusual but possible
            setErrors("Account created, but sign-in failed. Try signing in manually.");
            setIsLogin(true);
          } else if (result.ok) {
            router.push(callbackUrl);
            router.refresh();
          }
        }
      }
    } catch (error) {
      setErrors("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authWrap}>
      <div className={styles.authCard}>
        <h1>{isLogin ? "Sign In" : "Register"}</h1>

        {statusMessage && (
          <p className={styles.statusMessage}>{statusMessage}</p>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={data.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={data.password}
              onChange={handleChange}
              required
            />
          </div>

          {errors && <p className={styles.error}>{errors}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !data.email || !data.password}
          >
            {isSubmitting
              ? isLogin
                ? "Signing in..."
                : "Registering..."
              : isLogin
              ? "Sign In"
              : "Register"}
          </button>
        </form>

        <div className={styles.toggle}>
          <p>
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>
          <button type="button" onClick={handleToggle}>
            {isLogin ? "Register" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;