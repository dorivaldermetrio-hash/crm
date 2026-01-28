'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CriarAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CriarAgendamentoModal({
  isOpen,
  onClose,
  onSuccess,
}: CriarAgendamentoModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    notas: '',
    data: '',
    horarioInicio: '',
    duracao: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validação básica
      if (!formData.nome || !formData.data || !formData.horarioInicio || !formData.duracao) {
        setError('Por favor, preencha todos os campos obrigatórios');
        setSaving(false);
        return;
      }

      // Validação do formato de duração (horas:minutos)
      const duracaoRegex = /^\d+:\d{2}$/;
      if (!duracaoRegex.test(formData.duracao)) {
        setError('Duração deve estar no formato horas:minutos (ex: 3:30)');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          notas: formData.notas,
          data: formData.data,
          horarioInicio: formData.horarioInicio,
          duracao: formData.duracao,
          status: 'agendado',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Limpa o formulário
        setFormData({
          nome: '',
          notas: '',
          data: '',
          horarioInicio: '',
          duracao: '',
        });
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Erro ao criar agendamento');
      }
    } catch (err) {
      console.error('Erro ao criar agendamento:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Criar Agendamento</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Digite o nome do agendamento"
            />
          </div>

          {/* Data */}
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

          {/* Horário de Início */}
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

          {/* Duração */}
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

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notas
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Adicione notas sobre o agendamento (opcional)"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Gerar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

