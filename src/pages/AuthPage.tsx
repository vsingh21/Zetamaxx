import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (!loading && user) navigate("/home", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-mono text-4xl font-bold text-blue-400 mb-2">
            Zetamaxx
          </h1>
          <p className="text-gray-500 text-sm">
            Arithmetic speed drills, tracked
          </p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-5">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
          {mode === "login" ? (
            <LoginForm onSwitch={() => setMode("signup")} />
          ) : (
            <SignupForm onSwitch={() => setMode("login")} />
          )}
        </div>
      </div>
    </div>
  );
}
