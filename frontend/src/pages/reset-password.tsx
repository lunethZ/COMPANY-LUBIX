import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import { errorDetailMessage } from "../utils/errors";

const RecoverPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const navigate = useNavigate();

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

    if (!email.trim()) {
      showMessage("Ingresa tu email", "error");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/forgot-password-user", {
        email: email.trim(),
      });

      showMessage("Código enviado a tu correo ✅", "success");

      setTimeout(() => {
        navigate("/new-password", { state: { email: email.trim() } });
      }, 1200);

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNABORTED") {
          showMessage("El servidor está iniciando, intenta nuevamente en unos segundos.", "error");
        } else if (!err.response) {
          showMessage("No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.", "error");
        } else {
          showMessage(errorDetailMessage(err, "Error enviando el correo"), "error");
        }
      } else {
        showMessage("Error de conexión", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Popup superior */}
      {message && (
        <div className={messageType === "success" ? "popup-success" : "popup-error"}>
          <div className="flex items-center gap-1.5">
            {messageType === "success" ? "✅" : "❌"}
            <span className="font-medium text-xs sm:text-sm">{message}</span>
          </div>
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="page-container flex items-center justify-center p-3 sm:p-4">
        
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-4 sm:mb-5">
            <h1 className="text-accent text-2xl sm:text-3xl font-black drop-shadow-sm mb-1">
              Lubix
            </h1>
            <p className="text-muted text-xs sm:text-sm font-light tracking-wide">
              Recuperar contraseña
            </p>
          </div>

          {/* Formulario */}
          <form 
            onSubmit={handleSubmit} 
            className="card-form space-y-3"
          >
            
            {/* Email */}
            <div className="mb-4">
              <label className="label-base">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="tu@email.com"
                disabled={loading}
                required
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                "Enviar código"
              )}
            </button>
          </form>

          {/* Link */}
          <div className="mt-3 pt-3 divider text-center">
            <p className="text-muted text-xs">
              ¿Recordaste tu contraseña?{' '}
              <Link 
                to="/login" 
                className="text-accent hover:underline font-semibold transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecoverPassword;