'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, Mail } from 'lucide-react';

interface EmailResult {
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

interface ContatoEmail {
  id: string;
  nome: string;
  email: string;
}

interface EmailCampaignProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  contatos: ContatoEmail[];
  message: string;
  subject?: string;
}

export default function EmailCampaignProgressModal({
  isOpen,
  onClose,
  contatos,
  message,
  subject,
}: EmailCampaignProgressModalProps) {
  const [results, setResults] = useState<EmailResult[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contatos.length > 0 && message.trim()) {
      sendCampaign();
    }
  }, [isOpen]);

  const sendCampaign = async () => {
    setSending(true);
    setCompleted(false);
    setError(null);
    setResults([]);
    setCurrentEmail('');

    const emailResults: EmailResult[] = [];

    try {
      // Envia um email por vez para ter progresso real
      for (let i = 0; i < contatos.length; i++) {
        const contato = contatos[i];
        setCurrentEmail(contato.email);

        try {
          const response = await fetch('/api/email/send-single', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: contato.email,
              nome: contato.nome,
              subject: subject || 'Campanha de Email',
              message,
            }),
          });

          const data = await response.json();

          if (data.success) {
            emailResults.push({
              email: contato.email,
              success: true,
              messageId: data.messageId,
            });
          } else {
            emailResults.push({
              email: contato.email,
              success: false,
              error: data.error || 'Erro ao enviar email',
            });
          }
        } catch (err) {
          emailResults.push({
            email: contato.email,
            success: false,
            error: 'Erro ao conectar com o servidor',
          });
        }

        // Atualiza os resultados para mostrar progresso
        setResults([...emailResults]);
      }

      setCompleted(true);
    } catch (err) {
      console.error('Erro ao enviar campanha:', err);
      setError('Erro ao enviar campanha');
    } finally {
      setSending(false);
      setCurrentEmail('');
    }
  };

  if (!isOpen) return null;

  const progress = contatos.length > 0 ? (results.length / contatos.length) * 100 : 0;
  const successCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Enviando Campanha de Email
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {completed
                ? `Envio concluído: ${successCount} sucesso, ${errorCount} erros`
                : `Enviando para ${contatos.length} contato${contatos.length !== 1 ? 's' : ''}...`}
            </p>
          </div>
          {completed && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Barra de Progresso */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Progresso
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  completed
                    ? errorCount > 0
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-600 dark:text-slate-400">
              <span>
                {results.length} de {contatos.length} enviados
              </span>
              {sending && currentEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 animate-pulse" />
                  Enviando para: {currentEmail}
                </span>
              )}
            </div>
          </div>

          {/* Erro Geral */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Lista de Resultados */}
          <div className="max-h-96 overflow-y-auto scrollbar-elegant space-y-2">
            {contatos.map((contato, index) => {
              const result = results[index];
              const isProcessing = !result && sending;
              const isSuccess = result?.success;
              const isError = result && !result.success;

              return (
                <div
                  key={contato.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isProcessing
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : isSuccess
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : isError
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Ícone de Status */}
                  <div className="flex-shrink-0">
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : isError ? (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-full" />
                    )}
                  </div>

                  {/* Email e Status */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {contato.nome} ({contato.email})
                    </p>
                    {result && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {isSuccess
                          ? `Enviado com sucesso`
                          : `Erro: ${result.error || 'Erro desconhecido'}`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {completed && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

