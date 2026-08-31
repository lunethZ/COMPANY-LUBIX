import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { UserCircleIcon, ShoppingCartIcon, MagnifyingGlassIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function NavbarUsuario() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-[#162238] w-full">
      <Link to="/home-usuario" className="text-green-500 text-2xl font-bold hover:text-green-400 transition">Lubix</Link>

      <form onSubmit={handleSearch} className="flex w-[500px] bg-[#1c2a4a] rounded-full overflow-hidden">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Buscar productos..."
          className="flex-1 px-4 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none"
        />
        <button type="submit" className="bg-green-500 px-5 text-white hover:bg-green-600 transition flex items-center justify-center">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>
      </form>

      <div className="flex items-center gap-6 text-white">
        <button
          onClick={toggleTheme}
          className="relative w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300"
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
          style={{ backgroundColor: "var(--color-btn-primary)" }}
        >
          <svg
            className={`w-6 h-6 text-white absolute transition-all duration-300 ${
              theme === "light" ? "opacity-100 rotate-0" : "opacity-0 rotate-180"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          <svg
            className={`w-6 h-6 text-yellow-400 absolute transition-all duration-300 ${
              theme === "dark" ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M12 8a4 4 0 100 8 4 4 0 000-8zm0-6.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V2a.75.75 0 01.75-.75zm0 18a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm10-9.25a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zm-18 0a.75.75 0 01-.75.75H1.75a.75.75 0 010-1.5H3a.75.75 0 01.75.75zM17.657 6.343a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06zm-11.314 11.314a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06zm11.314 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06zm-11.314-11.314a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 111.06 1.06L6.343 6.343z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <Link to="/carrito" className="flex items-center gap-1 hover:text-green-400 transition relative">
          <ShoppingCartIcon className="w-5 h-5" />
          <span>Carrito</span>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>

        <Link to="/pqrs" className="flex items-center gap-1 hover:text-green-400 transition">
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
          <span>PQRS</span>
        </Link>

        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 border-l border-gray-600 pl-4"
            >
              {user.name ? (
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-black bg-green-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <UserCircleIcon className="w-8 h-8 text-green-500" />
              )}
              <span className="font-medium">{user.name}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[#1c2a4a] rounded shadow-lg py-2 z-50">
                <Link
                  to="/dashboard-usuario"
                  className="block px-4 py-2 text-white hover:bg-green-500 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Ver Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-red-500 transition"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}