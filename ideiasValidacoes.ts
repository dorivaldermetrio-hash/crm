/**
 * No atual projeto, a mensagem é recebida no formato de um objeto JSON.
 * Então recebemos a mensagem, geramos um texto que sera usado como prompt para o Ollama.
 * E o ollama nos retorna um objeto JSON com a resposta.
 * 
 * Nesse processo, não é feito nenhuma validação da mensagem recebida, para refinar melhor ainda a resposta que pode ser gerada pelo Ollama, e por isso pensei em algumas validações que podem ser feitas para garantir que o sistema funcione corretamente. E acima de tudo, ofereça os produtos e serviços de forma mais clara e precisa, mantendo uma certa consistencia na conversa como um todo.
 * 
 * 
 * Atualmente trabalhamos com um texto de prompt, que atualmente vamos chama-lo de 'Prompt de Resposta'. Segue a ideia de como o 'Prompt de Resposta' funciona atualmente:
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 

************************************ PROMPT DE RESPOSTA ************************************
objetoAtendimentoAi.promptBase (primeiro pegamos o prompt base que é o comportamento base do atendimento ai. Lembrando que esse objeto deve ser obtido do banco de dados, e não usar o que eu coloquei aqui no arquivo.)

em seguida, pegamos o objeto contato, do contato que enviou a mensagem, e verificamos a propriedade status do contato. E então buscamos no banco de dados o objeto atendimento ai que tem o status do contato. E inserimos na mensagem que vai para o Ollama, ficando assim:

"
{objetoAtendimentoAi.promptBase} \n\n

Comportamento esperado para o status do contato que enviou a mensagem: \n\n

{objetoAtendimentoAi.status} (status do contato que enviou a mensagem.)

Você deve analisar a conversa e decidir se o status deve mudar para um dos seguintes:
['Aberta', 'Qualificação', 'Proposta', 'Negociação', 'Fechamento', 'Perdida']

Caso considere que o status deve mudar, retorne o novo status.

Retorne SOMENTE em JSON no formato:
{
  "status_sugerido": "",
  "resposta": ""
}

Histórico da conversa: (aqui deve entrar as ultimas 10 mensagens da conversa, caso não tiver 10 entra quantas tiver, a ideia é ser no maximo 10, e a ordem deve ser a mais recente para a mais antiga. E lembrando que para objeter as mensagens precisamos acessar a coleção do nosso banco de dados chamada 'mensagens', e o id do contato que enviou a mensagem para identificar o objeto dentro da coleção 'mensagens' que possui a propriedade contatoID igual ao id do contato que enviou a mensagem. E assim conseguimos usar o objeto com mensagem deste contato acessando a propriedade mensagens deste objeto. Essa propriedade mensagens é um array de objetos com as mensagens que o contato enviou e as mensagens que nós nos enviamos para ele. Podendo assim ver toda a conversa com o contato.)
[...]

Mensagem atual do cliente: (aqui deve entrar a mensagem que o contato enviou mais recentemente.)
[...]

************************************ FIM PROMPT DE RESPOSTA ************************************






* Antes de chegar no 'Prompt de Resposta', vamos ter outros dois prompts que serão usandos junto ao ollama para verificar a conversa como um todo e definir mais algumas coisas que podemos estar usando com o prompt de resposta e gerar respostas mais precisas e contextuais. Primeiro vou apresentar os dois prompts e em seguida 


************************** PROMPT DE VALIDAÇÃO DE PRODUTOS E SERVIÇOS **************************

avalie a conversa deste contato:

- Histórico das últimas 10 mensagens da conversa (Exatamente como é usado no 'Prompt de Resposta')
- A mensagem atual do cliente (Exatamente como é usado no 'Prompt de Resposta')

Com base APENAS nessas mensagens, determine se existe interesse comercial real em adquirir um produto da empresa.

Produtos possíveis: (aqui temos produtos de exemplo, para essa lista, vamos acessar a coleção 'produtos' do banco de dados e pegar os produtos que estão ativos e com o campo 'ativado' igual a 'sim' e aqui na lista colocamos o nome do produto e a descrição breve do produto. Exemplo abaixo:)

- NOTIFICACAO
  descrição breve do produto: "Sistema de notificação para empresas. Emitindo mensagens em massa"

- CRM
  descrição breve do produto: "Sistema de gerenciamento de clientes e vendas"

- RASTREAMENTO
  descrição breve do produto: "Sistema de rastreamento de veículos e equipamentos"
 ... (continua assim para todos os produtos que estão ativos e com o campo 'ativado' igual a 'sim')


Se NÃO houver interesse comercial claro:
retorne:
{
  "interesse": false,
  "produto": null
}

Se houver interesse, mas ainda não for possível identificar com certeza qual produto:
retorne:
{
  "interesse": true,
  "produto": "DESCONHECIDO"
}

Se houver interesse claro em um dos produtos:
retorne:
{
  "interesse": true,
  "produto": "<nome do produto>"
}

Responda SOMENTE com o objeto JSON exato, sem nenhum texto adicional.

************************** FIM PROMPT DE VALIDAÇÃO DE PRODUTOS E SERVIÇOS **************************









* Agora vou mostrar outro prompt que tambem vamos usar:



************************** PROMPT DE VALIDAÇÃO DE INTERESSE **************************

avalie a conversa deste contato:

- Histórico das últimas 10 mensagens da conversa (Exatamente como é usado no 'Prompt de Resposta')
- A mensagem atual do cliente (Exatamente como é usado no 'Prompt de Resposta')

Com base APENAS nessas mensagens, determine se o cliente gostaria de trocar de produto ou serviço.

Produtos possíveis: (aqui temos produtos de exemplo, para essa lista, vamos acessar a coleção 'produtos' do banco de dados e pegar os produtos que estão ativos e com o campo 'ativado' igual a 'sim' e aqui na lista colocamos o nome do produto e a descrição breve do produto. Exemplo abaixo:)

- NOTIFICACAO
  descrição breve do produto: "Sistema de notificação para empresas. Emitindo mensagens em massa"

- CRM
  descrição breve do produto: "Sistema de gerenciamento de clientes e vendas"

- RASTREAMENTO
  descrição breve do produto: "Sistema de rastreamento de veículos e equipamentos"
 ... (continua assim para todos os produtos que estão ativos e com o campo 'ativado' igual a 'sim') 

Se NÃO houver interesse em trocar de produto ou serviço:
retorne:
{
  "troca": false,
  "produto": null
}

Se houver interesse em trocar de produto ou serviço, mas ainda não for possível identificar com certeza qual produto:
retorne:

{
  "troca": true,
  "produto": "<nome do produto>"
}


Responda SOMENTE com o objeto JSON exato, sem nenhum texto adicional.

************************** FIM PROMPT DE VALIDAÇÃO DE INTERESSE **************************



* A ideia do fluxo aqui é a seguinte:

- recebemos a mensagem do cliente

- se a propriedade 'produtoInteresse' do contato que enviou a mensagem for '' ou 'DESCONHECIDO', usamos então o prompt de validação de produtos e serviços para verificar se o cliente tem interesse em adquirir um produto ou serviço.

- se a propriedade 'produtoInteresse' do contato que enviou a mensagem for diferente de '' ou 'DESCONHECIDO', usamos então o prompt de validação de interesse para verificar se o cliente gostaria de trocar de produto ou serviço.

- O importante é sempre verificar a propriedade 'produtoInteresse' do contato que enviou a mensagem, para verificar se o cliente tem interesse em adquirir um produto ou serviço ou gostaria de trocar de produto ou serviço. Lembrando pode ser que o objeto contato não tenha a propriedade 'produtoInteresse', e nesse caso, criamos a propriedade 'produtoInteresse' com o valor ''.

- Lembrando tambem que cada prompt trabalha com um objeto JSON diferente, o prompt de validação de produtos e serviços usa {interesse: boolean, produto: string} e o prompt de validação de interesse usa {troca: boolean, produto: string}. Então devemos ter funcões para tratar cada um dos prompts, para que o sistema funcione corretamente.

- Ao usar o prompt de validação de produtos e serviços, então atualizamos a propriedade 'produtoInteresse' do contato que enviou a mensagem com o valor do produto que o cliente tem interesse em adquirir. E depois disso vamos para o prompt de resposta para gerar a resposta da mensagem.

' Na proxima mensagem do cliente, caso o cliente ja tenha estabelecido um interesse em algum produto ou serviço, vamos usar o prompt de validação de interesse para verificar se o cliente gostaria de trocar de produto ou serviço. E se o cliente gostaria de trocar de produto ou serviço, vamos atualizar a propriedade 'produtoInteresse' do contato que enviou a mensagem com o valor do produto que o cliente gostaria de trocar. E depois disso vamos para o prompt de resposta para gerar a resposta da mensagem.

'O prompt de resposta deve sofrer uma pequela atualização, onde abaixo de 'Mensagem atual do cliente:' vamos buscar no banco de dados o objeto produto que tem o nome do produto que o cliente tem interesse em adquirir ou o nome do produto que o cliente gostaria de trocar. E vamos inserir na mensagem que vai para o Ollama, ficando assim:

'Mensagem atual do cliente: (aqui deve entrar a mensagem que o contato enviou mais recentemente.)

Produto ou serviço que o cliente tem interesse em adquirir ou gostaria de trocar: (aqui deve entrar todas as informações do produto ou serviço que o cliente tem interesse em adquirir ou gostaria de trocar.)























*/
