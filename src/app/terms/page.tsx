'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HiOutlineDocumentText, HiOutlineHome } from 'react-icons/hi2';

type Language = 'pt' | 'en';

// Componente de Bandeira
const FlagIcon = ({ country, isActive, onClick }: { country: 'br' | 'us'; isActive: boolean; onClick: () => void }) => {
  const flags = {
    br: '🇧🇷',
    us: '🇺🇸',
  };

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 dark:ring-blue-400 scale-110'
          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 opacity-70 hover:opacity-100'
      }`}
      title={country === 'br' ? 'Português' : 'English'}
      aria-label={country === 'br' ? 'Português' : 'English'}
    >
      <span className="text-2xl">{flags[country]}</span>
    </button>
  );
};

// Traduções
const translations = {
  pt: {
    metadata: {
      title: 'Termos de Uso | AdvoSoft',
      description: 'Termos de Uso do AdvoSoft - Sistema de Gerenciamento de Relacionamento com Clientes',
    },
    header: {
      back: 'Voltar ao início',
    },
    title: {
      main: 'Termos de Uso',
      subtitle: 'AdvoSoft - Sistema de Gerenciamento de Relacionamento com Clientes',
      lastUpdate: 'Última atualização: 15 de janeiro de 2025',
    },
    sections: {
      acceptance: {
        title: '1. ACEITAÇÃO DOS TERMOS',
        p1: 'Ao acessar e utilizar o AdvoSoft, você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.',
        p2: 'Estes Termos de Uso, juntamente com nossa Política de Privacidade, regem sua relação conosco em relação ao uso da plataforma AdvoSoft.',
      },
      description: {
        title: '2. DESCRIÇÃO DO SERVIÇO',
        intro: 'O AdvoSoft é uma plataforma de CRM (Customer Relationship Management) que oferece as seguintes funcionalidades:',
        features: {
          title: '2.1. Funcionalidades Principais',
          items: [
            'Gerenciamento de conversas via WhatsApp Business API',
            'Gerenciamento de mensagens diretas do Instagram',
            'Atendimento automatizado com Inteligência Artificial',
            'Gerenciamento de contatos e clientes',
            'Criação e gerenciamento de agendamentos',
            'Sincronização com Google Calendar',
            'Campanhas de marketing via WhatsApp e Email',
            'Gerenciamento de produtos e serviços',
            'Integração com Google Ads para gestão de campanhas publicitárias',
            'Geração de relatórios e análises',
            'Dashboard com métricas e insights',
          ],
        },
        technologies: {
          title: '2.2. Tecnologias Utilizadas',
          items: [
            'Next.js (framework web)',
            'MongoDB (banco de dados)',
            'Integração com APIs do Google (Calendar e Ads)',
            'Integração com WhatsApp Business API',
            'Integração com Instagram Graph API',
            'Processamento de IA (Ollama e/ou OpenAI)',
            'Cloudinary (armazenamento de mídias)',
          ],
        },
      },
      registration: {
        title: '3. CADASTRO E CONTA DE USUÁRIO',
        requirements: {
          title: '3.1. Requisitos para Cadastro',
          description: 'Para utilizar o AdvoSoft, você deve:',
          items: [
            'Ter pelo menos 18 anos de idade',
            'Fornecer informações verdadeiras, precisas e completas',
            'Manter e atualizar suas informações de cadastro',
            'Ser responsável pela segurança de sua conta e senha',
            'Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta',
          ],
        },
        authentication: {
          title: '3.2. Autenticação',
          description: 'O acesso ao sistema é realizado através de autenticação OAuth com Google. Você é responsável por manter a segurança de suas credenciais de acesso.',
        },
        individual: {
          title: '3.3. Conta Individual',
          description: 'Cada conta é pessoal e intransferível. Você não pode compartilhar, transferir ou vender sua conta para terceiros.',
        },
      },
      usage: {
        title: '4. USO DO SERVIÇO',
        allowed: {
          title: '4.1. Uso Permitido',
          description: 'Você concorda em utilizar o AdvoSoft apenas para fins legais e de acordo com estes Termos de Uso. Você pode:',
          items: [
            'Gerenciar seus contatos e conversas',
            'Criar e gerenciar agendamentos',
            'Enviar campanhas de marketing (respeitando as leis aplicáveis)',
            'Utilizar as funcionalidades de IA para atendimento automatizado',
            'Integrar com serviços de terceiros autorizados (Google Calendar, Google Ads)',
          ],
        },
        prohibited: {
          title: '4.2. Uso Proibido',
          description: 'Você concorda em NÃO utilizar o AdvoSoft para:',
          items: [
            'Qualquer atividade ilegal ou não autorizada',
            'Enviar spam, mensagens não solicitadas ou conteúdo abusivo',
            'Violar direitos de propriedade intelectual de terceiros',
            'Interferir ou interromper o funcionamento do serviço',
            'Tentar acessar áreas restritas do sistema',
            'Usar bots, scripts ou métodos automatizados não autorizados',
            'Compartilhar credenciais de acesso com terceiros',
            'Realizar engenharia reversa ou tentar extrair o código-fonte',
            'Transmitir vírus, malware ou código malicioso',
            'Coletar dados de outros usuários sem autorização',
            'Utilizar o serviço de forma que possa danificar, sobrecarregar ou comprometer nossos servidores',
          ],
        },
        content: {
          title: '4.3. Responsabilidade pelo Conteúdo',
          description: 'Você é o único responsável por todo o conteúdo que criar, enviar, publicar ou transmitir através do AdvoSoft, incluindo:',
          items: [
            'Mensagens enviadas via WhatsApp e Instagram',
            'Dados de contatos e clientes',
            'Conteúdo de campanhas de marketing',
            'Informações de agendamentos',
            'Qualquer outro conteúdo gerado ou armazenado na plataforma',
          ],
          oab: 'O Usuário (Advogado) é o único responsável por garantir que o uso das ferramentas de automação, marketing e envio de mensagens em massa esteja em conformidade com o Código de Ética e Disciplina da OAB e provimentos vigentes sobre publicidade jurídica.',
        },
      },
      integrations: {
        title: '5. INTEGRAÇÕES E SERVIÇOS DE TERCEIROS',
        whatsapp: {
          title: '5.1. Integração com WhatsApp Business API',
          items: [
            'Você deve possuir uma conta válida do WhatsApp Business API',
            'É sua responsabilidade manter as credenciais de acesso atualizadas',
            'O uso do WhatsApp Business API está sujeito aos Termos de Serviço do WhatsApp/Meta',
            'Você é responsável por cumprir as políticas do WhatsApp relacionadas ao envio de mensagens',
          ],
        },
        instagram: {
          title: '5.2. Integração com Instagram',
          items: [
            'Você deve possuir uma conta válida do Instagram Business',
            'O uso do Instagram Graph API está sujeito aos Termos de Serviço do Instagram/Meta',
            'Você é responsável por cumprir as políticas do Instagram',
          ],
        },
        google: {
          title: '5.3. Integração com Google Services',
          items: [
            'Google Calendar: Para sincronização de agendamentos',
            'Google Ads: Para gestão de campanhas publicitárias',
            'O uso está sujeito aos Termos de Serviço do Google',
            'Você deve cumprir a ',
          ],
          policyLink: 'Política de Dados do Usuário dos Serviços de API do Google',
          itemsEnd: [
            'Dados do Google não são compartilhados com IAs de terceiros para treinamento',
          ],
          declaration: 'O AdvoSoft declara que o uso de informações recebidas das APIs do Google Ads adere à Política de Dados do Usuário dos Serviços de API do Google, não utilizando dados de campanhas para treinamento de modelos de IA de terceiros ou comercialização com parceiros.',
        },
        other: {
          title: '5.4. Outras Integrações',
          items: [
            'Cloudinary: Para armazenamento de mídias',
            'MongoDB: Para armazenamento de dados',
            'Serviços de email (SMTP): Para envio de campanhas',
          ],
        },
      },
      ai: {
        title: '6. INTELIGÊNCIA ARTIFICIAL',
        responses: {
          title: '6.1. Respostas Automáticas',
          description: 'O AdvoSoft utiliza Inteligência Artificial para gerar respostas automáticas. Você entende e concorda que:',
          items: [
            'As respostas são geradas automaticamente e podem conter erros',
            'Você é responsável por revisar e aprovar respostas antes do envio (quando aplicável)',
            'A qualidade das respostas depende da configuração dos prompts e do contexto fornecido',
            'Não garantimos precisão absoluta nas respostas geradas',
          ],
        },
        models: {
          title: '6.2. Modelos de IA',
          description: 'O sistema pode utilizar:',
          items: ['Ollama (processamento local)', 'OpenAI (processamento em nuvem)'],
        },
        limitation: {
          title: '6.3. Limitação de Responsabilidade',
          description: 'Não nos responsabilizamos por:',
          items: [
            'Respostas inadequadas ou incorretas geradas pela IA',
            'Consequências decorrentes do uso de respostas automáticas',
            'Perda de dados ou informações devido a falhas no processamento de IA',
          ],
          hallucinations: 'A Inteligência Artificial pode gerar informações imprecisas sobre prazos, leis ou jurisprudências ("alucinações"). O sistema AdvoSoft é uma ferramenta de suporte, e o Advogado deve revisar toda e qualquer informação jurídica ou agendamento gerado pela IA, sendo o único responsável técnico por tais informações perante seus clientes.',
        },
      },
      intellectual: {
        title: '7. PROPRIEDADE INTELECTUAL',
        advosoft: {
          title: '7.1. Propriedade do AdvoSoft',
          description: 'Todo o conteúdo, funcionalidades, design, código, marcas, logotipos e outros elementos do AdvoSoft são de nossa propriedade ou licenciados para nós. Estes materiais estão protegidos por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.',
        },
        userData: {
          title: '7.2. Seus Dados',
          description: 'Você mantém todos os direitos sobre os dados que você cria, envia ou armazena no AdvoSoft. Ao utilizar o serviço, você nos concede uma licença limitada, não exclusiva e revogável para:',
          items: [
            'Armazenar seus dados em nossos servidores',
            'Processar seus dados para fornecer os serviços',
            'Fazer backup e manter cópias de segurança dos seus dados',
          ],
        },
        feedback: {
          title: '7.3. Feedback e Sugestões',
          description: 'Qualquer feedback, sugestão ou ideia que você fornecer sobre o AdvoSoft pode ser usado por nós sem qualquer obrigação de compensação.',
        },
      },
      payments: {
        title: '8. PAGAMENTOS E ASSINATURAS',
        plans: {
          title: '8.1. Planos e Preços',
          description: 'O AdvoSoft pode oferecer diferentes planos de assinatura. Os preços, recursos e condições de cada plano estão disponíveis na plataforma e podem ser alterados a qualquer momento.',
        },
        renewal: {
          title: '8.2. Renovação Automática',
          description: 'Se você possui uma assinatura paga, ela pode ser renovada automaticamente no final de cada período de cobrança, a menos que você cancele antes da data de renovação.',
        },
        refunds: {
          title: '8.3. Reembolsos',
          description: 'Políticas de reembolso, quando aplicáveis, serão comunicadas no momento da compra ou conforme especificado em contrato específico.',
        },
      },
      availability: {
        title: '9. DISPONIBILIDADE DO SERVIÇO',
        maintenance: {
          title: '9.1. Manutenção e Interrupções',
          description: 'Reservamo-nos o direito de:',
          items: [
            'Realizar manutenções programadas ou de emergência',
            'Interromper temporariamente o serviço quando necessário',
            'Modificar, suspender ou descontinuar qualquer funcionalidade',
          ],
        },
        warranties: {
          title: '9.2. Sem Garantias',
          description: 'O AdvoSoft é fornecido "como está" e "conforme disponível". Não garantimos que:',
          items: [
            'O serviço estará sempre disponível ou livre de erros',
            'Os resultados obtidos serão precisos ou confiáveis',
            'Qualquer defeito será corrigido',
            'O serviço atenderá a todas as suas necessidades',
          ],
        },
      },
      liability: {
        title: '10. LIMITAÇÃO DE RESPONSABILIDADE',
        exclusion: {
          title: '10.1. Exclusão de Danos',
          description: 'Na máxima extensão permitida por lei, não seremos responsáveis por:',
          items: [
            'Danos diretos, indiretos, incidentais, especiais ou consequenciais',
            'Perda de lucros, receita, dados ou oportunidades de negócio',
            'Interrupção de negócios ou perda de informações',
            'Danos resultantes do uso ou incapacidade de usar o serviço',
            'Problemas decorrentes de integrações com serviços de terceiros',
            'Ações ou omissões de terceiros',
          ],
        },
        limit: {
          title: '10.2. Limitação de Valor',
          description: 'Nossa responsabilidade total, em qualquer caso, não excederá o valor pago por você pelos serviços nos últimos 12 meses.',
        },
      },
      indemnification: {
        title: '11. INDENIZAÇÃO',
        description: 'Você concorda em indenizar, defender e isentar o AdvoSoft, seus diretores, funcionários e parceiros de qualquer reclamação, dano, obrigação, perda, responsabilidade, custo ou despesa (incluindo honorários advocatícios) decorrentes de:',
        items: [
          'Seu uso do serviço',
          'Violação destes Termos de Uso',
          'Violação de direitos de terceiros',
          'Conteúdo que você criar, enviar ou transmitir através do serviço',
        ],
      },
      privacy: {
        title: '12. PRIVACIDADE E PROTEÇÃO DE DADOS',
        policy: {
          title: '12.1. Política de Privacidade',
          description: 'O uso do AdvoSoft também está sujeito à nossa Política de Privacidade, que descreve como coletamos, usamos e protegemos seus dados pessoais. Ao utilizar o serviço, você concorda com nossa Política de Privacidade.',
        },
        lgpd: {
          title: '12.2. Conformidade com LGPD',
          description: 'Nos comprometemos a cumprir a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e outras leis aplicáveis de proteção de dados.',
        },
      },
      modifications: {
        title: '13. MODIFICAÇÕES DOS TERMOS',
        right: {
          title: '13.1. Direito de Modificar',
          description: 'Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas através de:',
          items: [
            'Notificação na plataforma',
            'Email para usuários cadastrados',
            'Atualização da data de "Última atualização" no início deste documento',
          ],
        },
        continuity: {
          title: '13.2. Continuidade do Uso',
          description: 'O uso continuado do AdvoSoft após as modificações constitui sua aceitação dos novos termos. Se você não concordar com as modificações, deve cessar o uso do serviço.',
        },
      },
      cancellation: {
        title: '14. CANCELAMENTO E RESCISÃO',
        byUser: {
          title: '14.1. Cancelamento por Você',
          description: 'Você pode cancelar sua conta a qualquer momento através das configurações da plataforma ou entrando em contato conosco.',
        },
        byUs: {
          title: '14.2. Rescisão por Nós',
          description: 'Podemos suspender ou encerrar sua conta imediatamente, sem aviso prévio, se você:',
          items: [
            'Violar estes Termos de Uso',
            'Usar o serviço de forma fraudulenta ou ilegal',
            'Não pagar taxas devidas (quando aplicável)',
            'Criar risco ou exposição legal para nós',
            'Violar políticas de serviços de terceiros integrados',
          ],
        },
        effects: {
          title: '14.3. Efeitos da Rescisão',
          description: 'Após a rescisão:',
          items: [
            'Seu acesso ao serviço será imediatamente encerrado',
            'Você pode solicitar uma cópia dos seus dados (conforme permitido por lei)',
            'Dados podem ser excluídos após período de retenção legal',
            'Disposições que por sua natureza devem sobreviver permanecerão em vigor',
          ],
        },
      },
      data: {
        title: '15. DADOS E BACKUP',
        responsibility: {
          title: '15.1. Responsabilidade pelos Dados',
          description: 'Você é responsável por manter backups dos seus dados importantes. Embora façamos backups regulares, não garantimos a recuperação de dados em caso de perda.',
        },
        retention: {
          title: '15.2. Retenção de Dados',
          description: 'Mantemos seus dados pelo tempo necessário para fornecer os serviços e cumprir obrigações legais. Após o cancelamento, podemos reter dados conforme exigido por lei.',
        },
      },
      communications: {
        title: '16. COMUNICAÇÕES',
        notifications: {
          title: '16.1. Notificações',
          description: 'Ao utilizar o AdvoSoft, você concorda em receber comunicações eletrônicas de nossa parte, incluindo:',
          items: [
            'Notificações sobre o serviço',
            'Atualizações de segurança',
            'Informações sobre sua conta',
            'Comunicações de marketing (você pode optar por não receber)',
          ],
        },
        form: {
          title: '16.2. Forma de Comunicação',
          description: 'As comunicações serão enviadas para o endereço de email associado à sua conta ou através de notificações na plataforma.',
        },
      },
      disputes: {
        title: '17. DISPUTAS E LEI APLICÁVEL',
        law: {
          title: '17.1. Lei Aplicável',
          description: 'Estes Termos de Uso são regidos pelas leis do Brasil, especialmente:',
          items: [
            'Código de Defesa do Consumidor (Lei nº 8.078/1990)',
            'Marco Civil da Internet (Lei nº 12.965/2014)',
            'Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)',
          ],
        },
        resolution: {
          title: '17.2. Resolução de Disputas',
          description: 'Em caso de disputas, as partes se comprometem a tentar resolver amigavelmente. Se não for possível, as disputas serão resolvidas:',
          items: [
            'Primeiro, através de mediação (quando aplicável)',
            'Posteriormente, pelos tribunais competentes de Matinhos - PR, Brasil',
          ],
        },
      },
      general: {
        title: '18. DISPOSIÇÕES GERAIS',
        completeness: {
          title: '18.1. Integralidade do Acordo',
          description: 'Estes Termos de Uso, juntamente com a Política de Privacidade, constituem o acordo completo entre você e o AdvoSoft em relação ao uso do serviço.',
        },
        divisibility: {
          title: '18.2. Divisibilidade',
          description: 'Se qualquer disposição destes termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor.',
        },
        waiver: {
          title: '18.3. Renúncia',
          description: 'A falha em exercer qualquer direito ou disposição destes termos não constitui uma renúncia a tal direito ou disposição.',
        },
        assignment: {
          title: '18.4. Cessão',
          description: 'Você não pode ceder ou transferir estes termos sem nosso consentimento prévio por escrito. Podemos ceder estes termos a qualquer momento.',
        },
        forceMajeure: {
          title: '18.5. Força Maior',
          description: 'Não seremos responsáveis por falhas ou atrasos no desempenho resultantes de circunstâncias além de nosso controle razoável, incluindo desastres naturais, guerra, terrorismo, greves ou falhas de infraestrutura.',
        },
      },
      contact: {
        title: '19. CONTATO',
        description: 'Para questões relacionadas a estes Termos de Uso, entre em contato conosco:',
        email: 'renato.devmaximiano@gmail.com',
        phone: '+55 41 8728-0741',
        address: 'Rua Manoel Ferreira Gomes, número 55, Matinhos - PR, Brasil',
        hours: 'Segunda a domingo, das 8:00 às 18:00',
      },
      acceptance: {
        title: '20. ACEITAÇÃO',
        description: 'Ao utilizar o AdvoSoft, você declara que:',
        items: [
          'Leu e compreendeu estes Termos de Uso',
          'Concorda em estar vinculado por estes termos',
          'Tem capacidade legal para celebrar este acordo',
          'Não está violando nenhuma lei ou regulamento ao utilizar o serviço',
        ],
        final: 'Se você não concordar com estes termos, por favor, não utilize o AdvoSoft.',
      },
    },
    footer: '© 2025 AdvoSoft. Todos os direitos reservados.',
  },
  en: {
    metadata: {
      title: 'Terms of Use | AdvoSoft',
      description: 'AdvoSoft Terms of Use - Customer Relationship Management System',
    },
    header: {
      back: 'Back to home',
    },
    title: {
      main: 'Terms of Use',
      subtitle: 'AdvoSoft - Customer Relationship Management System',
      lastUpdate: 'Last updated: January 15, 2025',
    },
    sections: {
      acceptance: {
        title: '1. ACCEPTANCE OF TERMS',
        p1: 'By accessing and using AdvoSoft, you agree to comply with and be bound by the following Terms of Use. If you do not agree with any part of these terms, you should not use our services.',
        p2: 'These Terms of Use, together with our Privacy Policy, govern your relationship with us regarding the use of the AdvoSoft platform.',
      },
      description: {
        title: '2. SERVICE DESCRIPTION',
        intro: 'AdvoSoft is a CRM (Customer Relationship Management) platform that offers the following functionalities:',
        features: {
          title: '2.1. Main Features',
          items: [
            'Conversation management via WhatsApp Business API',
            'Instagram direct message management',
            'Automated customer service with Artificial Intelligence',
            'Contact and customer management',
            'Appointment creation and management',
            'Google Calendar synchronization',
            'Marketing campaigns via WhatsApp and Email',
            'Product and service management',
            'Google Ads integration for advertising campaign management',
            'Report and analysis generation',
            'Dashboard with metrics and insights',
          ],
        },
        technologies: {
          title: '2.2. Technologies Used',
          items: [
            'Next.js (web framework)',
            'MongoDB (database)',
            'Google APIs integration (Calendar and Ads)',
            'WhatsApp Business API integration',
            'Instagram Graph API integration',
            'AI processing (Ollama and/or OpenAI)',
            'Cloudinary (media storage)',
          ],
        },
      },
      registration: {
        title: '3. REGISTRATION AND USER ACCOUNT',
        requirements: {
          title: '3.1. Registration Requirements',
          description: 'To use AdvoSoft, you must:',
          items: [
            'Be at least 18 years old',
            'Provide true, accurate, and complete information',
            'Maintain and update your registration information',
            'Be responsible for the security of your account and password',
            'Notify us immediately of any unauthorized use of your account',
          ],
        },
        authentication: {
          title: '3.2. Authentication',
          description: 'System access is performed through OAuth authentication with Google. You are responsible for maintaining the security of your access credentials.',
        },
        individual: {
          title: '3.3. Individual Account',
          description: 'Each account is personal and non-transferable. You may not share, transfer, or sell your account to third parties.',
        },
      },
      usage: {
        title: '4. SERVICE USE',
        allowed: {
          title: '4.1. Permitted Use',
          description: 'You agree to use AdvoSoft only for lawful purposes and in accordance with these Terms of Use. You may:',
          items: [
            'Manage your contacts and conversations',
            'Create and manage appointments',
            'Send marketing campaigns (complying with applicable laws)',
            'Use AI features for automated customer service',
            'Integrate with authorized third-party services (Google Calendar, Google Ads)',
          ],
        },
        prohibited: {
          title: '4.2. Prohibited Use',
          description: 'You agree NOT to use AdvoSoft to:',
          items: [
            'Any illegal or unauthorized activity',
            'Send spam, unsolicited messages, or abusive content',
            'Violate third-party intellectual property rights',
            'Interfere with or disrupt the service operation',
            'Attempt to access restricted areas of the system',
            'Use unauthorized bots, scripts, or automated methods',
            'Share access credentials with third parties',
            'Reverse engineer or attempt to extract source code',
            'Transmit viruses, malware, or malicious code',
            'Collect data from other users without authorization',
            'Use the service in a way that may damage, overload, or compromise our servers',
          ],
        },
        content: {
          title: '4.3. Content Responsibility',
          description: 'You are solely responsible for all content you create, send, publish, or transmit through AdvoSoft, including:',
          items: [
            'Messages sent via WhatsApp and Instagram',
            'Contact and customer data',
            'Marketing campaign content',
            'Appointment information',
            'Any other content generated or stored on the platform',
          ],
          oab: 'The User (Lawyer) is solely responsible for ensuring that the use of automation, marketing, and bulk messaging tools complies with the Code of Ethics and Discipline of the Brazilian Bar Association (OAB) and current provisions on legal advertising.',
        },
      },
      integrations: {
        title: '5. INTEGRATIONS AND THIRD-PARTY SERVICES',
        whatsapp: {
          title: '5.1. WhatsApp Business API Integration',
          items: [
            'You must have a valid WhatsApp Business API account',
            'It is your responsibility to keep access credentials updated',
            'Use of WhatsApp Business API is subject to WhatsApp/Meta Terms of Service',
            'You are responsible for complying with WhatsApp policies related to message sending',
          ],
        },
        instagram: {
          title: '5.2. Instagram Integration',
          items: [
            'You must have a valid Instagram Business account',
            'Use of Instagram Graph API is subject to Instagram/Meta Terms of Service',
            'You are responsible for complying with Instagram policies',
          ],
        },
        google: {
          title: '5.3. Google Services Integration',
          items: [
            'Google Calendar: For appointment synchronization',
            'Google Ads: For advertising campaign management',
            'Use is subject to Google Terms of Service',
            'You must comply with the ',
          ],
          policyLink: 'Google API Services User Data Policy',
          itemsEnd: [
            'Google data is not shared with third-party AIs for training',
          ],
          declaration: 'AdvoSoft declares that the use of information received from Google Ads APIs adheres to the Google API Services User Data Policy, not using campaign data for training third-party AI models or commercialization with partners.',
        },
        other: {
          title: '5.4. Other Integrations',
          items: [
            'Cloudinary: For media storage',
            'MongoDB: For data storage',
            'Email services (SMTP): For campaign sending',
          ],
        },
      },
      ai: {
        title: '6. ARTIFICIAL INTELLIGENCE',
        responses: {
          title: '6.1. Automatic Responses',
          description: 'AdvoSoft uses Artificial Intelligence to generate automatic responses. You understand and agree that:',
          items: [
            'Responses are automatically generated and may contain errors',
            'You are responsible for reviewing and approving responses before sending (when applicable)',
            'Response quality depends on prompt configuration and provided context',
            'We do not guarantee absolute accuracy in generated responses',
          ],
        },
        models: {
          title: '6.2. AI Models',
          description: 'The system may use:',
          items: ['Ollama (local processing)', 'OpenAI (cloud processing)'],
        },
        limitation: {
          title: '6.3. Limitation of Liability',
          description: 'We are not responsible for:',
          items: [
            'Inappropriate or incorrect responses generated by AI',
            'Consequences arising from the use of automatic responses',
            'Loss of data or information due to AI processing failures',
          ],
          hallucinations: 'Artificial Intelligence may generate inaccurate information about deadlines, laws, or case law ("hallucinations"). The AdvoSoft system is a support tool, and the Lawyer must review all legal information or appointments generated by AI, being the sole technical responsible for such information before their clients.',
        },
      },
      intellectual: {
        title: '7. INTELLECTUAL PROPERTY',
        advosoft: {
          title: '7.1. AdvoSoft Ownership',
          description: 'All content, features, design, code, trademarks, logos, and other elements of AdvoSoft are our property or licensed to us. These materials are protected by copyright, trademark, and other intellectual property laws.',
        },
        userData: {
          title: '7.2. Your Data',
          description: 'You retain all rights to data you create, send, or store on AdvoSoft. By using the service, you grant us a limited, non-exclusive, and revocable license to:',
          items: [
            'Store your data on our servers',
            'Process your data to provide services',
            'Backup and maintain security copies of your data',
          ],
        },
        feedback: {
          title: '7.3. Feedback and Suggestions',
          description: 'Any feedback, suggestion, or idea you provide about AdvoSoft may be used by us without any obligation of compensation.',
        },
      },
      payments: {
        title: '8. PAYMENTS AND SUBSCRIPTIONS',
        plans: {
          title: '8.1. Plans and Pricing',
          description: 'AdvoSoft may offer different subscription plans. Prices, features, and conditions of each plan are available on the platform and may be changed at any time.',
        },
        renewal: {
          title: '8.2. Automatic Renewal',
          description: 'If you have a paid subscription, it may be automatically renewed at the end of each billing period, unless you cancel before the renewal date.',
        },
        refunds: {
          title: '8.3. Refunds',
          description: 'Refund policies, when applicable, will be communicated at the time of purchase or as specified in a specific contract.',
        },
      },
      availability: {
        title: '9. SERVICE AVAILABILITY',
        maintenance: {
          title: '9.1. Maintenance and Interruptions',
          description: 'We reserve the right to:',
          items: [
            'Perform scheduled or emergency maintenance',
            'Temporarily interrupt the service when necessary',
            'Modify, suspend, or discontinue any functionality',
          ],
        },
        warranties: {
          title: '9.2. No Warranties',
          description: 'AdvoSoft is provided "as is" and "as available". We do not guarantee that:',
          items: [
            'The service will always be available or error-free',
            'Results obtained will be accurate or reliable',
            'Any defect will be corrected',
            'The service will meet all your needs',
          ],
        },
      },
      liability: {
        title: '10. LIMITATION OF LIABILITY',
        exclusion: {
          title: '10.1. Exclusion of Damages',
          description: 'To the maximum extent permitted by law, we will not be responsible for:',
          items: [
            'Direct, indirect, incidental, special, or consequential damages',
            'Loss of profits, revenue, data, or business opportunities',
            'Business interruption or loss of information',
            'Damages resulting from use or inability to use the service',
            'Problems arising from integrations with third-party services',
            'Actions or omissions of third parties',
          ],
        },
        limit: {
          title: '10.2. Value Limitation',
          description: 'Our total liability, in any case, will not exceed the amount paid by you for services in the last 12 months.',
        },
      },
      indemnification: {
        title: '11. INDEMNIFICATION',
        description: 'You agree to indemnify, defend, and hold harmless AdvoSoft, its directors, employees, and partners from any claim, damage, obligation, loss, liability, cost, or expense (including attorney fees) arising from:',
        items: [
          'Your use of the service',
          'Violation of these Terms of Use',
          'Violation of third-party rights',
          'Content you create, send, or transmit through the service',
        ],
      },
      privacy: {
        title: '12. PRIVACY AND DATA PROTECTION',
        policy: {
          title: '12.1. Privacy Policy',
          description: 'Use of AdvoSoft is also subject to our Privacy Policy, which describes how we collect, use, and protect your personal data. By using the service, you agree to our Privacy Policy.',
        },
        lgpd: {
          title: '12.2. LGPD Compliance',
          description: 'We commit to complying with the General Data Protection Law (LGPD - Law No. 13.709/2018) and other applicable data protection laws.',
        },
      },
      modifications: {
        title: '13. TERM MODIFICATIONS',
        right: {
          title: '13.1. Right to Modify',
          description: 'We reserve the right to modify these Terms of Use at any time. Significant changes will be communicated through:',
          items: [
            'Platform notification',
            'Email to registered users',
            'Update of the "Last updated" date at the beginning of this document',
          ],
        },
        continuity: {
          title: '13.2. Continuity of Use',
          description: 'Continued use of AdvoSoft after modifications constitutes your acceptance of the new terms. If you do not agree with the modifications, you must cease using the service.',
        },
      },
      cancellation: {
        title: '14. CANCELLATION AND TERMINATION',
        byUser: {
          title: '14.1. Cancellation by You',
          description: 'You may cancel your account at any time through the platform settings or by contacting us.',
        },
        byUs: {
          title: '14.2. Termination by Us',
          description: 'We may suspend or terminate your account immediately, without prior notice, if you:',
          items: [
            'Violate these Terms of Use',
            'Use the service fraudulently or illegally',
            'Fail to pay due fees (when applicable)',
            'Create risk or legal exposure for us',
            'Violate policies of integrated third-party services',
          ],
        },
        effects: {
          title: '14.3. Termination Effects',
          description: 'After termination:',
          items: [
            'Your access to the service will be immediately terminated',
            'You may request a copy of your data (as permitted by law)',
            'Data may be deleted after legal retention period',
            'Provisions that by their nature must survive will remain in effect',
          ],
        },
      },
      data: {
        title: '15. DATA AND BACKUP',
        responsibility: {
          title: '15.1. Data Responsibility',
          description: 'You are responsible for maintaining backups of your important data. Although we make regular backups, we do not guarantee data recovery in case of loss.',
        },
        retention: {
          title: '15.2. Data Retention',
          description: 'We retain your data for as long as necessary to provide services and comply with legal obligations. After cancellation, we may retain data as required by law.',
        },
      },
      communications: {
        title: '16. COMMUNICATIONS',
        notifications: {
          title: '16.1. Notifications',
          description: 'By using AdvoSoft, you agree to receive electronic communications from us, including:',
          items: [
            'Service notifications',
            'Security updates',
            'Account information',
            'Marketing communications (you may opt out)',
          ],
        },
        form: {
          title: '16.2. Communication Form',
          description: 'Communications will be sent to the email address associated with your account or through platform notifications.',
        },
      },
      disputes: {
        title: '17. DISPUTES AND APPLICABLE LAW',
        law: {
          title: '17.1. Applicable Law',
          description: 'These Terms of Use are governed by the laws of Brazil, especially:',
          items: [
            'Consumer Defense Code (Law No. 8.078/1990)',
            'Internet Civil Framework (Law No. 12.965/2014)',
            'General Data Protection Law (LGPD - Law No. 13.709/2018)',
          ],
        },
        resolution: {
          title: '17.2. Dispute Resolution',
          description: 'In case of disputes, the parties commit to trying to resolve amicably. If not possible, disputes will be resolved:',
          items: [
            'First, through mediation (when applicable)',
            'Subsequently, by the competent courts of Matinhos - PR, Brazil',
          ],
        },
      },
      general: {
        title: '18. GENERAL PROVISIONS',
        completeness: {
          title: '18.1. Agreement Completeness',
          description: 'These Terms of Use, together with the Privacy Policy, constitute the complete agreement between you and AdvoSoft regarding the use of the service.',
        },
        divisibility: {
          title: '18.2. Divisibility',
          description: 'If any provision of these terms is considered invalid or unenforceable, the remaining provisions will remain in full force.',
        },
        waiver: {
          title: '18.3. Waiver',
          description: 'Failure to exercise any right or provision of these terms does not constitute a waiver of such right or provision.',
        },
        assignment: {
          title: '18.4. Assignment',
          description: 'You may not assign or transfer these terms without our prior written consent. We may assign these terms at any time.',
        },
        forceMajeure: {
          title: '18.5. Force Majeure',
          description: 'We will not be responsible for failures or delays in performance resulting from circumstances beyond our reasonable control, including natural disasters, war, terrorism, strikes, or infrastructure failures.',
        },
      },
      contact: {
        title: '19. CONTACT',
        description: 'For questions related to these Terms of Use, contact us:',
        email: 'renato.devmaximiano@gmail.com',
        phone: '+55 41 8728-0741',
        address: 'Rua Manoel Ferreira Gomes, número 55, Matinhos - PR, Brasil',
        hours: 'Monday to Sunday, 8:00 AM to 6:00 PM',
      },
      acceptance: {
        title: '20. ACCEPTANCE',
        description: 'By using AdvoSoft, you declare that:',
        items: [
          'You have read and understood these Terms of Use',
          'You agree to be bound by these terms',
          'You have legal capacity to enter into this agreement',
          'You are not violating any law or regulation by using the service',
        ],
        final: 'If you do not agree with these terms, please do not use AdvoSoft.',
      },
    },
    footer: '© 2025 AdvoSoft. All rights reserved.',
  },
};

export default function TermsPage() {
  const [language, setLanguage] = useState<Language>('pt');
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/login"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <HiOutlineHome className="w-5 h-5" />
              <span className="text-sm font-medium">{t.header.back}</span>
            </Link>
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <FlagIcon
                  country="br"
                  isActive={language === 'pt'}
                  onClick={() => setLanguage('pt')}
                />
                <FlagIcon
                  country="us"
                  isActive={language === 'en'}
                  onClick={() => setLanguage('en')}
                />
              </div>
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">AdvoSoft</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Section */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            {t.title.main}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
            {t.title.subtitle}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {t.title.lastUpdate}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 lg:p-12">
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-ul:text-slate-700 dark:prose-ul:text-slate-300 prose-li:my-2 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline">
            
            {/* 1. ACEITAÇÃO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.acceptance.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{t.sections.acceptance.p1}</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.acceptance.p2}</p>
            </section>

            {/* 2. DESCRIÇÃO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.description.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{t.sections.description.intro}</p>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.description.features.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.description.features.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.description.technologies.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.description.technologies.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 3. CADASTRO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.registration.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.registration.requirements.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.registration.requirements.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.registration.requirements.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.registration.authentication.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.registration.authentication.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.registration.individual.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.registration.individual.description}</p>
            </section>

            {/* 4. USO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.usage.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.usage.allowed.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.usage.allowed.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.usage.allowed.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.usage.prohibited.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.usage.prohibited.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.usage.prohibited.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.usage.content.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.usage.content.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">
                {t.sections.usage.content.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 pl-4 py-2 rounded-r">
                {t.sections.usage.content.oab}
              </p>
            </section>

            {/* 5. INTEGRAÇÕES */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.integrations.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.integrations.whatsapp.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.integrations.whatsapp.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.integrations.instagram.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.integrations.instagram.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.integrations.google.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">
                {t.sections.integrations.google.items.slice(0, 3).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
                <li>
                  {t.sections.integrations.google.items[3]}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {t.sections.integrations.google.policyLink}
                  </a>
                </li>
                {t.sections.integrations.google.itemsEnd.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 rounded-r">
                {t.sections.integrations.google.declaration}
              </p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.integrations.other.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.integrations.other.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 6. IA */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.ai.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.ai.responses.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.ai.responses.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.ai.responses.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.ai.models.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.ai.models.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.ai.models.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.ai.limitation.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.ai.limitation.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">
                {t.sections.ai.limitation.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 pl-4 py-2 rounded-r">
                {t.sections.ai.limitation.hallucinations}
              </p>
            </section>

            {/* 7. PROPRIEDADE INTELECTUAL */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.intellectual.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.intellectual.advosoft.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.intellectual.advosoft.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.intellectual.userData.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.intellectual.userData.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.intellectual.userData.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.intellectual.feedback.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.intellectual.feedback.description}</p>
            </section>

            {/* 8. PAGAMENTOS */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.payments.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.payments.plans.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.payments.plans.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.payments.renewal.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.payments.renewal.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.payments.refunds.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.payments.refunds.description}</p>
            </section>

            {/* 9. DISPONIBILIDADE */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.availability.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.availability.maintenance.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.availability.maintenance.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.availability.maintenance.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.availability.warranties.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.availability.warranties.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.availability.warranties.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 10. LIMITAÇÃO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.liability.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.liability.exclusion.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.liability.exclusion.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.liability.exclusion.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.liability.limit.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.liability.limit.description}</p>
            </section>

            {/* 11. INDENIZAÇÃO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.indemnification.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.indemnification.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.indemnification.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 12. PRIVACIDADE */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.privacy.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.privacy.policy.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.privacy.policy.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.privacy.lgpd.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.privacy.lgpd.description}</p>
            </section>

            {/* 13. MODIFICAÇÕES */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.modifications.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.modifications.right.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.modifications.right.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.modifications.right.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.modifications.continuity.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.modifications.continuity.description}</p>
            </section>

            {/* 14. CANCELAMENTO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.cancellation.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.cancellation.byUser.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.cancellation.byUser.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.cancellation.byUs.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.cancellation.byUs.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.cancellation.byUs.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.cancellation.effects.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.cancellation.effects.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.cancellation.effects.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 15. DADOS */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.data.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.data.responsibility.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.data.responsibility.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.data.retention.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.data.retention.description}</p>
            </section>

            {/* 16. COMUNICAÇÕES */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.communications.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.communications.notifications.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.communications.notifications.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.communications.notifications.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.communications.form.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.communications.form.description}</p>
            </section>

            {/* 17. DISPUTAS */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.disputes.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.disputes.law.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.disputes.law.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.disputes.law.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.disputes.resolution.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.disputes.resolution.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.disputes.resolution.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 18. DISPOSIÇÕES GERAIS */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.general.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.general.completeness.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.general.completeness.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.general.divisibility.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.general.divisibility.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.general.waiver.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.general.waiver.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.general.assignment.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.general.assignment.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.general.forceMajeure.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.general.forceMajeure.description}</p>
            </section>

            {/* 19. CONTATO */}
            <section className="mb-8 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.contact.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{t.sections.contact.description}</p>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <p><strong className="text-slate-900 dark:text-slate-100">Email:</strong> <a href={`mailto:${t.sections.contact.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{t.sections.contact.email}</a></p>
                <p><strong className="text-slate-900 dark:text-slate-100">{language === 'pt' ? 'Telefone' : 'Phone'}:</strong> {t.sections.contact.phone}</p>
                <p><strong className="text-slate-900 dark:text-slate-100">{language === 'pt' ? 'Endereço' : 'Address'}:</strong> {t.sections.contact.address}</p>
                <p><strong className="text-slate-900 dark:text-slate-100">{language === 'pt' ? 'Horário de atendimento' : 'Business hours'}:</strong> {t.sections.contact.hours}</p>
              </div>
            </section>

            {/* 20. ACEITAÇÃO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.acceptance.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.acceptance.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">
                {t.sections.acceptance.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.acceptance.final}</p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>{t.footer}</p>
        </div>
      </main>
    </div>
  );
}
