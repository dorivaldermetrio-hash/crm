'use client';

import { useState } from 'react';
import { X, Star, Archive, Tag, FileText, CheckCircle2, User, Phone, Plus } from 'lucide-react';

interface CriarContatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const statusOptions: Array<{ value: 'Aberta' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Perdida'; label: string; color: string }> = [
  { value: 'Aberta', label: 'Aberta', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'Qualificação', label: 'Qualificação', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'Proposta', label: 'Proposta', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'Negociação', label: 'Negociação', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' },
  { value: 'Fechamento', label: 'Fechamento', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' },
  { value: 'Perdida', label: 'Perdida', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' },
];

const tagOptions: Array<{ value: 'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'; label: string; color: string }> = [
  { value: 'Urgente', label: 'Urgente', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'Importante', label: 'Importante', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'Seguimento', label: 'Seguimento', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'Cliente', label: 'Cliente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'Prospecto', label: 'Prospecto', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
];

export default function CriarContatoModal({
  isOpen,
  onClose,
  onSuccess,
}: CriarContatoModalProps) {
  const [contato, setContato] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [status, setStatus] = useState<'Aberta' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Perdida'>('Aberta');
  const [tags, setTags] = useState<Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'>>([]);
  const [nota, setNota] = useState('');
  const [favorito, setFavorito] = useState(false);
  const [arquivar, setArquivar] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const resetForm = () => {
    setContato('');
    setContatoNome('');
    setStatus('Aberta');
    setTags([]);
    setNota('');
    setFavorito(false);
    setArquivar(false);
    setErro(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Função para formatar telefone: (xx) xxxx-xxxx ou (xx) xxxxx-xxxx
  const formatarTelefone = (valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Limita a 10 ou 11 dígitos (DDD + 8 ou 9 dígitos)
    const numerosLimitados = apenasNumeros.slice(0, 11);
    
    if (numerosLimitados.length === 0) return '';
    
    // Se tiver 2 ou mais dígitos, formata com DDD
    if (numerosLimitados.length <= 2) {
      return `(${numerosLimitados}`;
    }
    
    // Se tiver 3 a 6 dígitos: (xx) xxxx
    if (numerosLimitados.length <= 6) {
      return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2)}`;
    }
    
    // Se tiver 7 a 10 dígitos: (xx) xxxx-xxxx
    if (numerosLimitados.length <= 10) {
      return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 6)}-${numerosLimitados.slice(6)}`;
    }
    
    // Se tiver 11 dígitos: (xx) xxxxx-xxxx
    return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 7)}-${numerosLimitados.slice(7)}`;
  };

  // Função para remover formatação e adicionar "55" no início
  const prepararNumeroParaSalvar = (valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Adiciona "55" no início se ainda não tiver
    if (apenasNumeros.length > 0 && !apenasNumeros.startsWith('55')) {
      return `55${apenasNumeros}`;
    }
    
    return apenasNumeros || '';
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarTelefone(e.target.value);
    setContato(valorFormatado);
    setErro(null);
  };

  const toggleTag = (tag: 'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto') => {
    setTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleCriar = async () => {
    const numeroLimpo = prepararNumeroParaSalvar(contato);
    
    // Valida: 55 (2) + DDD (2) + número (8 ou 9) = 12 ou 13 dígitos
    if (!numeroLimpo || numeroLimpo.length < 12 || numeroLimpo.length > 13) {
      setErro('Por favor, informe um número de telefone válido com DDD + 8 ou 9 dígitos');
      return;
    }
    
    // Valida se tem pelo menos DDD (2 dígitos após o 55)
    const numeroSemCodigoPais = numeroLimpo.slice(2);
    if (numeroSemCodigoPais.length < 10 || numeroSemCodigoPais.length > 11) {
      setErro('Número inválido. Deve ter DDD (2 dígitos) + 8 ou 9 dígitos');
      return;
    }

    setCriando(true);
    setErro(null);

    try {
      const dadosParaEnviar = {
        contato: numeroLimpo,
        contatoNome: contatoNome.trim() || '',
        status,
        tags: tags || [],
        nota: nota || '',
        favorito: favorito || false,
        arquivar: arquivar || false,
      };

      const response = await fetch('/api/contatos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        onSuccess();
        onClose();
      } else {
        setErro(data.error || 'Erro ao criar contato');
      }
    } catch (error) {
      console.error('❌ Erro ao criar contato:', error);
      setErro('Erro ao conectar com o servidor');
    } finally {
      setCriando(false);
    }
  };

  if (!isOpen) return null;

  const primeiraLetra = contatoNome
    ? contatoNome.charAt(0).toUpperCase()
    : contato
    ? contato.charAt(contato.length - 1)
    : '?';

  // Cores do avatar baseadas na primeira letra
  const cores = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-red-500 to-red-600',
  ];
  const corAvatar = cores[primeiraLetra.charCodeAt(0) % cores.length];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fade-in_200ms_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-[slide-in-from-bottom-4_300ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-4">
            <div className={`${corAvatar} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl relative`}>
              {primeiraLetra}
              {favorito && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-yellow-600 text-yellow-600" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Adicionar Contato
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Preencha os dados do novo contato
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/80 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-200 hover:scale-110"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Erro */}
          {erro && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{erro}</p>
            </div>
          )}

          {/* Número do Contato (Obrigatório) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <Phone className="w-4 h-4 text-blue-500" />
              Número do Contato <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
                55
              </div>
              <input
                type="text"
                value={contato}
                onChange={handleTelefoneChange}
                placeholder="(11) 99999-9999"
                maxLength={15} // (xx) xxxxx-xxxx = 15 caracteres
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              O código do país (55) será adicionado automaticamente
            </p>
          </div>

          {/* Nome do Contato */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <User className="w-4 h-4 text-blue-500" />
              Nome do Contato
            </label>
            <input
              type="text"
              value={contatoNome}
              onChange={(e) => setContatoNome(e.target.value)}
              placeholder="Digite o nome do contato..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    status === option.value
                      ? `${option.color} ring-2 ring-offset-2 ring-current shadow-md scale-105`
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 hover:scale-105'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <Tag className="w-4 h-4 text-purple-500" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((option) => {
                const isSelected = tags.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleTag(option.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? `${option.color} ring-2 ring-offset-2 ring-current shadow-md scale-105`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 hover:scale-105'
                    }`}
                  >
                    {option.label}
                    {isSelected && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorito e Arquivar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setFavorito(!favorito)}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                favorito
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 hover:border-yellow-300 dark:hover:border-yellow-700 bg-white dark:bg-slate-700'
              }`}
            >
              <Star
                className={`w-5 h-5 transition-all duration-200 ${
                  favorito
                    ? 'fill-yellow-400 text-yellow-400 scale-110'
                    : 'text-slate-400'
                }`}
              />
              <span className="font-medium text-slate-900 dark:text-white">
                {favorito ? 'Favorito' : 'Marcar como Favorito'}
              </span>
            </button>

            <button
              onClick={() => setArquivar(!arquivar)}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                arquivar
                  ? 'border-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-700'
              }`}
            >
              <Archive
                className={`w-5 h-5 transition-all duration-200 ${
                  arquivar ? 'text-slate-700 dark:text-slate-300 scale-110' : 'text-slate-400'
                }`}
              />
              <span className="font-medium text-slate-900 dark:text-white">
                {arquivar ? 'Arquivado' : 'Arquivar'}
              </span>
            </button>
          </div>

          {/* Nota */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <FileText className="w-4 h-4 text-indigo-500" />
              Nota
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Adicione uma nota sobre este contato..."
              rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
            disabled={criando}
          >
            Cancelar
          </button>
          <button
            onClick={handleCriar}
            disabled={criando || !contato.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-2"
          >
            {criando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Criar Contato
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

