import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavbarAuto from '../components/navbar-auto';
import api from '../api/axios';
import { errorDetailMessage } from '../utils/errors';
import {
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface PQRSItem {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  user_role: string;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  peticion: 'Petición',
  queja: 'Queja',
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
  eliminacion: 'Solicitud de Eliminación',
};

const typeIcons: Record<string, React.ReactNode> = {
  peticion: <QuestionMarkCircleIcon className="w-5 h-5 text-blue-400" />,
  queja: <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />,
  reclamo: <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-orange-400" />,
  sugerencia: <LightBulbIcon className="w-5 h-5 text-yellow-400" />,
  eliminacion: <TrashIcon className="w-5 h-5 text-red-400" />,
};

const typeColors: Record<string, string> = {
  peticion: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  queja: 'bg-red-500/10 border-red-500/30 text-red-400',
  reclamo: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  sugerencia: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  eliminacion: 'bg-red-500/10 border-red-500/30 text-red-400',
};

export default function PQRSPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pqrsList, setPqrsList] = useState<PQRSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const [form, setForm] = useState({
    type: searchParams.get('type') || 'queja',
    subject: searchParams.get('subject') || '',
    description: '',
  });

  const isDeleteRequest = searchParams.get('type') === 'eliminacion';

  useEffect(() => {
    loadPQRS();
  }, []);

  const loadPQRS = async () => {
    try {
      const res = await api.get('/pqrs');
      setPqrsList(res.data || []);
    } catch (err) {
      console.error('Error loading PQRS:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;

    setSending(true);
    try {
      await api.post('/pqrs', {
        type: form.type,
        subject: form.subject,
        description: form.description,
      });
      setMessage('Tu solicitud ha sido enviada correctamente. El administrador la revisará pronto.');
      setMessageType('success');
      setForm({ type: 'queja', subject: '', description: '' });
      setShowForm(false);
      loadPQRS();
      setTimeout(() => { setMessage(''); setMessageType(''); }, 4000);
    } catch (err: any) {
      setMessage(errorDetailMessage(err, 'Error al enviar la solicitud'));
      setMessageType('error');
      setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);
    } finally {
      setSending(false);
    }
  };

  const statusLabel = (status: string) => {
    return status === 'pending' ? 'Pendiente' : 'Resuelta';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <NavbarAuto />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavbarAuto />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {message && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg border ${
            messageType === 'success'
              ? 'bg-green-500/20 border-green-500/30 text-green-300'
              : 'bg-red-500/20 border-red-500/30 text-red-300'
          }`}>
            {message}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">PQRS</h1>
            <p className="text-gray-400 text-sm mt-1">Peticiones, Quejas, Reclamos y Sugerencias</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl font-medium transition-colors border border-slate-700"
            >
              Volver
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Nueva solicitud
            </button>
          </div>
        </div>

        {isDeleteRequest && !showForm && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              <h2 className="text-lg font-bold text-red-300">Solicitud de Eliminación de Cuenta</h2>
            </div>
            <p className="text-red-200/80 text-sm mb-4">
              Para eliminar tu cuenta, por favor indica el motivo en la sección de PQRS. Tu solicitud será revisada por el administrador.
            </p>
            <button
              onClick={() => {
                setForm(prev => ({ ...prev, type: 'eliminacion', subject: 'Solicitud de eliminación de cuenta' }));
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all"
            >
              <TrashIcon className="w-4 h-4" />
              Solicitar eliminación de cuenta
            </button>
          </div>
        )}

        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {isDeleteRequest ? 'Solicitar eliminación de cuenta' : 'Nueva solicitud PQRS'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de solicitud</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'peticion', label: 'Petición', icon: <QuestionMarkCircleIcon className="w-4 h-4" /> },
                    { value: 'queja', label: 'Queja', icon: <ExclamationTriangleIcon className="w-4 h-4" /> },
                    { value: 'reclamo', label: 'Reclamo', icon: <ChatBubbleLeftEllipsisIcon className="w-4 h-4" /> },
                    { value: 'sugerencia', label: 'Sugerencia', icon: <LightBulbIcon className="w-4 h-4" /> },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, type: opt.value }))}
                      disabled={isDeleteRequest}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all ${
                        form.type === opt.value
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-800 text-gray-400 hover:bg-slate-700 border border-slate-700'
                      } ${isDeleteRequest ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Asunto</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Breve descripción del motivo"
                  disabled={isDeleteRequest}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 placeholder-gray-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {isDeleteRequest ? '¿Por qué deseas eliminar tu cuenta?' : 'Descripción detallada'}
                </label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={isDeleteRequest
                    ? 'Explica el motivo por el cual deseas eliminar tu cuenta...'
                    : 'Describe tu petición, queja, reclamo o sugerencia en detalle...'
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 placeholder-gray-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl font-medium transition-colors border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending || !form.subject.trim() || !form.description.trim()}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Enviar solicitud
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Mis solicitudes ({pqrsList.length})</h2>

          {pqrsList.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ChatBubbleLeftEllipsisIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No tienes solicitudes aún</p>
              <p className="text-sm mt-1">Envía una petición, queja, reclamo o sugerencia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pqrsList.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${typeColors[item.type] || 'bg-slate-800 border-slate-700'}`}>
                        {typeIcons[item.type] || <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeColors[item.type] || 'bg-slate-800 border-slate-700 text-gray-400'}`}>
                            {typeLabels[item.type] || item.type}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            item.status === 'pending'
                              ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                              : 'bg-green-500/10 border border-green-500/30 text-green-400'
                          }`}>
                            {item.status === 'pending' ? <ClockIcon className="w-3 h-3" /> : <CheckCircleIcon className="w-3 h-3" />}
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <p className="text-white font-semibold text-sm mb-1">{item.subject}</p>
                        <p className="text-gray-400 text-xs line-clamp-2">{item.description}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(item.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10">
          <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-2xl p-8 text-center">
            <ChatBubbleLeftEllipsisIcon className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold text-white mb-2">¿Tienes algo que decirnos?</h3>
            <p className="text-gray-400 text-sm mb-5 max-w-md mx-auto">
              Tu opinión nos ayuda a mejorar. No dudes en enviar cualquier petición, queja, reclamo o sugerencia.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Enviar mi solicitud ahora
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
