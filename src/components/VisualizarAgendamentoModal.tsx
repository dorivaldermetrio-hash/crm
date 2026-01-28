'use client';

import { useState, useEffect } from 'react';
import { X, Pencil } from 'lucide-react';

interface VisualizarAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentoId: string | null;
  onSuccess: () => void;
}

export default function VisualizarAgendamentoModal({
  isOpen,
  onClose,
  agendamentoId,
  onSuccess,
}: VisualizarAgendamentoModalProps) {
  const [agendamento, setAgendamento] = useState<any>(null);
  const [status, setStatus] = useState<string>('Agendado');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    notas: '',
    data: '',
    horarioInicio: '',
    duracao: '',
    status: 'Agendado',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Carrega o agendamento quando o modal abre
  useEffect(() => {
    if (isOpen && agendamentoId) {
      fetchAgendamento();
    } else {
      // Limpa os dados quando o modal fecha
      setAgendamento(null);
      setStatus('Agendado');
      setIsEditing(false);
      setFormData({
        nome: '',
        notas: '',
        data: '',
        horarioInicio: '',
        duracao: '',
        status: 'Agendado',
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, agendamentoId]);

  const fetchAgendamento = async () => {
    if (!agendamentoId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/agendamentos/${agendamentoId}`);
      const result = await response.json();

      if (result.success && result.agendamento) {
        setAgendamento(result.agendamento);
        setStatus(result.agendamento.status || 'Agendado');
        setFormData({
          nome: result.agendamento.nome || '',
          notas: result.agendamento.notas || '',
          data: result.agendamento.data || '',
          horarioInicio: result.agendamento.horarioInicio || '',
          duracao: result.agendamento.duracao || '',
          status: result.agendamento.status || 'Agendado',
        });
      } else {
        setError(result.error || 'Erro ao carregar agendamento');
      }
    } catch (err) {
      console.error('Erro ao carregar agendamento:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarStatus = async () => {
    if (!agendamentoId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/agendamentos/${agendamentoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Erro ao atualizar status');
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarEdicao = async () => {
    if (!agendamentoId) return;

    // Validação básica
    if (!formData.nome || !formData.data || !formData.horarioInicio || !formData.duracao) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validação do formato de duração
    const duracaoRegex = /^\d+:\d{2}$/;
    if (!duracaoRegex.test(formData.duracao)) {
      setError('Duração deve estar no formato horas:minutos (ex: 3:30)');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/agendamentos/${agendamentoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          notas: formData.notas,
          data: formData.data,
          horarioInicio: formData.horarioInicio,
          duracao: formData.duracao,
          status: formData.status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setIsEditing(false);
        // Atualiza o agendamento local
        setAgendamento(result.agendamento);
        setStatus(result.agendamento.status || 'Agendado');
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 1500);
      } else {
        setError(result.error || 'Erro ao atualizar agendamento');
      }
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[700px] bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Editar Agendamento' : 'Detalhes do Agendamento'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                title="Editar"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error && !agendamento ? (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : agendamento ? (
            <>
              {/* Nome do Evento */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome do Evento {isEditing && <span className="text-red-400">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Digite o nome do agendamento"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white">
                    {agendamento.nome}
                  </div>
                )}
              </div>

              {/* Data - Só aparece em modo de edição */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {/* Horário de Início - Só aparece em modo de edição */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Horário de Início <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    name="horarioInicio"
                    value={formData.horarioInicio}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {/* Duração - Só aparece em modo de edição */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duração (horas:minutos) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="duracao"
                    value={formData.duracao}
                    onChange={handleChange}
                    required
                    pattern="^\d+:\d{2}$"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ex: 3:30 (3 horas e 30 minutos)"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Formato: horas:minutos (ex: 3:30 para 3 horas e 30 minutos)
                  </p>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notas
                </label>
                {isEditing ? (
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Adicione notas sobre o agendamento (opcional)"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white min-h-[100px]">
                    {agendamento.notas || <span className="text-slate-500">Sem notas</span>}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={isEditing ? formData.status : status}
                  onChange={(e) => {
                    if (isEditing) {
                      setFormData({ ...formData, status: e.target.value });
                    } else {
                      setStatus(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="Agendado">Agendado</option>
                  <option value="Realizado">Realizado</option>
                  <option value="Faltou">Faltou</option>
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
                  <p className="text-sm text-green-400">Status atualizado com sucesso!</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700 flex-shrink-0">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        // Restaura os dados originais
                        setFormData({
                          nome: agendamento.nome || '',
                          notas: agendamento.notas || '',
                          data: agendamento.data || '',
                          horarioInicio: agendamento.horarioInicio || '',
                          duracao: agendamento.duracao || '',
                          status: agendamento.status || 'Agendado',
                        });
                        setError(null);
                      }}
                      className="px-6 py-2.5 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSalvarEdicao}
                      disabled={saving}
                      className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={handleSalvarStatus}
                      disabled={saving || status === (agendamento.status || 'Agendado')}
                      className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Salvando...' : 'Salvar Status'}
                    </button>
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

