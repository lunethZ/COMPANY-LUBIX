import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import type { LoginRequest, LoginResponse } from "../types/auts";
import { useAuth } from "../context/AuthContext";
import { errorDetailMessage } from "../utils/errors";
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"user" | "company">("user");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  // Si ya está autenticado, redirigir y evitar que el botón volver deje ver el login
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role_id === "empresa") navigate("/dashboard-empresa", { replace: true });
      else if (user.role_id === "admin") navigate("/dashboard-admin", { replace: true });
      else navigate("/home-usuario", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      showMessage("Completa todos los campos", "error");
      return;
    }

    setLoading(true);

    try {
      const payload: LoginRequest = { email: email.trim(), password };
      
      // Seleccionar el endpoint según el tipo de usuario
      const endpoint = userType === "company" ? "/auth/login-company" : "/auth/login-user";
      const response = await api.post<LoginResponse>(endpoint, payload);

      const data = response.data;

      // Guardar tokens en localStorage
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      // Interfaz de Usuario
      const mappedRole = data.role === "company" ? "empresa" : data.role === "admin" ? "admin" : "user";

      // Validar que el rol coincida con la selección del usuario
      if (userType === "user" && mappedRole === "empresa") {
        showMessage("Esta cuenta es de tipo empresa. Selecciona 'Empresa' para iniciar sesión.", "error");
        setLoading(false);
        return;
      }
      if (userType === "company" && mappedRole === "user") {
        showMessage("Esta cuenta es de tipo usuario. Selecciona 'Usuario' para iniciar sesión.", "error");
        setLoading(false);
        return;
      }

      login(data.access_token, {
        id: data.id, 
        name: data.Nombre,
        email: data.email,
        role_id: mappedRole,
      });

      api.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;

      showMessage(`¡Bienvenido ${data.Nombre}!`, "success");

      // Redirigir según el tipo de usuario (replace evita que volver regrese al login con sesión abierta)
      if (mappedRole === "empresa") {
        setTimeout(() => navigate("/dashboard-empresa", { replace: true }), 1000);
      } else if (mappedRole === "admin") {
        setTimeout(() => navigate("/dashboard-admin", { replace: true }), 1000);
      } else {
        setTimeout(() => navigate("/home-usuario", { replace: true }), 1000);
      }

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showMessage(errorDetailMessage(error, "Error de login"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div className={messageType === "success" ? "popup-success" : "popup-error"}>
          <div className="flex items-center gap-1.5">
            {messageType === "success" ? "Inicio de Sesion Correcto" : "Error de Inicio de Sesion"}
            <span className="font-medium text-xs sm:text-sm">{message}</span>
          </div>
        </div>
      )}

      <div className="page-container flex items-center justify-center p-3 sm:p-4 relative">
        {/* Flecha para devolverse */}
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Volver al inicio"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-muted hover:text-accent transition-colors text-sm font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Volver</span>
        </button>

        <div className="w-full max-w-sm">
          <div className="text-center mb-4 sm:mb-5">
            <h1 className="text-accent text-2xl sm:text-3xl font-black drop-shadow-sm mb-1">
              Lubix
            </h1>
            <p className="text-muted text-xs sm:text-sm font-light tracking-wide">
              Inicia sesión
            </p>
          </div>

          {/* Selector de tipo de usuario */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setUserType("user")}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition text-xs sm:text-sm ${
                userType === "user"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
               Usuario
            </button>
            <button
              type="button"
              onClick={() => setUserType("company")}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition text-xs sm:text-sm ${
                userType === "company"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Empresa
            </button>
          </div>

          <form onSubmit={handleSubmit} className="card-form space-y-3 sm:space-y-4">
            <div className="mb-3 sm:mb-4">
              <label className="label-base">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            <div className="mb-4 sm:mb-5">
              <label className="label-base">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Iniciando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>

            <div className="pt-4 divider text-center">
              <p className="text-muted text-xs sm:text-sm">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/register"
                  className="text-accent hover:underline font-semibold text-xs sm:text-sm transition-colors"
                >
                  Regístrate
                </Link>
              </p>
            </div>
            <div className="pt-4 divider text-center">
              <p className="text-muted text-xs sm:text-sm">
                ¿Olvidaste tu contraseña?{" "}
                <Link
                  to="/recover"
                  className="text-accent hover:underline font-semibold text-xs sm:text-sm transition-colors"
                >
                  Recuperar
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;