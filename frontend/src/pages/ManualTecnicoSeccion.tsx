import { Link, useParams } from "react-router-dom";
import { manualSections } from "./ManualTecnico";
import "./ManualTecnico.css";

export default function ManualTecnicoSeccion() {
  const { section: sectionSlug } = useParams();
  const section = manualSections.find((item) => item.slug === sectionSlug);

  return (
    <main className="manual-shell">
      <section className="manual-panel manual-section" aria-labelledby="section-title">
        <h1 className="manual-title" id="section-title">
          {section?.title ?? "Sección no encontrada"}
        </h1>
        <p className="manual-placeholder">
          {section ? "Contenido pendiente de desarrollo." : "La sección solicitada no existe."}
        </p>
        <Link className="manual-back" to="/manual-tecnico">
          Volver al menú técnico
        </Link>
      </section>
    </main>
  );
}