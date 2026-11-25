import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarEmpresa from "../components/navbar-empresa";
import Footer from "../components/footer";
import { useAuth } from "../context/AuthContext";
import { 
  BriefcaseIcon, 
  UserGroupIcon, 
  RocketLaunchIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

// Datos de la sección "Por qué elegirnos" (Diferenciadores)
const pilares = [
  {
    titulo: "Soluciones de Infraestructura",
    descripcion: "Ofrecemos soporte técnico corporativo de vanguardia y despliegue modular de sistemas optimizados.",
    icono: <RocketLaunchIcon className="w-8 h-8 text-emerald-500" />
  },
  {
    titulo: "Confianza y Seguridad",
    descripcion: "Certificaciones bajo estándares estrictos y manejo seguro de datos en entornos aislados y estables.",
    icono: <ShieldCheckIcon className="w-8 h-8 text-emerald-500" />
  },
  {
    titulo: "Soporte Estratégico",
    descripcion: "Un equipo multidisciplinario listo para acompañar el crecimiento operativo de tu organización.",
    icono: <UserGroupIcon className="w-8 h-8 text-emerald-500" />
  }
];

// Carrusel de Proyectos de Éxito / Alianzas de la Empresa
const proyectosContemporaneos = [
  { 
    titulo: "Expansión Logística Nacional", 
    categoria: "Caso de Éxito",
    descripcion: "Optimización de la cadena de suministro integrada con un incremento de eficiencia global.",
    color: "bg-gradient-to-tr from-emerald-950 to-gray-900 text-white",
  },
  { 
    titulo: "Transformación Tecnológica Colectiva", 
    categoria: "Desarrollo a Medida",
    descripcion: "Migración integral de sistemas legados hacia entornos en la nube de alta disponibilidad.",
    color: "bg-gradient-to-tr from-emerald-800 to-emerald-950 text-white",
  }
];

const HomeEmpresa = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  // Rotación automática de casos de éxito
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % proyectosContemporaneos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* NAVBAR */}
      <NavbarEmpresa />

      {/* 1. HERO SECTION CORPORATIVO */}
      <section className="flex flex-col lg:flex-row justify-between items-center px-4 sm:px-8 md:px-16 py-14 sm:py-24 gap-10 sm:gap-12 max-w-7xl mx-auto w-full">
        <div className="max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <BriefcaseIcon className="w-4 h-4" /> {user?.name || "Empresa"}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight" style={{ color: "var(--color-text)" }}>
            Impulsando el Futuro de las Empresas en Lubix
          </h1>
          <p className="text-lg text-muted mb-8 leading-relaxed">
            Construimos puentes tecnológicos y comerciales sólidos para optimizar tu cadena de valor. Conecta con mercados globales de manera escalable y eficiente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button 
              onClick={() => navigate("/register")}
              className="inline-flex items-center justify-center bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition space-x-2 shadow-lg shadow-emerald-600/20"
            >
              <span>Agendar Alianza</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate("/dashboard-empresa")}
              className="inline-flex items-center justify-center border-2 border-gray-300 dark:border-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              style={{ color: "var(--color-text)" }}
            >
              Conocer Más
            </button>
          </div>
        </div>

        {/* Presentación Dinámica de Logros */}
        <div className="w-full max-w-md h-[380px] rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between transform transition-all duration-500 hover:shadow-2xl" style={{ backgroundColor: "var(--color-bg-card)" }}>
          <div className="p-8 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2 block">
                {proyectosContemporaneos[index].categoria}
              </span>
              <h2 className="text-2xl font-extrabold mb-4" style={{ color: "var(--color-text)" }}>
                {proyectosContemporaneos[index].titulo}
              </h2>
            </div>
            <p className="text-muted text-sm leading-relaxed mb-6">
              {proyectosContemporaneos[index].descripcion}
            </p>
          </div>
          <div className={`p-4 text-center font-medium text-xs tracking-wider ${proyectosContemporaneos[index].color}`}>
            LUBIX ENTERPRISE SOLUTIONS
          </div>
        </div>
      </section>

      {/* 2. CIFRAS ASOCIATIVAS (LOGROS INSTITUCIONALES) */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 py-10 sm:py-12 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          {[
            { numero: "12+", etiqueta: "Años de Trayectoria" },
            { numero: "500k+", etiqueta: "Transacciones Diarias" },
            { numero: "99.9%", etiqueta: "Tiempo de Actividad" },
            { numero: "45M+", etiqueta: "Fondos Movilizados" },
          ].map((stat, i) => (
            <div key={i}>
              <h3 className="text-3xl md:text-4xl font-black text-emerald-600 mb-1">{stat.numero}</h3>
              <p className="text-xs md:text-sm text-muted font-medium uppercase tracking-wider">{stat.etiqueta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PROPUESTA DE VALOR / PILARES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 py-14 sm:py-24 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black mb-4" style={{ color: "var(--color-text)" }}>
            Diferenciales que Sostienen Nuestro Éxito
          </h2>
          <p className="text-muted">
            Modelos de negocio diseñados rigurosamente para garantizar la resiliencia y el avance comercial continuo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pilares.map((pilar, i) => (
            <div 
              key={i} 
              className="p-8 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-start transition hover:border-emerald-500/50 hover:shadow-lg"
              style={{ backgroundColor: "var(--color-bg-card)" }}
            >
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl mb-6">
                {pilar.icono}
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
                {pilar.titulo}
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                {pilar.descripcion}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION FINAL */}
      <section className="max-w-5xl mx-auto px-8 py-20 w-full text-center">
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)] pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            ¿Listo para llevar tu organización al siguiente nivel?
          </h2>
          <p className="text-emerald-200/80 max-w-xl mx-auto mb-8 text-sm md:text-base">
            Únete al ecosistema Lubix Enterprise. Agenda una sesión técnica presencial u online con nuestros asesores corporativos.
          </p>
          <button 
            onClick={() => navigate("/register")}
            className="inline-block bg-white text-emerald-950 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition shadow-lg"
          >
            Contactar Consultor
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default HomeEmpresa;