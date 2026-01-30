'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

interface Template {
  id: string;
  nome: string;
  conteudo: string;
  createdAt?: string;
}

export default function TemplatesPage() {
  const { isOpen, isMobile } = useSidebar();
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editConteudo, setEditConteudo] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getMainMargin = () => {
    if (isMobile) {
      // No mobile, quando fechado mostra w-20 (reduzido), quando aberto tem overlay
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20'; // Desktop: 256px quando aberto, 80px quando fechado
  };

  // Buscar templates ao carregar a página
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates-ws');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
    setNome('');
    setConteudo('');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setNome('');
    setConteudo('');
    setSuccessMessage('');
  };

  const handleSave = async () => {
    if (!nome.trim() || !conteudo.trim()) {
      setSuccessMessage('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage('');
      const response = await fetch('/api/templates-ws', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          conteudo: conteudo.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Template salvo com sucesso!');
        // Atualiza a lista de templates
        fetchTemplates();
        // Fecha o modal após 1.5 segundos
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        setSuccessMessage('Erro ao salvar template: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao salvar template:', err);
      setSuccessMessage('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (template: Template) => {
    setEditingTemplate(template);
    setEditNome(template.nome);
    setEditConteudo(template.conteudo);
    setEditModalOpen(true);
    setEditSuccessMessage('');
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingTemplate(null);
    setEditNome('');
    setEditConteudo('');
    setEditSuccessMessage('');
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !editNome.trim() || !editConteudo.trim()) {
      setEditSuccessMessage('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setUpdating(true);
      setEditSuccessMessage('');
      const response = await fetch(`/api/templates-ws/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: editNome.trim(),
          conteudo: editConteudo.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditSuccessMessage('Template atualizado com sucesso!');
        // Atualiza a lista de templates
        fetchTemplates();
        // Fecha o modal após 1.5 segundos
        setTimeout(() => {
          handleCloseEditModal();
          setExpandedId(null);
        }, 1500);
      } else {
        setEditSuccessMessage('Erro ao atualizar template: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao atualizar template:', err);
      setEditSuccessMessage('Erro ao conectar com o servidor');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenDeleteModal = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setTemplateToDelete(null);
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/templates-ws/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Atualiza a lista de templates
        fetchTemplates();
        handleCloseDeleteModal();
        setExpandedId(null);
      } else {
        alert('Erro ao remover template: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao remover template:', err);
      alert('Erro ao conectar com o servidor');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Templates
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-4">
              Gerencie seus templates de mensagens
            </p>
            {/* Botão Adicionar Templates */}
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Adicionar Templates
            </button>
          </div>

          {/* Lista de Templates */}
          <div className="mb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-600 dark:text-slate-400">Carregando templates...</p>
                </div>
              </div>
            ) : templates.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Nenhum template encontrado
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Crie seu primeiro template usando o botão acima
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden transition-all duration-300"
                  >
                    {/* Header do Acordeon */}
                    <button
                      onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white text-left">
                        {template.nome}
                      </h3>
                      <svg
                        className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${
                          expandedId === template.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Conteúdo do Acordeon */}
                    {expandedId === template.id && (
                      <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="pt-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-4">
                            {template.conteudo}
                          </p>
                          {/* Botões Editar e Remover */}
                          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => handleOpenEditModal(template)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(template)}
                              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg text-sm font-medium hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Adicionar Template */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Adicionar Template
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Mensagem de Sucesso/Erro */}
              {successMessage && (
                <div
                  className={`p-4 rounded-lg border ${
                    successMessage.includes('sucesso')
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  }`}
                >
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              )}

              {/* Nome do Template */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nome do Template
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite o nome do template"
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Conteúdo do Template */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Conteúdo do Template
                </label>
                <textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Digite o conteúdo do template"
                  rows={6}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !nome.trim() || !conteudo.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Template */}
      {editModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Editar Template
              </h3>
              <button
                onClick={handleCloseEditModal}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Mensagem de Sucesso/Erro */}
              {editSuccessMessage && (
                <div
                  className={`p-4 rounded-lg border ${
                    editSuccessMessage.includes('sucesso')
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  }`}
                >
                  <p className="text-sm font-medium">{editSuccessMessage}</p>
                </div>
              )}

              {/* Nome do Template */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nome do Template
                </label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Digite o nome do template"
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Conteúdo do Template */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Conteúdo do Template
                </label>
                <textarea
                  value={editConteudo}
                  onChange={(e) => setEditConteudo(e.target.value)}
                  placeholder="Digite o conteúdo do template"
                  rows={6}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCloseEditModal}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating || !editNome.trim() || !editConteudo.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção */}
      {deleteModalOpen && templateToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Confirmar Remoção
              </h3>
              <button
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                Tem certeza que deseja remover o template <strong>"{templateToDelete.nome}"</strong>?
                Esta ação não pode ser desfeita.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Removendo...
                  </>
                ) : (
                  'Remover'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

