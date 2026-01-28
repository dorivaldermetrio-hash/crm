// idealizando como os objetos devem ser, não necessariamente como serão implementados, ou serão feitos dessa forma.


//primeiro de tudo vamos conhecer o objeto que recebemos na rota

let objetoRecebido = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1731564640841342",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "554188980887",
              "phone_number_id": "858245564040256"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Ecoclean Sistemas"
                },
                "wa_id": "554187280741"
              }
            ],
            "messages": [
              {
                "from": "554187280741",
                "id": "wamid.HBgMNTU0MTg3MjgwNzQxFQIAEhgWM0VCMDE4NzJGRDZBREU0OTcyMzBBRQA=",
                "timestamp": "1764702909",
                "text": {
                  "body": "mensagem de um servidor para outro futuro servidoooor"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}


//recebemos do webhook do whatsapp uma mensagem do cliente, quando essa mensagem chega, ela tem o contato e a mensagem, apenas. O contato dessa mensagem, pode ser adicionado no nosso crm, ou seja, um contato que conhecemos. Logo penso no seguinte objeto:

let objetoContato = {
    contato : "numero do contato que enviou a mensagem", //objetoRecebido.entry[0].changes[0].value.contacts[0].wa_id,
    contatoNome : "O nome recebido do contato que enviou a mensagem.", //objetoRecebido.entry[0].changes[0].value.contacts[0].profile.name,
    id: "identificador unico do contato. Cada número que nos envia uma mensagem, tera um identificador unico. Esse identificador é o que é gerado quando salvamos o objeto contato no banco de dados do mongodb, ou seja, o id é o _id do objeto contato no banco de dados.",
    ultimaMensagem: "a ultima mensagem que o contato enviou. Essa mensagem é a ultima mensagem que o contato enviou para nós. Será usado para identificar se a mensagem é nova ou não. Se a mensagem for nova, será adicionada no banco de dados. Se a mensagem não for nova, será ignorada.", //objetoRecebido.entry[0].changes[0].value.messages[0].text.body,
    dataUltimaMensagem: "data e hora da ultima mensagem que o contato enviou. Será usado para identificar se a mensagem é nova ou não. Se a mensagem for nova, será adicionada no banco de dados. Se a mensagem não for nova, será ignorada.", //objetoRecebido.entry[0].changes[0].value.messages[0].timestamp,
    dataContato: "data de criação do contato no banco de dados."
}

//Então quando recebemos uma mensagem de um numero, a primeira coisa que é necessario fazer é verificar no banco de dados se esse contato ja existe. Se existir, atualizamos a propriedade ultimaMensagem e segue para o proximo passo, se não existir, criamos o objeto contato e adicionamos no banco de dados.

//O que nos leva ao segundo passo, que é o tratamento da mensagem em si que recebemos. E para isso pensei no seguinte objeto:

let mensagemUnica = {
    contatoID: "id do contato que enviou a mensagem. Este id é o mesmo id do contato que enviou a mensagem.",
    mensagem: "a mensagem que o contato enviou.",
    dataHora: "data e hora da mensagem. Será usado para identificar se a mensagem é nova ou não. Se a mensagem for nova, será adicionada no banco de dados. Se a mensagem não for nova, será ignorada.",
    tipo: "tipo de mensagem. Pode ser 'texto', 'imagem', 'audio', 'video', 'documento', 'link', 'contato', 'localizacao', 'sticker', 'audio_stream', 'video_stream', 'documento_stream', 'link_stream', 'contato_stream', 'localizacao_stream', 'sticker_stream'." //inicialmente vamos trabalhar apenas com o tipo 'texto'.
}

let objetoMensagem = {
    contatoID: "id do contato que enviou a mensagem. Este id é o mesmo id do contato que enviou a mensagem.",
    mensagens: [ mensagemUnica ], //array de mensagens unicas. Futuramente, aqui vamos ter todas as mensagens que o contato nos enviou e as mensagens que nós nos enviamos para ele. Podendo assim ver toda a conversa com o contato.
    id: "identificador unico da lista de mensagens" //esse identificador é o mesmo usado no banco de dados do mongodb, ou seja, o id é o _id do objeto mensagem no banco de dados.
}

//agora então, penso que são dois cenários possíveis: Vamos começar pelo primeiro: Vamos receber uma mensagem de um contato que não existe no nosso crm.
//Nesse caso, apos criar o objeto contato, precisamso então montar o objeto mensagemUnica, e depois de montar esse objeto, montamos o objetoMensagem e ja adicionamos o objeto mensagemUnica dentro do array de mensagens do objetoMensagem. e então salvamos o objeto mensagem dentro do banco de dados.

//Agora vamos para o segundo cenário: vamos receber uma mensagem de um contato que ja existe no nosso crm. Nesse caso atualiamoS a propriedade ultimaMensagem e a propriedade dataUltimaMensagem do objeto contato com os valores da mensagem recebida. E então montamos o objeto mensagemUnica, e depois de montar esse objeto, identificamos o objetoMensagem que possui o contatoID igual ao id do contato que enviou a mensagem e adicionamos o objeto mensagemUnica dentro do array de mensagens do objetoMensagem, atualizando assim o objetoMensagem com o novo array de mensagens que agora incluí a nova mensagem.


//as coleções que até o momento vamos usar no banco de dados são: "contatos" e "mensagens".