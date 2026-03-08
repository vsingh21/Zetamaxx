import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/home");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Email
        </label>
        <input
          type="email"
          className="input-field"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Password
        </label>
        <input
          type="password"
          className="input-field"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary mt-1" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-gray-500">
        No account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Sign up
        </button>
      </p>
    </form>
  );
}
