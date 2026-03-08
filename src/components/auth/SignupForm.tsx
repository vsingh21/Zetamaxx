import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (username.trim().length < 2) {
      setError("Username must be at least 2 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, username);
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
          Username
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. mathwiz42"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          maxLength={30}
          autoComplete="username"
        />
        <p className="text-xs text-gray-600 mt-1">
          Letters, numbers, underscores only
        </p>
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
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary mt-1" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
