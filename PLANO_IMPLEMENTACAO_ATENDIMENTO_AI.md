# Plano de Implementação - Atendimento AI Estruturado

## 📋 Análise da Ideia

### ✅ É Possível?
**SIM!** A implementação é totalmente viável e bem estruturada. Todos os componentes necessários já existem no projeto:

1. ✅ Modelo `AtendimentoAI` existe
2. ✅ Modelo `Contato` com campo `status` existe
3. ✅ Coleção `mensagens` com histórico completo existe
4. ✅ Integração com Ollama já funciona
5. ✅ Estrutura de banco de dados está pronta

### 🎯 Objetivo
Criar um sistema de atendimento AI que:
- Usa prompts estruturados baseados no status do contato
- Analisa a conversa e sugere mudanças de status
- Retorna respostas contextuais e status sugerido em JSON
- Mantém histórico completo para contexto

---

## 🏗️ Arquitetura da Solução

### Estrutura de Arquivos

```
src/lib/utils/
├── generatePrompt.ts          # NOVO: Geração do prompt estruturado
├── ollama.ts                  # MODIFICAR: Suporte a resposta JSON
└── saveSentMessage.ts         # JÁ EXISTE: Salvar mensagens enviadas

src/app/api/webhook/
└── route.ts                   # MODIFICAR: Usar novo sistema de prompt
```

---

## 📝 Componentes a Implementar

### 1. **Arquivo: `src/lib/utils/generatePrompt.ts`** (NOVO)

**Responsabilidades:**
- Buscar objeto `AtendimentoAI` do banco
- Buscar objeto `Contato` com status atual
- Buscar histórico de mensagens (últimas 10, mais recente primeiro)
- Montar prompt estruturado seguindo o formato especificado

**Funções principais:**

```typescript
interface GeneratePromptParams {
  contatoId: string;
  mensagemRecebida: string;
}

interface PromptResult {
  prompt: string;
  statusAtual: string;
}

export async function generatePrompt(params: GeneratePromptParams): Promise<PromptResult>
```

**Fluxo:**
1. Buscar `AtendimentoAI.findOne()` - obtém configuração única
2. Buscar `Contato.findById(contatoId)` - obtém status atual
3. Buscar `Mensagem.findOne({ contatoID: contatoId })` - obtém histórico
4. Montar prompt seguindo estrutura:
   ```
   {promptBase}
   
   Comportamento esperado para o status: {statusAtual}
   {objetoAtendimentoAI[statusAtual]}
   
   Instruções de análise...
   
   Histórico da conversa (últimas 10, mais recente primeiro):
   [...]
   
   Mensagem atual do cliente:
   {mensagemRecebida}
   ```

---

### 2. **Modificar: `src/lib/utils/ollama.ts`**

**Mudanças necessárias:**

1. **Nova função para resposta JSON:**
```typescript
interface OllamaJSONResponse {
  status_sugerido: string;
  resposta: string;
}

export async function generateOllamaJSONResponse(
  prompt: string,
  modelName: string = 'llama3.1:8b'
): Promise<OllamaJSONResponse>
```

**Características:**
- Envia prompt completo (sem histórico separado)
- Força formato JSON na resposta
- Faz parsing e validação do JSON retornado
- Trata erros de parsing

---

### 3. **Modificar: `src/app/api/webhook/route.ts`**

**Mudanças:**
- Substituir `handleAutoReply` atual
- Usar `generatePrompt()` para criar prompt estruturado
- Usar `generateOllamaJSONResponse()` para obter resposta
- Logar JSON no console (por enquanto)
- Extrair apenas `resposta` para enviar via WhatsApp

---

## 🔄 Fluxo Completo

```
1. Mensagem recebida via WhatsApp
   ↓
2. processMessage() - Salva mensagem no banco
   ↓
3. generatePrompt()
   - Busca AtendimentoAI
   - Busca Contato (status atual)
   - Busca histórico (últimas 10 mensagens)
   - Monta prompt estruturado
   ↓
4. generateOllamaJSONResponse()
   - Envia prompt para Ollama
   - Recebe JSON: { status_sugerido, resposta }
   ↓
5. Log JSON no console
   ↓
6. Extrai campo "resposta"
   ↓
7. sendWhatsAppMessage() - Envia resposta
   ↓
8. saveSentMessage() - Salva resposta no banco
```

