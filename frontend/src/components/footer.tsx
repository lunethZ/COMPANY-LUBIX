import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-gray-300 mt-20 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-green-500 text-lg font-bold">Lubix</h3>
            <span className="text-xs">Tu marketplace de confianza para compras online.</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/" className="hover:text-green-500">Inicio</Link>
            <Link to="/buscar" className="hover:text-green-500">Buscar productos</Link>
            <Link to="/pqrs" className="hover:text-green-500">PQRS</Link>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 mt-4 pt-4 text-center text-xs">
          <p>© 2026 Lubix. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;