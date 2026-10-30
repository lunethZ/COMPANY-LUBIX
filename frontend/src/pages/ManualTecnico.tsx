import { Link } from "react-router-dom";
import "./ManualTecnico.css";

export const manualSections = [
  { slug: "alcance", title: "Alcance", full: true },
  { slug: "descripcion-procesos", title: "Descripción de procesos" },
  { slug: "descripcion-plataforma", title: "Descripción de la plataforma" },
  { slug: "diagramas-uml", title: "Diagramas UML" },
  { slug: "documentacion-codigo-fuente", title: "Documentación del código fuente" },
  { slug: "modelo-relacional-base-datos", title: "Modelo relacional de la base de datos" },
  {
    slug: "acuerdos-niveles-servicio",
    title: "Descripción de los acuerdos de niveles de servicios",
    tall: true,
  },
  { slug: "administracion-usuarios", title: "Administración de usuarios", full: true },
] as const;

export default function ManualTecnico() {
  return (
    <main className="manual-shell">
      <section className="manual-panel" aria-labelledby="manual-title">
        <h1 className="manual-title" id="manual-title">
          MANUAL TÉCNICO DE LA APLICACIÓN
        </h1>
        <nav className="manual-grid" aria-label="Secciones del manual técnico">
          {manualSections.map((section) => (
            <Link
              className={[
                "manual-link",
                "full" in section && section.full ? "manual-link--full" : "",
                "tall" in section && section.tall ? "manual-link--tall" : "",
              ].filter(Boolean).join(" ")}
              key={section.slug}
              to={`/manual-tecnico/${section.slug}`}
            >
              {section.title}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}