---

## 📊 Estrutura do Prompt Gerado

```
{promptBase do AtendimentoAI}

Comportamento esperado para o status do contato que enviou a mensagem:

{objetoAtendimentoAI[statusAtual]}
Exemplo: se status = "Aberta", usa objetoAtendimentoAI.aberta

Você deve analisar a conversa e decidir se o status deve mudar para um dos seguintes:
['Aberta', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento', 'Perdida']

Caso considere que o status deve mudar, retorne o novo status.

Retorne SOMENTE em JSON no formato:
{
  "status_sugerido": "",
  "resposta": ""
}

Histórico da conversa:
  mensagem do cliente: "..."
  mensagem do assistente: "..."
  mensagem do cliente: "..."
  ...

Mensagem atual do cliente:
{mensagemRecebida}
```

---

## ⚠️ Pontos de Atenção

### 1. **Status do Contato**
- O modelo Contato já tem enum com os status corretos
- Status padrão: 'Aberta'
- Status possíveis: ['Aberta', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento', 'Perdida']

### 2. **Histórico de Mensagens**
- Últimas 10 mensagens (ou menos se não tiver)
- Ordem: **mais recente primeiro** (diferente do atual que é mais antiga primeiro)
- Formato: "mensagem do cliente:" ou "mensagem do assistente:"
- Apenas mensagens de texto

### 3. **Resposta JSON do Ollama**
- Ollama pode não retornar JSON puro sempre
- Precisa de instruções claras no prompt
- Precisa fazer parsing seguro com fallback
- Validar campos obrigatórios

### 4. **Mapeamento Status → Campo AtendimentoAI**
- Status "Aberta" → campo `aberta`
- Status "Qualificação" → campo `qualificação`
- Status "Proposta" → campo `proposta`
- Status "Negociação" → campo `negociação`
- Status "Fechamento" → campo `fechamento`
- Status "Perdida" → campo `perdida`

---

## 🚀 Ordem de Implementação

1. ✅ Criar `generatePrompt.ts` - Gerador de prompt estruturado
2. ✅ Modificar `ollama.ts` - Adicionar função JSON response
3. ✅ Modificar `webhook/route.ts` - Integrar novo fluxo
4. ✅ Testar com mensagem real
5. ⏭️ Futuro: Implementar atualização automática de status

---

## 🧪 Casos de Teste

### Caso 1: Primeira Mensagem
- Contato novo
- Status: "Aberta" (padrão)
- Histórico vazio ou com apenas 1 mensagem
- Deve gerar prompt correto
- Deve retornar resposta de saudação

### Caso 2: Conversa em Andamento
- Contato existente
- Status: "Qualificação"
- Histórico com 5+ mensagens
- Deve incluir histórico completo
- Deve usar comportamento de "Qualificação"

### Caso 3: Mudança de Status
- Cliente demonstra interesse em proposta
- Status atual: "Qualificação"
- Deve sugerir: "Proposta" ou "Negociação"
- Resposta deve seguir novo status sugerido

---

## 📌 Notas Importantes

1. **Por enquanto:** Apenas logar JSON no console
2. **Futuro:** Implementar atualização automática de status do contato
3. **Futuro:** Criar interface para visualizar/editar prompts
4. **Segurança:** Validar sempre os dados do banco antes de usar

---

## ✅ Checklist de Implementação

- [ ] Criar arquivo `src/lib/utils/generatePrompt.ts`
- [ ] Implementar busca de AtendimentoAI
- [ ] Implementar busca de Contato e status
- [ ] Implementar formatação de histórico
- [ ] Implementar montagem de prompt
- [ ] Adicionar função JSON response em `ollama.ts`
- [ ] Modificar `webhook/route.ts` para usar novo sistema
- [ ] Adicionar logs detalhados
- [ ] Testar com diferentes status
- [ ] Testar com histórico vazio
- [ ] Testar com histórico completo

---

## 🎯 Resultado Esperado

Ao receber uma mensagem:
1. Console mostra o JSON completo:
   ```json
   {
     "status_sugerido": "Qualificação",
     "resposta": "Que tipo de site você está precisando?"
   }
   ```
2. Apenas o campo `resposta` é enviado via WhatsApp
3. Resposta é salva no banco normalmente
4. Sistema está pronto para futura implementação de atualização de status

