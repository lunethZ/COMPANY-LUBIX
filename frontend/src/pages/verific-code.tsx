import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import type { VerifyEmailRequest, VerifyEmailResponse } from "../types/auts";
import { errorDetailMessage } from "../utils/errors";

const VerificationCode: React.FC = () => {
  const [code, setCode] = useState(Array(6).fill(""));
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isValidCode = code.every((digit) => digit !== "");

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "Enter" && isValidCode) {
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "");
    const pasteArray = paste.slice(0, 6).split("");

    const newCode = [...code];
    pasteArray.forEach((digit, i) => {
      if (i < 6) newCode[i] = digit;
    });

    setCode(newCode);
  };

  const handleResend = async () => {
    if (!email) {
      showMessage("Ingresa tu email primero", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/resend-verification", { email });
      showMessage("Nuevo código enviado", "success");
      setCode(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showMessage(
          errorDetailMessage(error, "Error al reenviar"),
          "error"
        );
      } else {
        showMessage("Error de conexión", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");

    if (!email) {
      showMessage("Ingresa tu email", "error");
      return;
    }

    if (fullCode.length !== 6) {
      showMessage("Código incompleto", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<VerifyEmailResponse>(
        "/auth/verify-email-user",
        {
          email,
          code: fullCode
        } as VerifyEmailRequest
      );

      showMessage("¡Verificado!", "success");

      setTimeout(() => {
        navigate("/login", {
          state: {
            email,
            verified: true,
            token: response.data.data?.token
          }
        });
      }, 1500);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg = errorDetailMessage(error, "");
        if (msg) {
          showMessage(msg, "error");
        } else {
          showMessage("Código inválido", "error");
        }
      } else {
        showMessage("Error de conexión", "error");
      }

      setCode(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Popup */}
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
            <p className="text-muted text-xs sm:text-sm font-light">
              Verifica email
            </p>
          </div>

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className="card-form space-y-3"
          >

            {/* Email */}
            <div className="mb-3">
              <label className="label-base">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            {/* OTP */}
            <div onPaste={handlePaste} className="mb-3">
              <label className="label-base">
                Código
              </label>
              <div className="flex gap-1.5 p-2.5 rounded-lg" style={{ backgroundColor: "var(--color-bg-input)" }}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    disabled={loading}
                    className="w-10 h-10 text-lg font-bold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 outline-none disabled:opacity-50 flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--color-bg-input)",
                      borderColor: "var(--color-border)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted mt-1 text-center">
                Ctrl+V para pegar
              </p>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={!isValidCode || loading || !email}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verificando
                </>
              ) : (
                "Verificar"
              )}
            </button>
          </form>

          {/* Reenviar */}
          <div className="mt-3 pt-3 divider">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || !email}
              className="w-full px-4 py-2 rounded-lg text-xs font-medium hover:shadow-sm transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                color: "var(--color-text)",
                border: `1px solid var(--color-border)`
              }}
            >
              Reenviar
            </button>
          </div>

          {/* Link */}
          <p className="mt-3 text-center">
            <Link
              to="/register"
              className="text-accent text-xs font-medium hover:underline transition-colors"
            >
              Cambiar email
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default VerificationCode;