import { useState, useEffect } from 'react';
import NavbarAdmin from '../components/navbar-admin';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface CompanyItem {
  id: string;
  userId: string;
  nameCompany: string;
  nit: string;
  nitDV: string;
  addressCompany: string;
  email: string;
  ownerName: string;
  ownerTell: string;
  verified: boolean;
  isActive: boolean;
  certificate: string | null;
  memberSince: string;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  tell: string;
  role: string | null;
  verified: boolean;
  isActive: boolean;
  memberSince: string;
}

interface PQRSItem {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  user_role: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

type Tab = 'resumen' | 'empresas' | 'usuarios' | 'pqrs';

export default function DashboardAdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('resumen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pqrsList, setPqrsList] = useState<PQRSItem[]>([]);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const reloadData = () =>
    Promise.all([
      api.get("/admin/dashboard/me"),
      api.get("/admin/companies"),
      api.get("/admin/users"),
      api.get("/admin/pqrs"),
    ]);

  const applyData = (s: typeof stats, c: CompanyItem[], u: UserItem[], p: PQRSItem[]) => {
    setStats(s);
    setCompanies(c);
    setUsers(u);
    setPqrsList(p);
  };

  useEffect(() => {
    reloadData()
      .then(([statsRes, companiesRes, usersRes, pqrsRes]) => {
        applyData(statsRes.data, companiesRes.data, usersRes.data, pqrsRes.data);
      })
      .catch((err) => {
        console.error("Error fetching admin data:", err);
        setError("No se pudieron cargar los datos del panel de administración.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidate = async (company: CompanyItem) => {
    setValidatingId(company.id);
    try {
      await api.patch(`/admin/companies/${company.id}/validate`);
      const [statsRes, companiesRes, usersRes, pqrsRes] = await reloadData();
      applyData(statsRes.data, companiesRes.data, usersRes.data, pqrsRes.data);
    } catch (err) {
      console.error("Error validating company:", err);
      setError("No se pudo validar la empresa.");
    } finally {
      setValidatingId(null);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    const confirmed = window.confirm(
      `¿Eliminar al usuario "${user.fullName}" (${user.email})?\n\nEsta acción no se puede deshacer. Se eliminarán también sus direcciones, pedidos y tokens asociados.`
    );
    if (!confirmed) return;

    setDeletingId(user.id);
    try {
      await api.delete(`/admin/users/${user.id}`);
      const [statsRes, companiesRes, usersRes, pqrsRes] = await reloadData();
      applyData(statsRes.data, companiesRes.data, usersRes.data, pqrsRes.data);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("No se pudo eliminar el usuario.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCompany = async (company: CompanyItem) => {
    const confirmed = window.confirm(
      `¿Eliminar la empresa "${company.nameCompany}" (${company.email})?\n\nEsta acción no se puede deshacer. Se eliminarán sus productos, pedidos y la cuenta del dueño.`
    );
    if (!confirmed) return;

    setDeletingId(company.id);
    try {
      await api.delete(`/admin/companies/${company.id}`);
      const [statsRes, companiesRes, usersRes, pqrsRes] = await reloadData();
      applyData(statsRes.data, companiesRes.data, usersRes.data, pqrsRes.data);
    } catch (err) {
      console.error("Error deleting company:", err);
      setError("No se pudo eliminar la empresa.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleResolvePQRS = async (pqrsId: string) => {
    setResolvingId(pqrsId);
    try {
      await api.patch(`/admin/pqrs/${pqrsId}/status`);
      const [statsRes, companiesRes, usersRes, pqrsRes] = await reloadData();
      applyData(statsRes.data, companiesRes.data, usersRes.data, pqrsRes.data);
    } catch (err) {
      console.error("Error resolving PQRS:", err);
      setError("No se pudo marcar la PQRS como resuelta.");
    } finally {
      setResolvingId(null);
    }
  };

  const pendingCompanies = companies.filter((c) => !c.verified);

  const kpis = [
    { title: "Usuarios registrados", value: stats.totalUsers, icon: "👤" },
    { title: "Empresas registradas", value: stats.totalCompanies, icon: "🏢" },
    { title: "Empresas por validar", value: stats.pendingCompanies, icon: "⏳" },
    { title: "Cuentas activas", value: stats.activeUsers, icon: "✅" },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'empresas', label: `Empresas (${companies.length})` },
    { id: 'usuarios', label: `Usuarios (${users.length})` },
    { id: 'pqrs', label: `PQRS (${pqrsList.length})` },
  ];

  if (loading) {
    return (
      <div className="bg-[#030712] min-h-screen text-slate-100 flex flex-col font-sans">
        <NavbarAdmin />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#030712] min-h-screen text-slate-100 flex flex-col font-sans">
      <NavbarAdmin />

      <main className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Panel de Administración</h1>
            <p className="text-sm text-slate-400 mt-1">Gestión de usuarios y empresas registradas en el sistema.</p>
          </div>
          <span className="text-sm text-slate-400">
            {user?.name ? `Sesión: ${user.name}` : ""}
          </span>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-900/50 text-rose-300 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-slate-800 text-gray-400 hover:text-gray-200 hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'resumen' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
                  <span className="text-xs text-slate-400 block uppercase font-mono tracking-wider">{kpi.title}</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {kpi.value.toLocaleString('es-CO')}
                    </span>
                    <span className="text-lg">{kpi.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Empresas por validar ({pendingCompanies.length})</h2>
                <button
                  onClick={() => setTab('empresas')}
                  className="text-sm text-green-400 hover:text-green-300 transition"
                >
                  Ver todas
                </button>
              </div>

              {pendingCompanies.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <span className="block text-3xl mb-2">✅</span>
                  <p className="font-medium">No hay empresas pendientes de validación</p>
                  <p className="text-sm mt-1">Cuando una empresa se registre, aparecerá aquí para que la valides.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{company.nameCompany}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                            Pendiente
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm truncate mt-1">{company.email}</p>
                        <p className="text-gray-500 text-xs mt-1">NIT: {company.nit}-{company.nitDV} · {company.addressCompany}</p>
                      </div>
                      <button
                        onClick={() => handleValidate(company)}
                        disabled={validatingId === company.id}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition disabled:opacity-50"
                      >
                        {validatingId === company.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Validando...
                          </>
                        ) : (
                          "Validar empresa"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'empresas' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Empresas registradas ({companies.length})</h2>

            {companies.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <span className="block text-3xl mb-2">🏢</span>
                <p className="text-lg font-medium">No hay empresas registradas</p>
                <p className="text-sm mt-1">Las empresas que se registren aparecerán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="py-3 pr-4">Empresa</th>
                      <th className="py-3 pr-4">NIT</th>
                      <th className="py-3 pr-4">Contacto</th>
                      <th className="py-3 pr-4">Registro</th>
                      <th className="py-3">Estado</th>
                      <th className="py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b border-slate-800 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="text-white font-medium">{company.nameCompany}</p>
                          <p className="text-gray-500 text-xs">{company.addressCompany}</p>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{company.nit}-{company.nitDV}</td>
                        <td className="py-3 pr-4">
                          <p className="text-gray-300">{company.email}</p>
                          <p className="text-gray-500 text-xs">{company.ownerName} · {company.ownerTell}</p>
                        </td>
                        <td className="py-3 pr-4 text-gray-400">
                          {new Date(company.memberSince).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3">
                          {company.verified ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap">
                              Validada
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleDeleteCompany(company)}
                            disabled={deletingId === company.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition disabled:opacity-50 whitespace-nowrap"
                          >
                            {deletingId === company.id ? (
                              <span className="flex items-center gap-1.5">
                                <div className="w-3 h-3 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin"></div>
                                Eliminando...
                              </span>
                            ) : (
                              "Eliminar"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'usuarios' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Usuarios registrados ({users.length})</h2>

            {users.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <span className="block text-3xl mb-2">👤</span>
                <p className="text-lg font-medium">No hay usuarios registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="py-3 pr-4">Usuario</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Teléfono</th>
                      <th className="py-3 pr-4">Rol</th>
                      <th className="py-3 pr-4">Registro</th>
                      <th className="py-3 pr-4">Estado</th>
                      <th className="py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-800 last:border-0">
                        <td className="py-3 pr-4 text-white font-medium">{u.fullName}</td>
                        <td className="py-3 pr-4 text-gray-300">{u.email}</td>
                        <td className="py-3 pr-4 text-gray-400">{u.tell}</td>
                        <td className="py-3 pr-4">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-400">
                          {new Date(u.memberSince).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3">
                          {u.verified ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap">
                              Activo
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                              Sin verificar
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={deletingId === u.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition disabled:opacity-50 whitespace-nowrap"
                          >
                            {deletingId === u.id ? (
                              <span className="flex items-center gap-1.5">
                                <div className="w-3 h-3 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin"></div>
                                Eliminando...
                              </span>
                            ) : (
                              "Eliminar"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'pqrs' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6">PQRS recibidas ({pqrsList.length})</h2>

            {pqrsList.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <span className="block text-3xl mb-2">📋</span>
                <p className="text-lg font-medium">No hay PQRS registradas</p>
                <p className="text-sm mt-1">Las peticiones, quejas, reclamos y sugerencias aparecerán aquí.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pqrsList.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-xl p-4 transition-colors ${
                      item.status === 'resolved'
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            item.type === 'peticion' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                            item.type === 'queja' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                            item.type === 'reclamo' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                            item.type === 'sugerencia' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                            'bg-gray-500/10 border-gray-500/30 text-gray-400'
                          }`}>
                            {item.type === 'peticion' ? 'Petición' :
                             item.type === 'queja' ? 'Queja' :
                             item.type === 'reclamo' ? 'Reclamo' :
                             item.type === 'sugerencia' ? 'Sugerencia' :
                             item.type === 'eliminacion' ? 'Eliminación' : item.type}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            item.status === 'pending'
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                              : 'bg-green-500/10 border-green-500/30 text-green-400'
                          }`}>
                            {item.status === 'pending' ? 'Pendiente' : 'Resuelta'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-gray-300 border border-slate-600 capitalize">
                            {item.user_role === 'empresa' ? 'Empresa' : 'Usuario'}
                          </span>
                        </div>
                        <h3 className="text-white font-semibold text-sm mb-1">{item.subject}</h3>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{item.user_name} ({item.user_email})</span>
                          <span>{new Date(item.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                      </div>
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleResolvePQRS(item.id)}
                          disabled={resolvingId === item.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                          {resolvingId === item.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Resolviendo...
                            </>
                          ) : (
                            'Marcar resuelta'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}