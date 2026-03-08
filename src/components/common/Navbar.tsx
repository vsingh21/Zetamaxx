import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: "/home", label: "Play" },
    { to: "/insights", label: "Insights" },
  ];

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-10 h-14 flex items-center justify-between">
        <Link
          to="/home"
          className="font-mono font-bold text-lg text-blue-400 tracking-tight"
        >
          Zetamaxx
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith(link.to)
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-3 pl-3 border-l border-gray-800 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">
              {profile?.username}
            </span>
            <button
              onClick={signOut}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
