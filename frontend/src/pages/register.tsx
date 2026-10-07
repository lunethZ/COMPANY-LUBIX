import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import { errorDetailMessage } from "../utils/errors";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

type RegistrationMode = "usuario" | "empresa";

export const Register = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<RegistrationMode>("usuario");

    const [form, setForm] = useState({
        name: "",
        surname: "",
        email: "",
        tell: "",
        password: "",
        confirmPassword: "",
        companyName: "",
        nit: "",
        nitDV: "",
        address: "",
        sector: "",
    });

    const [message, setMessage] = useState("");
    const [type, setType] = useState<"success" | "error" | "">("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const password = form.password;

    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    const strength = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
    const isPasswordValid = strength === 4;

    const getStrengthColor = () => {
        if (strength <= 1) return "bg-red-500";
        if (strength === 2) return "bg-orange-500";
        if (strength === 3) return "bg-yellow-400";
        return "bg-green-500";
    };

    const showPopup = (msg: string, t: "success" | "error") => {
        setMessage(msg);
        setType(t);
        setTimeout(() => {
            setMessage("");
            setType("");
        }, 3000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        if (form.password !== form.confirmPassword) {
            showPopup("Las contraseñas no coinciden", "error");
            return;
        }

        if (!isPasswordValid) {
            showPopup("La contraseña no es segura. Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.", "error");
            return;
        }

        if (mode === "empresa") {
            if (!form.companyName.trim()) {
                setFieldErrors({ companyName: "El nombre de la empresa es obligatorio" });
                showPopup("Completa el nombre de la empresa", "error");
                return;
            }
            if (!form.nit.trim()) {
                setFieldErrors({ nit: "El NIT es obligatorio" });
                showPopup("Completa el NIT de la empresa", "error");
                return;
            }
            if (!form.nitDV.trim()) {
                setFieldErrors({ nitDV: "El dígito de verificación es obligatorio" });
                showPopup("Completa el dígito de verificación del NIT", "error");
                return;
            }
            if (!form.address.trim()) {
                setFieldErrors({ address: "La dirección es obligatoria" });
                showPopup("Completa la dirección de la empresa", "error");
                return;
            }
        } else {
            if (!form.name.trim()) {
                setFieldErrors({ name: "El nombre es obligatorio" });
                showPopup("Completa tu nombre", "error");
                return;
            }
            if (!form.surname.trim()) {
                setFieldErrors({ surname: "El apellido es obligatorio" });
                showPopup("Completa tu apellido", "error");
                return;
            }
        }

        if (!form.email.trim()) {
            setFieldErrors({ email: "El correo es obligatorio" });
            showPopup("Completa tu correo electrónico", "error");
            return;
        }

        if (!form.tell.trim()) {
            setFieldErrors({ tell: "El teléfono es obligatorio" });
            showPopup("Completa tu número de teléfono", "error");
            return;
        }

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

                showPopup("Empresa registrada. Recibirás un correo de verificación.", "success");
            } else {
                const payload = {
                    fullName: `${form.name} ${form.surname}`.trim(),
                    email: form.email,
                    tell: form.tell,
                    password: form.password,
                };

                await api.post("/auth/register-user", payload);
                showPopup("Usuario registrado correctamente", "success");
            }

            setForm({
                name: "",
                surname: "",
                email: "",
                tell: "",
                password: "",
                confirmPassword: "",
                companyName: "",
                nit: "",
                nitDV: "",
                address: "",
                sector: "",
            });

            if (mode === "empresa") {
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setTimeout(() => {
                    navigate("/register/VerifyEmailPage");
                }, 2000);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorData = error.response?.data;
                let errorMsg = "";
                const newFieldErrors: Record<string, string> = {};

                if (errorData?.detail) {
                    if (Array.isArray(errorData.detail)) {
                        // Pydantic validation errors
                        const errors = errorData.detail;
                        errors.forEach((err: any) => {
                            const field = err.loc?.[err.loc.length - 1] || "";
                            const msg = err.msg || "Error de validación";
                            newFieldErrors[field] = msg;
                        });
                        errorMsg = errors.map((e: any) => e.msg).join(". ");
                    } else if (typeof errorData.detail === "string") {
                        errorMsg = errorData.detail;
                        // Map common backend errors to fields
                        if (errorMsg.includes("correo") || errorMsg.includes("email")) {
                            newFieldErrors.email = errorMsg;
                        } else if (errorMsg.includes("NIT")) {
                            newFieldErrors.nit = errorMsg;
                        } else if (errorMsg.includes("nombre")) {
                            newFieldErrors.companyName = errorMsg;
                        }
                    }
                } else {
                    errorMsg = mode === "empresa" ? "No se pudo registrar la empresa" : "Error al registrar";
                }

                setFieldErrors(newFieldErrors);
                showPopup(errorMsg, "error");
            } else {
                showPopup("Error desconocido. Intenta de nuevo.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {message && (
                <div className={type === "success" ? "popup-success" : "popup-error"}>
                    <div className="flex items-center gap-2">
                        {type === "success" ? "Registro Exitoso" : "Error en el Registro"}
                        <span className="font-medium text-sm">{message}</span>
                    </div>
                </div>
            )}

            <div className="page-container flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-sm sm:max-w-md">
                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className="text-accent text-3xl sm:text-4xl lg:text-5xl font-black drop-shadow-sm mb-2 sm:mb-3">
                            Lubix
                        </h1>
                        <p className="text-muted text-sm sm:text-base lg:text-lg font-light tracking-wide">
                            {mode === "empresa" ? "Registra tu empresa" : "Crea tu cuenta gratis"}
                        </p>
                    </div>

                    <div className="mb-4 flex rounded-xl border p-1 shadow-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
                        {(["usuario", "empresa"] as RegistrationMode[]).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setMode(option)}
                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200`}
                                style={{
                                    backgroundColor: mode === option ? "var(--color-btn-primary)" : "transparent",
                                    color: mode === option ? "white" : "var(--color-text)",
                                }}
                            >
                                {option === "usuario" ? "Usuario" : "Empresa"}
                            </button>
                        ))}
                    </div>

                    <form
                        onSubmit={handleRegister}
                        className="card-form space-y-4 sm:space-y-5"
                    >
                        <div className={`grid gap-4 ${mode === "usuario" ? "grid-cols-2" : "grid-cols-1"}`}>
                            <div>
                                <label className="label-base">
                                    {mode === "empresa" ? "Nombre contacto *" : "Nombre *"}
                                </label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className={`input-base ${fieldErrors.name ? 'border-red-500' : ''}`}
                                    placeholder={mode === "empresa" ? "Nombre de contacto" : "Su Nombre"}
                                    required
                                />
                                {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
                            </div>
                            
                            {mode === "usuario" && (
                                <div>
                                    <label className="label-base">
                                        Apellido *
                                    </label>
                                    <input
                                        name="surname"
                                        value={form.surname}
                                        onChange={handleChange}
                                        className={`input-base ${fieldErrors.surname ? 'border-red-500' : ''}`}
                                        placeholder="Su Apellido"
                                        required
                                    />
                                    {fieldErrors.surname && <p className="text-xs text-red-400 mt-1">{fieldErrors.surname}</p>}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="label-base">
                                Email *
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                className={`input-base ${fieldErrors.email ? 'border-red-500' : ''}`}
                                placeholder="tu@email.com"
                                required
                              />
                            {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
                        </div>

                        <div>
                            <label className="label-base">
                                Teléfono *
                            </label>
                            <input
                                name="tell"
                                value={form.tell}
                                onChange={handleChange}
                                className={`input-base ${fieldErrors.tell ? 'border-red-500' : ''}`}
                                placeholder="+57 300 123 4567"
                                required
                            />
                            {fieldErrors.tell && <p className="text-xs text-red-400 mt-1">{fieldErrors.tell}</p>}
                        </div>

                        <div>
                            <label className="label-base">
                                Contraseña *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="input-base pr-10"
                                    placeholder="••••••••"
                                    required
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

                            {form.password && (
                                <div className="mt-3">
                                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${getStrengthColor()}`}
                                            style={{ width: `${(strength / 4) * 100}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted">
                                        <span className={hasMinLength ? "text-accent font-medium" : "text-muted"}>8+ chars</span>
                                        <span className={hasUpper ? "text-accent font-medium" : "text-muted"}>Mayús</span>
                                        <span className={hasLower ? "text-accent font-medium" : "text-muted"}>Minús</span>
                                        <span className={hasNumber ? "text-accent font-medium" : "text-muted"}>Número</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="label-base">
                                Confirmar contraseña *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className="input-base pr-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeSlashIcon className="w-5 h-5" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {mode === "empresa" && (
                            <>
                                <div>
                                    <label className="label-base">
                                        Nombre de la empresa *
                                    </label>
                                    <input
                                        name="companyName"
                                        value={form.companyName}
                                        onChange={handleChange}
                                        className={`input-base ${fieldErrors.companyName ? 'border-red-500' : ''}`}
                                        placeholder="Lubix S.A.S"
                                        required
                                    />
                                    {fieldErrors.companyName && <p className="text-xs text-red-400 mt-1">{fieldErrors.companyName}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-base">
                                            NIT *
                                        </label>
                                        <input
                                            name="nit"
                                            value={form.nit}
                                            onChange={handleChange}
                                            className={`input-base ${fieldErrors.nit ? 'border-red-500' : ''}`}
                                            placeholder="900123456"
                                            required
                                        />
                                        {fieldErrors.nit && <p className="text-xs text-red-400 mt-1">{fieldErrors.nit}</p>}
                                    </div>
                                    <div>
                                        <label className="label-base">
                                            DV *
                                        </label>
                                        <input
                                            name="nitDV"
                                            value={form.nitDV}
                                            onChange={handleChange}
                                            className={`input-base ${fieldErrors.nitDV ? 'border-red-500' : ''}`}
                                            placeholder="7"
                                            maxLength={1}
                                            required
                                        />
                                        {fieldErrors.nitDV && <p className="text-xs text-red-400 mt-1">{fieldErrors.nitDV}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="label-base">
                                        Dirección *
                                    </label>
                                    <input
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        className={`input-base ${fieldErrors.address ? 'border-red-500' : ''}`}
                                        placeholder="Calle 123 #45-67"
                                        required
                                    />
                                    {fieldErrors.address && <p className="text-xs text-red-400 mt-1">{fieldErrors.address}</p>}
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={!isPasswordValid || loading}
                            className="btn-primary"
                        >
                            {loading ? (mode === "empresa" ? "Registrando empresa..." : "Creando cuenta...") : (mode === "empresa" ? "Registrar empresa" : "Crear cuenta")}
                        </button>

                        <p className="text-center text-sm text-muted">
                            ¿Ya tienes cuenta?{" "}
                            <Link to="/login" className="text-accent font-semibold hover:underline">
                                Inicia sesión
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Register;
