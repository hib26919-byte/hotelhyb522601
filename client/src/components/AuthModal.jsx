import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";

const initialSignup = { name: "", email: "", phone: "", password: "" };
const initialSignin = { email: "", password: "" };

const AuthModal = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("signin");
  const [signinValues, setSigninValues] = useState(initialSignin);
  const [signupValues, setSignupValues] = useState(initialSignup);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle, sendResetLink, isAdmin } = useAuth();

  useEffect(() => {
    const handleOpen = (event) => {
      setMode(event.detail?.mode || "signin");
      setOpen(true);
    };

    window.addEventListener("open-auth-modal", handleOpen);
    return () => window.removeEventListener("open-auth-modal", handleOpen);
  }, []);

  const closeModal = () => setOpen(false);

  const handleSignin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(signinValues.email, signinValues.password);
      toast.success("Welcome back to Bael Tree Hotels.");
      closeModal();
      if (isAdmin) {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      toast.error(error.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signup(signupValues);
      toast.success("Your account has been created.");
      closeModal();
      setSignupValues(initialSignup);
    } catch (error) {
      toast.error(error.message || "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google.");
      closeModal();
    } catch (error) {
      toast.error(error.message || "Google sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!signinValues.email) {
      toast.error("Enter your email first and then try password reset.");
      return;
    }

    try {
      await sendResetLink(signinValues.email);
      toast.success("Password reset email sent.");
    } catch (error) {
      toast.error(error.message || "Unable to send reset email.");
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-label="Authentication modal">
      <div className="modal-shell__backdrop" onClick={closeModal} aria-hidden="true" />
      <div className="modal-card auth-modal">
        <button type="button" className="modal-close" onClick={closeModal} aria-label="Close sign in modal">
          <X size={18} />
        </button>
        <div className="modal-tabs">
          <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
            Sign In
          </button>
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            Sign Up
          </button>
        </div>
        {mode === "signin" ? (
          <form className="auth-form" onSubmit={handleSignin}>
            <span className="eyebrow">Return to your reservations</span>
            <h3>Sign in to Bael Tree Hotels</h3>
            <label>
              Email
              <input
                type="email"
                value={signinValues.email}
                onChange={(event) =>
                  setSigninValues((previous) => ({ ...previous, email: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={signinValues.password}
                onChange={(event) =>
                  setSigninValues((previous) => ({ ...previous, password: event.target.value }))
                }
                required
              />
            </label>
            <button type="button" className="auth-link" onClick={handleReset}>
              Forgot password?
            </button>
            <button type="submit" className="btn btn-gold" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleGoogle} disabled={submitting}>
              Continue with Google
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup}>
            <span className="eyebrow">Create a guest account</span>
            <h3>Join the Bael Tree circle</h3>
            <label>
              Name
              <input
                type="text"
                value={signupValues.name}
                onChange={(event) =>
                  setSignupValues((previous) => ({ ...previous, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={signupValues.email}
                onChange={(event) =>
                  setSignupValues((previous) => ({ ...previous, email: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                value={signupValues.phone}
                onChange={(event) =>
                  setSignupValues((previous) => ({ ...previous, phone: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={signupValues.password}
                onChange={(event) =>
                  setSignupValues((previous) => ({ ...previous, password: event.target.value }))
                }
                required
                minLength={6}
              />
            </label>
            <button type="submit" className="btn btn-gold" disabled={submitting}>
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;

