import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import { useAuthModal } from "../context/AuthModalContext";
import { useAuth } from "../context/AuthContext";
import { XMarkIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import type { LoginRequest, LoginResponse } from "../types/auts";

type AuthTab = "login" | "register";
type RegistrationMode = "usuario" | "empresa";

export default function AuthModal() {
  const { isOpen, initialTab, close } = useAuthModal();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<AuthTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      close();
    }
  }, [isAuthenticated, isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={close}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative w-full max-w-md max-h-[90vh] animate-[modalIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalIn 0.3s ease-out",
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        <div className="rounded-3xl overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)] border border-white/10 max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 overflow-y-auto">
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 backdrop-blur-sm"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="relative pt-6 pb-4 px-8 text-center overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-green-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl" />

              <div className="relative">
                <div className="mx-auto mb-2 w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                  <span className="text-white text-xl font-black">L</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-green-400 via-green-500 to-emerald-400 bg-clip-text text-transparent">
                    Lubix
                  </span>
                </h1>
                <p className="text-gray-500 text-xs mt-1">Tu marketplace de confianza</p>
              </div>
            </div>

            <div className="px-8 pb-2">
              <div className="flex bg-slate-800/80 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setTab("login")}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    tab === "login"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-slate-700/50"
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setTab("register")}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    tab === "register"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-slate-700/50"
                  }`}
                >
                  Registrarse
                </button>
              </div>
            </div>

            <div className="p-6">
              {tab === "login" ? (
                <LoginForm onSwitch={() => setTab("register")} onSuccess={close} />
              ) : (
                <RegisterForm onSwitch={() => setTab("login")} onSuccess={close} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"user" | "company">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Completa todos los campos");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload: LoginRequest = { email: email.trim(), password };
      const endpoint = userType === "company" ? "/auth/login-company" : "/auth/login-user";
      const response = await api.post<LoginResponse>(endpoint, payload);
      const data = response.data;

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      const mappedRole = data.role === "company" ? "empresa" : data.role === "admin" ? "admin" : "user";

      if (userType === "user" && mappedRole === "empresa") {
        setError("Esta cuenta es de tipo empresa. Selecciona 'Empresa'.");
        setLoading(false);
        return;
      }
      if (userType === "company" && mappedRole === "user") {
        setError("Esta cuenta es de tipo usuario. Selecciona 'Usuario'.");
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
      onSuccess();

      if (mappedRole === "empresa") navigate("/dashboard-empresa", { replace: true });
      else if (mappedRole === "admin") navigate("/dashboard-admin", { replace: true });
      else navigate("/home-usuario", { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        let errorMsg = "Error de login";
        if (errorData?.detail) {
          if (typeof errorData.detail === "string") errorMsg = errorData.detail;
          else if (Array.isArray(errorData.detail)) errorMsg = errorData.detail.map((e: any) => e.msg).join(". ");
        }
        if (error.response?.status === 400 && errorMsg.includes("incorrectos")) {
          errorMsg = "El correo o la contraseña son incorrectos.";
        } else if (error.response?.status === 403) {
          errorMsg = errorMsg.includes("empresa")
            ? "Esta cuenta es de tipo empresa."
            : "Esta cuenta es de tipo usuario.";
        }
        setError(errorMsg);
      } else {
        setError("Error de conexión.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex bg-slate-800/60 rounded-xl p-1 gap-1">
        <button type="button" onClick={() => setUserType("user")}
          className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${userType === "user" ? "bg-slate-700 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"}`}>
          Usuario
        </button>
        <button type="button" onClick={() => setUserType("company")}
          className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${userType === "company" ? "bg-slate-700 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"}`}>
          Empresa
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-400">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200 placeholder:text-gray-600"
          placeholder="tu@email.com" disabled={loading} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-400">Contraseña</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200 pr-12 placeholder:text-gray-600"
            placeholder="••••••••" disabled={loading} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200" tabIndex={-1}>
            {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/30">
        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
        {loading ? "Iniciando..." : "Iniciar Sesión"}
      </button>

      <p className="text-center text-xs text-gray-500 pt-1">
        ¿No tienes cuenta?{" "}
        <button type="button" onClick={onSwitch} className="text-green-400 hover:text-green-300 font-semibold transition-colors">
          Regístrate gratis
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<RegistrationMode>("usuario");
  const [form, setForm] = useState({
    name: "", surname: "", email: "", tell: "", password: "", confirmPassword: "",
    companyName: "", nit: "", nitDV: "", address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const password = form.password;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const strength = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
  const isPasswordValid = strength === 4;

  const getStrengthColor = () => {
    if (strength <= 1) return "from-red-500 to-red-400";
    if (strength === 2) return "from-orange-500 to-orange-400";
    if (strength === 3) return "from-yellow-400 to-yellow-300";
    return "from-green-500 to-emerald-400";
  };

  const getStrengthLabel = () => {
    if (strength <= 1) return "Débil";
    if (strength === 2) return "Regular";
    if (strength === 3) return "Buena";
    return "Fuerte";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!isPasswordValid) {
      setError("La contraseña debe tener 8+ chars, mayúscula, minúscula y número.");
      return;
    }
    if (mode === "empresa") {
      if (!form.companyName.trim()) { setError("Nombre de empresa obligatorio"); return; }
      if (!form.nit.trim()) { setError("NIT obligatorio"); return; }
      if (!form.address.trim()) { setError("Dirección obligatoria"); return; }
    } else {
      if (!form.name.trim()) { setError("Nombre obligatorio"); return; }
      if (!form.surname.trim()) { setError("Apellido obligatorio"); return; }
    }
    if (!form.email.trim()) { setError("Correo obligatorio"); return; }
    if (!form.tell.trim()) { setError("Teléfono obligatorio"); return; }

    setLoading(true);

    try {
      if (mode === "empresa") {
        const formData = new FormData();
        formData.append("fullName", form.name);
        formData.append("email", form.email);
        formData.append("password", form.password);
        formData.append("tell", form.tell);
        formData.append("companyName", form.companyName);
        formData.append("companyAddress", form.address);
        formData.append("companyNIT", form.nit);
        formData.append("companyNITDV", form.nitDV || "0");
        const blob = new Blob(["placeholder"], { type: "text/plain" });
        formData.append("certificate", blob, "placeholder.txt");
        await api.post("/auth/register-company", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setError("");
        onSuccess();
        navigate("/login", { replace: true });
      } else {
        await api.post("/auth/register-user", {
          fullName: `${form.name} ${form.surname}`.trim(),
          email: form.email,
          tell: form.tell,
          password: form.password,
        });
        setError("");
        onSuccess();
        navigate("/register/VerifyEmailPage", { replace: true });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        let errorMsg = "";
        if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMsg = errorData.detail.map((e: any) => e.msg).join(". ");
          } else if (typeof errorData.detail === "string") {
            errorMsg = errorData.detail;
          }
        } else {
          errorMsg = "Error al registrar";
        }
        setError(errorMsg);
      } else {
        setError("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200 placeholder:text-gray-600`;

  return (
    <form onSubmit={handleRegister} className="space-y-3">
      <div className="flex bg-slate-800/60 rounded-xl p-1 gap-1">
        {(["usuario", "empresa"] as RegistrationMode[]).map((option) => (
          <button key={option} type="button" onClick={() => setMode(option)}
            className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${mode === option ? "bg-slate-700 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"}`}>
            {option === "usuario" ? "Usuario" : "Empresa"}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className={`grid gap-3 ${mode === "usuario" ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-400">
            {mode === "empresa" ? "Nombre contacto *" : "Nombre *"}
          </label>
          <input name="name" value={form.name} onChange={handleChange}
            className={`${inputClass} ${fieldErrors.name ? "border-red-500" : ""}`}
            placeholder={mode === "empresa" ? "Nombre contacto" : "Nombre"} required />
        </div>
        {mode === "usuario" && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400">Apellido *</label>
            <input name="surname" value={form.surname} onChange={handleChange}
              className={`${inputClass} ${fieldErrors.surname ? "border-red-500" : ""}`}
              placeholder="Apellido" required />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-400">Email *</label>
        <input name="email" type="email" value={form.email} onChange={handleChange}
          className={`${inputClass} ${fieldErrors.email ? "border-red-500" : ""}`}
          placeholder="tu@email.com" required />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-400">Teléfono *</label>
        <input name="tell" value={form.tell} onChange={handleChange}
          className={`${inputClass} ${fieldErrors.tell ? "border-red-500" : ""}`}
          placeholder="+57 300 123 4567" required />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-400">Contraseña *</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
            className={`${inputClass} pr-12`}
            placeholder="••••••••" required />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200" tabIndex={-1}>
            {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
        {form.password && (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-1.5 flex-1 bg-slate-700/50 rounded-full overflow-hidden mr-3">
                <div className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getStrengthColor()}`} style={{ width: `${(strength / 4) * 100}%` }} />
              </div>
              <span className="text-[10px] font-medium text-gray-500">{getStrengthLabel()}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-[10px] text-gray-500">
              {[
                { ok: hasMinLength, label: "8+ chars" },
                { ok: hasUpper, label: "A-Z" },
                { ok: hasLower, label: "a-z" },
                { ok: hasNumber, label: "0-9" },
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-1 transition-colors ${item.ok ? "text-green-400" : ""}`}>
                  <div className={`w-1 h-1 rounded-full ${item.ok ? "bg-green-400" : "bg-gray-600"}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-400">Confirmar contraseña *</label>
        <div className="relative">
          <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
            className={`${inputClass} pr-12`}
            placeholder="••••••••" required />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200" tabIndex={-1}>
            {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>
        {form.confirmPassword && form.password !== form.confirmPassword && (
          <p className="text-[10px] text-red-400 flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-red-400" />
            Las contraseñas no coinciden
          </p>
        )}
      </div>

      {mode === "empresa" && (
        <>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400">Nombre de la empresa *</label>
            <input name="companyName" value={form.companyName} onChange={handleChange}
              className={inputClass}
              placeholder="Lubix S.A.S" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">NIT *</label>
              <input name="nit" value={form.nit} onChange={handleChange}
                className={inputClass}
                placeholder="900123456" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-400">DV *</label>
              <input name="nitDV" value={form.nitDV} onChange={handleChange}
                className={inputClass}
                placeholder="7" maxLength={1} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400">Dirección *</label>
            <input name="address" value={form.address} onChange={handleChange}
              className={inputClass}
              placeholder="Calle 123 #45-67" required />
          </div>
        </>
      )}

      <button type="submit" disabled={!isPasswordValid || loading}
        className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/30">
        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
        {loading ? "Creando..." : mode === "empresa" ? "Registrar empresa" : "Crear cuenta"}
      </button>

      <p className="text-center text-xs text-gray-500 pt-1">
        ¿Ya tienes cuenta?{" "}
        <button type="button" onClick={onSwitch} className="text-green-400 hover:text-green-300 font-semibold transition-colors">
          Inicia sesión
        </button>
      </p>
    </form>
  );
}
