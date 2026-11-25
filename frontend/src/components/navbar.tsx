import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useAuthModal } from "../context/AuthModalContext";
import { MagnifyingGlassIcon, ShoppingCartIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLogged = !!user;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    void navigate(`/buscar?q=${encodeURIComponent(searchValue.trim())}`);
    setMobileOpen(false);
  };

  return (
    <nav className="relative flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#162238] w-full">
      {/* LOGO */}
      <Link to="/" className="text-green-500 text-2xl font-bold shrink-0">
        Lubix
      </Link>

      {/* SEARCH */}
      <form onSubmit={handleSearch} className="relative hidden md:block">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Buscar..."
          className="px-4 py-2 rounded-full bg-[#1c2a4a] text-white placeholder-gray-400 focus:outline-none w-64 pr-10"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-400 transition">
          <MagnifyingGlassIcon className="w-4 h-4" />
        </button>
      </form>

      {/* LINKS */}
      <div className="flex items-center gap-2 sm:gap-4 text-white">
        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          aria-controls="navbar-publico-movil"
        >
          {mobileOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>

        <div className="hidden md:flex items-center gap-4">
        {/* BOTÓN TEMA */}
        <button
          onClick={toggleTheme}
          className="relative w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300"
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
          style={{ backgroundColor: "var(--color-btn-primary)" }}
        >
          {/* Luna */}
          <svg
            className={`w-6 h-6 text-white absolute transition-all duration-300 ${
              theme === "light" ? "opacity-100 rotate-0" : "opacity-0 rotate-180"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          {/* Sol limpio */}
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

        {isLogged ? (
          <>
            {/* AVATAR */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-black bg-green-400"
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            {/* NAME */}
            <span className="font-medium">{user.name}</span>
            {/* LOGOUT */}
            <button
              onClick={() => {
                logout();
                // replace evita que volver regrese al dashboard con sesión
                window.location.href = "/login";
              }}
              className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600 transition-colors duration-300"
            >
              Salir
            </button>
          </>
        ) : (
          <>
            <button onClick={openLogin} className="hover:text-green-400 transition">
              Login
            </button>
            <button
              onClick={openRegister}
              className="bg-green-500 text-black font-bold px-4 py-2 rounded-full hover:bg-green-600 transition"
            >
              Register
            </button>
          </>
        )}

        {/* CARRITO */}
        <Link to="/carrito" className="relative flex items-center gap-1 text-white hover:text-green-400 transition">
          <ShoppingCartIcon className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
        </div>

        {/* CARRITO (móvil) */}
        <Link
          to="/carrito"
          className="md:hidden relative flex items-center text-white hover:text-green-400 transition w-10 h-10 justify-center"
          aria-label="Ir al carrito"
        >
          <ShoppingCartIcon className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
      </div>

      {mobileOpen && (
        <div
          id="navbar-publico-movil"
          className="absolute left-0 right-0 top-full z-40 md:hidden bg-[#162238] border-t border-white/10 px-4 pb-5 pt-3 space-y-4"
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-4 py-2.5 rounded-full bg-[#1c2a4a] text-white placeholder-gray-400 focus:outline-none pr-10"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-400 transition" aria-label="Buscar">
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
          </form>

          {isLogged ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-white min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-black bg-green-400 shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium truncate">{user.name}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="bg-red-500 px-4 py-2 rounded-lg text-white hover:bg-red-600 transition-colors duration-300 shrink-0"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setMobileOpen(false); openLogin(); }}
                className="w-full border border-green-500 text-green-400 py-2.5 rounded-lg font-semibold hover:bg-green-500/10 transition"
              >
                Login
              </button>
              <button
                onClick={() => { setMobileOpen(false); openRegister(); }}
                className="w-full bg-green-500 text-black font-bold py-2.5 rounded-lg hover:bg-green-600 transition"
              >
                Register
              </button>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/15 text-white hover:bg-white/10 transition"
          >
            <span className="w-5 h-5" aria-hidden="true">
              {theme === "light" ? "🌙" : "☀️"}
            </span>
            {theme === "light" ? "Modo oscuro" : "Modo claro"}
          </button>
        </div>
      )}
    </nav>
  );
}
