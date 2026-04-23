"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import styles from "./AuthForm.module.css";

const stripTags = (s) => String(s ?? "").replace(/<\/?[^>]+>/g, "");

const AuthForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
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
        const result = await signIn("credentials", {
          redirect: true,
          callbackUrl,
          email,
          password,
        });

        if (result?.error) {
          setErrors(result.error);
        }
      } else {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const responseData = await res.json();

        if (responseData.error) {
          setErrors(responseData.error);
        } else {
          const result = await signIn("credentials", {
            redirect: true,
            callbackUrl,
            email,
            password,
          });

          if (result?.error) {
            setErrors(result.error);
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
