'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HiOutlineShieldCheck, HiOutlineHome } from 'react-icons/hi2';

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
      title: 'Política de Privacidade | AdvoSoft',
      description: 'Política de Privacidade do AdvoSoft - Sistema de Gerenciamento de Relacionamento com Clientes',
    },
    header: {
      back: 'Voltar ao início',
    },
    title: {
      main: 'Política de Privacidade',
      subtitle: 'AdvoSoft - Sistema de Gerenciamento de Relacionamento com Clientes',
      lastUpdate: 'Última atualização: 15 de janeiro de 2025',
    },
    sections: {
      introduction: {
        title: '1. INTRODUÇÃO',
        p1: 'Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nosso sistema de CRM (Customer Relationship Management) para gerenciamento de conversas e atendimento via WhatsApp Business API e Instagram Direct Messages.',
        p2: 'Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política. Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis.',
      },
      dataCollected: {
        title: '2. DADOS COLETADOS',
        contacts: {
          title: '2.1. Dados de Contatos e Clientes',
          description: 'Coletamos e armazenamos as seguintes informações sobre contatos e clientes que interagem conosco através do WhatsApp e Instagram:',
          items: [
            'Número de telefone (WhatsApp) ou identificador do Instagram',
            'Nome do contato/cliente',
            'Histórico completo de mensagens trocadas (texto, áudio, imagem, vídeo, documentos)',
            'Transcrições de mensagens de áudio (quando aplicável)',
            'Data e hora de cada mensagem',
            'Status do contato no funil de vendas/atendimento',
            'Tags e categorizações (Urgente, Importante, Cliente, Prospecto, etc.)',
            'Notas e informações adicionais do caso',
            'Nome completo (quando fornecido)',
            'Resumo do caso ou situação',
            'Informações sobre produtos ou serviços de interesse',
            'Dados de agendamentos (nome, data, horário, duração, notas)',
          ],
        },
        users: {
          title: '2.2. Dados de Usuários do Sistema',
          description: 'Para usuários que acessam a plataforma CRM, coletamos:',
          items: [
            'Email (através de autenticação OAuth com Google)',
            'Nome completo',
            'Foto de perfil (quando disponível)',
            'Tokens de autenticação e sessão',
            'Preferências de uso do sistema',
          ],
        },
        integrations: {
          title: '2.3. Dados de Integrações',
          items: [
            'Credenciais de acesso para integrações (Google Calendar, Google Ads)',
            'Dados sincronizados de calendários (eventos, agendamentos)',
            'Dados de campanhas publicitárias (quando aplicável)',
            'Informações de contas vinculadas',
          ],
        },
        technical: {
          title: '2.4. Dados Técnicos',
          items: [
            'Endereço IP',
            'Tipo de navegador e dispositivo',
            'Logs de acesso e uso do sistema',
            'Cookies e tecnologias similares',
            'Dados de performance e erros do sistema',
          ],
        },
      },
      purpose: {
        title: '3. FINALIDADE DO USO DOS DADOS',
        description: 'Utilizamos os dados coletados para as seguintes finalidades:',
        services: {
          title: '3.1. Prestação de Serviços',
          items: [
            'Gerenciamento de conversas e atendimento ao cliente',
            'Armazenamento e organização do histórico de comunicações',
            'Processamento e resposta automática de mensagens através de Inteligência Artificial',
            'Criação e gerenciamento de agendamentos',
            'Sincronização com calendários (Google Calendar)',
            'Envio de campanhas de marketing via WhatsApp e Email',
            'Gerenciamento de produtos e serviços',
            'Geração de relatórios e análises',
          ],
        },
        improvement: {
          title: '3.2. Melhoria dos Serviços',
          items: [
            'Análise de padrões de comunicação',
            'Otimização de respostas automáticas',
            'Melhoria da experiência do usuário',
            'Desenvolvimento de novas funcionalidades',
          ],
        },
        legal: {
          title: '3.3. Conformidade Legal',
          items: [
            'Cumprimento de obrigações legais e regulatórias',
            'Resposta a solicitações de autoridades competentes',
            'Proteção de direitos e segurança',
          ],
        },
      },
      legalBasis: {
        title: '4. BASE LEGAL PARA PROCESSAMENTO',
        description: 'O processamento de dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:',
        items: [
          'Execução de contrato ou procedimentos preliminares (Art. 7º, V)',
          'Cumprimento de obrigação legal ou regulatória (Art. 7º, II)',
          'Legítimo interesse (Art. 7º, IX)',
          'Consentimento do titular (Art. 7º, I)',
        ],
      },
      sharing: {
        title: '5. COMPARTILHAMENTO DE DADOS',
        providers: {
          title: '5.1. Prestadores de Serviços',
          description: 'Compartilhamos dados com os seguintes prestadores de serviço, que atuam como operadores de dados:',
          items: [
            'MongoDB (armazenamento de dados)',
            'Google Cloud Platform (autenticação, Google Calendar, Google Ads)',
            'Meta/Facebook (WhatsApp Business API, Instagram Graph API)',
            'Cloudinary (armazenamento de imagens e mídias)',
            'Ollama (processamento de IA local, quando aplicável)',
            'OpenAI (processamento de IA, quando configurado)',
          ],
        },
        integrations: {
          title: '5.2. Integrações Autorizadas',
          items: [
            'Google Calendar: para sincronização de agendamentos',
            'Google Ads: para gerenciamento de campanhas publicitárias',
            'Serviços de email (SMTP): para envio de campanhas',
          ],
        },
        legal: {
          title: '5.3. Requisições Legais',
          description: 'Podemos compartilhar dados quando exigido por lei, ordem judicial ou solicitação de autoridade competente.',
        },
        international: {
          title: '5.4. Transferências Internacionais',
          description: 'Alguns dados podem ser processados e armazenados em servidores localizados fora do Brasil. Nesses casos, garantimos que os prestadores de serviço adotem medidas adequadas de proteção de dados.',
        },
      },
      googleAPIs: {
        title: '6. USO DE DADOS DE APIs DO GOOGLE',
        description: 'O AdvoSoft utiliza as APIs do Google para fornecer funcionalidades de gerenciamento de campanhas publicitárias (Google Ads) e organização de agenda (Google Calendar).',
        limitedUse: {
          title: '6.1. Uso Limitado (Limited Use)',
          description: 'O uso e a transferência de informações recebidas das APIs do Google para qualquer outro aplicativo obedecerão à ',
          policyLink: 'Política de Dados do Usuário dos Serviços de API do Google',
          descriptionEnd: ', incluindo os requisitos de Uso Limitado.',
        },
        ads: {
          title: '6.2. Finalidade Específica - Google Ads',
          description: 'Os dados do Google Ads (métricas, termos de pesquisa e campanhas) são acessados estritamente para visualização e gestão pelo usuário dentro do CRM. Esses dados não são compartilhados com modelos de inteligência artificial de terceiros (como OpenAI) para fins de treinamento, nem são vendidos ou utilizados para traçar perfis de usuários fora do contexto da própria conta do advogado.',
        },
        calendar: {
          title: '6.3. Finalidade Específica - Google Calendar',
          description: 'O acesso à agenda destina-se exclusivamente à criação e edição de eventos de agendamento solicitados pelo usuário através da automação de atendimento. Os dados do calendário são utilizados apenas para sincronização de agendamentos e não são compartilhados com terceiros ou utilizados para outros fins além da gestão de agenda do próprio usuário.',
        },
      },
      security: {
        title: '7. SEGURANÇA DOS DADOS',
        description: 'Implementamos medidas técnicas e organizacionais para proteger seus dados pessoais:',
        items: [
          'Criptografia de dados em trânsito (HTTPS/TLS)',
          'Criptografia de dados sensíveis em repouso',
          'Controle de acesso baseado em autenticação',
          'Monitoramento de segurança e detecção de anomalias',
          'Backups regulares e planos de recuperação',
          'Restrições de acesso baseadas em necessidade de conhecimento',
          'Atualizações regulares de segurança',
        ],
      },
      retention: {
        title: '8. RETENÇÃO DE DADOS',
        description: 'Mantemos os dados pessoais pelo tempo necessário para:',
        items: [
          'Cumprir as finalidades descritas nesta política',
          'Atender a obrigações legais, contratuais ou regulatórias',
          'Resolver disputas e fazer cumprir nossos acordos',
        ],
        after: 'Após o término do período de retenção, os dados serão excluídos ou anonimizados de forma segura, exceto quando a retenção for exigida por lei.',
      },
      ai: {
        title: '9. INTELIGÊNCIA ARTIFICIAL E AUTOMAÇÃO',
        responses: {
          title: '9.1. Respostas Automáticas',
          description: 'Utilizamos Inteligência Artificial (IA) para gerar respostas automáticas às mensagens recebidas. Os modelos de IA podem ser:',
          models: ['Ollama (processamento local)', 'OpenAI (processamento em nuvem)'],
          basedOn: 'As respostas são geradas com base em:',
          basedOnItems: [
            'Histórico de conversas',
            'Prompts configuráveis',
            'Contexto do atendimento',
            'Informações do contato',
          ],
        },
        audio: {
          title: '9.2. Processamento de Áudio',
          description: 'Mensagens de áudio podem ser transcritas automaticamente usando tecnologias de reconhecimento de voz para facilitar o processamento e resposta.',
        },
        improvement: {
          title: '9.3. Análise e Melhoria',
          description: 'Utilizamos os dados de interação para melhorar continuamente a qualidade das respostas automáticas e do atendimento.',
        },
      },
      cookies: {
        title: '10. COOKIES E TECNOLOGIAS SIMILARES',
        description: 'Utilizamos cookies e tecnologias similares para:',
        items: [
          'Manter sessões de usuário autenticadas',
          'Armazenar preferências do usuário',
          'Melhorar a performance e funcionalidade do sistema',
          'Coletar dados analíticos (de forma anonimizada)',
        ],
        manage: 'Você pode gerenciar as preferências de cookies através das configurações do seu navegador.',
      },
      rights: {
        title: '11. DIREITOS DO TITULAR DOS DADOS',
        description: 'De acordo com a LGPD, você possui os seguintes direitos:',
        items: [
          { title: '11.1. Confirmação e Acesso', description: 'Direito de obter confirmação sobre o tratamento de dados e acesso aos dados pessoais.' },
          { title: '11.2. Correção', description: 'Direito de solicitar a correção de dados incompletos, inexatos ou desatualizados.' },
          { title: '11.3. Anonimização, Bloqueio ou Eliminação', description: 'Direito de solicitar a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.' },
          { title: '11.4. Portabilidade', description: 'Direito de solicitar a portabilidade dos dados para outro fornecedor de serviço.' },
          { title: '11.5. Eliminação', description: 'Direito de solicitar a eliminação dos dados pessoais tratados com base no consentimento.' },
          { title: '11.6. Informação sobre Compartilhamento', description: 'Direito de obter informações sobre entidades públicas e privadas com as quais compartilhamos dados.' },
          { title: '11.7. Revogação do Consentimento', description: 'Direito de revogar o consentimento a qualquer momento.' },
          { title: '11.8. Oposição', description: 'Direito de se opor ao tratamento de dados em determinadas circunstâncias.' },
        ],
        contact: 'Para exercer seus direitos, entre em contato conosco através dos canais indicados na seção "Contato" desta política.',
      },
      minors: {
        title: '12. MENORES DE IDADE',
        description: 'Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente dados pessoais de menores. Se tomarmos conhecimento de que coletamos dados de um menor sem o consentimento adequado, tomaremos medidas para excluir essas informações.',
      },
      changes: {
        title: '13. ALTERAÇÕES NESTA POLÍTICA',
        description: 'Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas através de:',
        items: [
          'Aviso em nosso sistema',
          'Email para usuários cadastrados',
          'Atualização da data de "Última atualização" no início desta política',
        ],
        recommend: 'Recomendamos que você revise esta política periodicamente para se manter informado sobre como protegemos seus dados.',
      },
      dpo: {
        title: '14. ENCARREGADO DE PROTEÇÃO DE DADOS (DPO)',
        description: 'Para questões relacionadas à proteção de dados pessoais, você pode entrar em contato com nosso Encarregado de Proteção de Dados (DPO) através dos canais indicados na seção "Contato".',
      },
      contact: {
        title: '15. CONTATO',
        description: 'Para exercer seus direitos, fazer perguntas sobre esta política ou reportar preocupações relacionadas à privacidade, entre em contato conosco:',
        email: 'renato.devmaximiano@gmail.com',
        phone: '+55 41 8728-0741',
        address: 'Rua Manoel Ferreira Gomes, número 55, Matinhos - PR, Brasil',
        hours: 'Segunda a domingo, das 8:00 às 18:00',
      },
      legislation: {
        title: '16. LEGISLAÇÃO APLICÁVEL',
        description: 'Esta política é regida pela legislação brasileira, especialmente pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e pelo Marco Civil da Internet (Lei nº 12.965/2014).',
      },
      consent: {
        title: '17. CONSENTIMENTO',
        description: 'Ao utilizar nossos serviços, você declara ter lido, compreendido e concordado com esta Política de Privacidade. Se você não concordar com esta política, por favor, não utilize nossos serviços.',
      },
      appendix: {
        title: 'ANEXO: DETALHAMENTO TÉCNICO',
        whatsapp: {
          title: 'A. Dados Coletados via WhatsApp Business API',
          items: [
            'wa_id (identificador único do WhatsApp)',
            'Nome do perfil do WhatsApp',
            'Conteúdo das mensagens (texto, mídias)',
            'Metadados das mensagens (timestamp, tipo, IDs)',
            'Status de entrega e leitura (quando disponível)',
          ],
        },
        instagram: {
          title: 'B. Dados Coletados via Instagram Graph API',
          items: [
            'Instagram ID',
            'Username do Instagram',
            'Conteúdo das mensagens diretas',
            'Metadados das mensagens',
          ],
        },
        storage: {
          title: 'C. Armazenamento',
          items: [
            'Banco de dados: MongoDB (coleção: crm-db)',
            'Mídias: Cloudinary e GridFS (MongoDB)',
            'Logs: Armazenados de forma segura e com retenção limitada',
          ],
        },
        ai: {
          title: 'D. Processamento de IA',
          items: [
            'Modelos utilizados: Ollama (llama3.1:8b) ou OpenAI (gpt-4o-mini)',
            'Processamento: Local (Ollama) ou em nuvem (OpenAI)',
            'Dados processados: Histórico de conversas, contexto do atendimento',
            'Retenção de contexto: Durante a sessão de atendimento',
          ],
        },
        integrations: {
          title: 'E. Integrações de Terceiros',
          items: [
            'Google Calendar: Sincronização de agendamentos (OAuth 2.0)',
            'Google Ads: Gerenciamento de campanhas (OAuth 2.0)',
            'Cloudinary: Armazenamento de imagens',
            'Meta/Facebook: WhatsApp Business API e Instagram Graph API',
          ],
        },
        security: {
          title: 'F. Medidas de Segurança Técnicas',
          items: [
            'Autenticação OAuth 2.0',
            'Tokens de acesso com expiração',
            'Validação de webhooks',
            'Rate limiting',
            'Sanitização de inputs',
            'Validação de dados',
          ],
        },
      },
    },
    footer: '© 2025 AdvoSoft. Todos os direitos reservados.',
  },
  en: {
    metadata: {
      title: 'Privacy Policy | AdvoSoft',
      description: 'AdvoSoft Privacy Policy - Customer Relationship Management System',
    },
    header: {
      back: 'Back to home',
    },
    title: {
      main: 'Privacy Policy',
      subtitle: 'AdvoSoft - Customer Relationship Management System',
      lastUpdate: 'Last updated: January 15, 2025',
    },
    sections: {
      introduction: {
        title: '1. INTRODUCTION',
        p1: 'This Privacy Policy describes how we collect, use, store, and protect your personal information when you use our CRM (Customer Relationship Management) system for managing conversations and customer service via WhatsApp Business API and Instagram Direct Messages.',
        p2: 'By using our services, you agree to the collection and use of information in accordance with this policy. This policy complies with the General Data Protection Law (LGPD - Law No. 13.709/2018) and other applicable legislation.',
      },
      dataCollected: {
        title: '2. DATA COLLECTED',
        contacts: {
          title: '2.1. Contact and Customer Data',
          description: 'We collect and store the following information about contacts and customers who interact with us through WhatsApp and Instagram:',
          items: [
            'Phone number (WhatsApp) or Instagram identifier',
            'Contact/customer name',
            'Complete history of exchanged messages (text, audio, image, video, documents)',
            'Audio message transcriptions (when applicable)',
            'Date and time of each message',
            'Contact status in the sales/service funnel',
            'Tags and categorizations (Urgent, Important, Client, Prospect, etc.)',
            'Notes and additional case information',
            'Full name (when provided)',
            'Case summary or situation',
            'Information about products or services of interest',
            'Appointment data (name, date, time, duration, notes)',
          ],
        },
        users: {
          title: '2.2. System User Data',
          description: 'For users who access the CRM platform, we collect:',
          items: [
            'Email (through OAuth authentication with Google)',
            'Full name',
            'Profile picture (when available)',
            'Authentication and session tokens',
            'System usage preferences',
          ],
        },
        integrations: {
          title: '2.3. Integration Data',
          items: [
            'Access credentials for integrations (Google Calendar, Google Ads)',
            'Synchronized calendar data (events, appointments)',
            'Advertising campaign data (when applicable)',
            'Linked account information',
          ],
        },
        technical: {
          title: '2.4. Technical Data',
          items: [
            'IP address',
            'Browser and device type',
            'System access and usage logs',
            'Cookies and similar technologies',
            'System performance and error data',
          ],
        },
      },
      purpose: {
        title: '3. PURPOSE OF DATA USE',
        description: 'We use the collected data for the following purposes:',
        services: {
          title: '3.1. Service Provision',
          items: [
            'Conversation management and customer service',
            'Storage and organization of communication history',
            'Processing and automatic response to messages through Artificial Intelligence',
            'Creation and management of appointments',
            'Synchronization with calendars (Google Calendar)',
            'Marketing campaign sending via WhatsApp and Email',
            'Product and service management',
            'Report and analysis generation',
          ],
        },
        improvement: {
          title: '3.2. Service Improvement',
          items: [
            'Communication pattern analysis',
            'Automatic response optimization',
            'User experience improvement',
            'Development of new features',
          ],
        },
        legal: {
          title: '3.3. Legal Compliance',
          items: [
            'Compliance with legal and regulatory obligations',
            'Response to requests from competent authorities',
            'Protection of rights and security',
          ],
        },
      },
      legalBasis: {
        title: '4. LEGAL BASIS FOR PROCESSING',
        description: 'Personal data processing is carried out based on the following legal grounds provided for in the LGPD:',
        items: [
          'Contract execution or preliminary procedures (Art. 7, V)',
          'Compliance with legal or regulatory obligation (Art. 7, II)',
          'Legitimate interest (Art. 7, IX)',
          'Data subject consent (Art. 7, I)',
        ],
      },
      sharing: {
        title: '5. DATA SHARING',
        providers: {
          title: '5.1. Service Providers',
          description: 'We share data with the following service providers, who act as data processors:',
          items: [
            'MongoDB (data storage)',
            'Google Cloud Platform (authentication, Google Calendar, Google Ads)',
            'Meta/Facebook (WhatsApp Business API, Instagram Graph API)',
            'Cloudinary (image and media storage)',
            'Ollama (local AI processing, when applicable)',
            'OpenAI (AI processing, when configured)',
          ],
        },
        integrations: {
          title: '5.2. Authorized Integrations',
          items: [
            'Google Calendar: for appointment synchronization',
            'Google Ads: for advertising campaign management',
            'Email services (SMTP): for campaign sending',
          ],
        },
        legal: {
          title: '5.3. Legal Requests',
          description: 'We may share data when required by law, court order, or request from a competent authority.',
        },
        international: {
          title: '5.4. International Transfers',
          description: 'Some data may be processed and stored on servers located outside Brazil. In these cases, we ensure that service providers adopt adequate data protection measures.',
        },
      },
      googleAPIs: {
        title: '6. USE OF GOOGLE API DATA',
        description: 'AdvoSoft uses Google APIs to provide advertising campaign management (Google Ads) and calendar organization (Google Calendar) functionalities.',
        limitedUse: {
          title: '6.1. Limited Use',
          description: 'The use and transfer of information received from Google APIs to any other application will comply with the ',
          policyLink: 'Google API Services User Data Policy',
          descriptionEnd: ', including Limited Use requirements.',
        },
        ads: {
          title: '6.2. Specific Purpose - Google Ads',
          description: 'Google Ads data (metrics, search terms, and campaigns) is accessed strictly for viewing and management by the user within the CRM. This data is not shared with third-party artificial intelligence models (such as OpenAI) for training purposes, nor is it sold or used to profile users outside the context of the lawyer\'s own account.',
        },
        calendar: {
          title: '6.3. Specific Purpose - Google Calendar',
          description: 'Calendar access is intended exclusively for creating and editing appointment events requested by the user through customer service automation. Calendar data is used only for appointment synchronization and is not shared with third parties or used for purposes other than the user\'s own calendar management.',
        },
      },
      security: {
        title: '7. DATA SECURITY',
        description: 'We implement technical and organizational measures to protect your personal data:',
        items: [
          'Data encryption in transit (HTTPS/TLS)',
          'Encryption of sensitive data at rest',
          'Authentication-based access control',
          'Security monitoring and anomaly detection',
          'Regular backups and recovery plans',
          'Access restrictions based on need-to-know',
          'Regular security updates',
        ],
      },
      retention: {
        title: '8. DATA RETENTION',
        description: 'We retain personal data for as long as necessary to:',
        items: [
          'Fulfill the purposes described in this policy',
          'Meet legal, contractual, or regulatory obligations',
          'Resolve disputes and enforce our agreements',
        ],
        after: 'After the retention period ends, data will be securely deleted or anonymized, except when retention is required by law.',
      },
      ai: {
        title: '9. ARTIFICIAL INTELLIGENCE AND AUTOMATION',
        responses: {
          title: '9.1. Automatic Responses',
          description: 'We use Artificial Intelligence (AI) to generate automatic responses to received messages. AI models may be:',
          models: ['Ollama (local processing)', 'OpenAI (cloud processing)'],
          basedOn: 'Responses are generated based on:',
          basedOnItems: [
            'Conversation history',
            'Configurable prompts',
            'Service context',
            'Contact information',
          ],
        },
        audio: {
          title: '9.2. Audio Processing',
          description: 'Audio messages may be automatically transcribed using voice recognition technologies to facilitate processing and response.',
        },
        improvement: {
          title: '9.3. Analysis and Improvement',
          description: 'We use interaction data to continuously improve the quality of automatic responses and customer service.',
        },
      },
      cookies: {
        title: '10. COOKIES AND SIMILAR TECHNOLOGIES',
        description: 'We use cookies and similar technologies to:',
        items: [
          'Maintain authenticated user sessions',
          'Store user preferences',
          'Improve system performance and functionality',
          'Collect analytical data (anonymized)',
        ],
        manage: 'You can manage cookie preferences through your browser settings.',
      },
      rights: {
        title: '11. DATA SUBJECT RIGHTS',
        description: 'According to the LGPD, you have the following rights:',
        items: [
          { title: '11.1. Confirmation and Access', description: 'Right to obtain confirmation about data processing and access to personal data.' },
          { title: '11.2. Correction', description: 'Right to request correction of incomplete, inaccurate, or outdated data.' },
          { title: '11.3. Anonymization, Blocking, or Elimination', description: 'Right to request anonymization, blocking, or elimination of unnecessary, excessive, or data processed in non-compliance with the LGPD.' },
          { title: '11.4. Portability', description: 'Right to request data portability to another service provider.' },
          { title: '11.5. Elimination', description: 'Right to request elimination of personal data processed based on consent.' },
          { title: '11.6. Information about Sharing', description: 'Right to obtain information about public and private entities with which we share data.' },
          { title: '11.7. Consent Revocation', description: 'Right to revoke consent at any time.' },
          { title: '11.8. Opposition', description: 'Right to oppose data processing under certain circumstances.' },
        ],
        contact: 'To exercise your rights, contact us through the channels indicated in the "Contact" section of this policy.',
      },
      minors: {
        title: '12. MINORS',
        description: 'Our services are not directed to minors under 18 years of age. We do not intentionally collect personal data from minors. If we become aware that we have collected data from a minor without adequate consent, we will take measures to delete such information.',
      },
      changes: {
        title: '13. CHANGES TO THIS POLICY',
        description: 'We may update this Privacy Policy periodically. We will notify you of significant changes through:',
        items: [
          'Notice in our system',
          'Email to registered users',
          'Update of the "Last updated" date at the beginning of this policy',
        ],
        recommend: 'We recommend that you review this policy periodically to stay informed about how we protect your data.',
      },
      dpo: {
        title: '14. DATA PROTECTION OFFICER (DPO)',
        description: 'For questions related to personal data protection, you can contact our Data Protection Officer (DPO) through the channels indicated in the "Contact" section.',
      },
      contact: {
        title: '15. CONTACT',
        description: 'To exercise your rights, ask questions about this policy, or report privacy concerns, contact us:',
        email: 'renato.devmaximiano@gmail.com',
        phone: '+55 41 8728-0741',
        address: 'Rua Manoel Ferreira Gomes, número 55, Matinhos - PR, Brasil',
        hours: 'Monday to Sunday, 8:00 AM to 6:00 PM',
      },
      legislation: {
        title: '16. APPLICABLE LEGISLATION',
        description: 'This policy is governed by Brazilian legislation, especially the General Data Protection Law (LGPD - Law No. 13.709/2018) and the Internet Civil Framework (Law No. 12.965/2014).',
      },
      consent: {
        title: '17. CONSENT',
        description: 'By using our services, you declare that you have read, understood, and agreed to this Privacy Policy. If you do not agree with this policy, please do not use our services.',
      },
      appendix: {
        title: 'APPENDIX: TECHNICAL DETAILS',
        whatsapp: {
          title: 'A. Data Collected via WhatsApp Business API',
          items: [
            'wa_id (unique WhatsApp identifier)',
            'WhatsApp profile name',
            'Message content (text, media)',
            'Message metadata (timestamp, type, IDs)',
            'Delivery and read status (when available)',
          ],
        },
        instagram: {
          title: 'B. Data Collected via Instagram Graph API',
          items: [
            'Instagram ID',
            'Instagram username',
            'Direct message content',
            'Message metadata',
          ],
        },
        storage: {
          title: 'C. Storage',
          items: [
            'Database: MongoDB (collection: crm-db)',
            'Media: Cloudinary and GridFS (MongoDB)',
            'Logs: Stored securely with limited retention',
          ],
        },
        ai: {
          title: 'D. AI Processing',
          items: [
            'Models used: Ollama (llama3.1:8b) or OpenAI (gpt-4o-mini)',
            'Processing: Local (Ollama) or cloud (OpenAI)',
            'Data processed: Conversation history, service context',
            'Context retention: During the service session',
          ],
        },
        integrations: {
          title: 'E. Third-Party Integrations',
          items: [
            'Google Calendar: Appointment synchronization (OAuth 2.0)',
            'Google Ads: Campaign management (OAuth 2.0)',
            'Cloudinary: Image storage',
            'Meta/Facebook: WhatsApp Business API and Instagram Graph API',
          ],
        },
        security: {
          title: 'F. Technical Security Measures',
          items: [
            'OAuth 2.0 authentication',
            'Access tokens with expiration',
            'Webhook validation',
            'Rate limiting',
            'Input sanitization',
            'Data validation',
          ],
        },
      },
    },
    footer: '© 2025 AdvoSoft. All rights reserved.',
  },
};

export default function PrivacyPage() {
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
                <HiOutlineShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
            
            {/* 1. INTRODUÇÃO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.introduction.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{t.sections.introduction.p1}</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.introduction.p2}</p>
            </section>

            {/* 2. DADOS COLETADOS */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.dataCollected.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.dataCollected.contacts.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.dataCollected.contacts.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.dataCollected.contacts.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.dataCollected.users.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.dataCollected.users.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.dataCollected.users.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.dataCollected.integrations.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.dataCollected.integrations.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.dataCollected.technical.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.dataCollected.technical.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 3. FINALIDADE */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.purpose.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{t.sections.purpose.description}</p>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.purpose.services.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.purpose.services.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.purpose.improvement.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.purpose.improvement.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.purpose.legal.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.purpose.legal.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 4. BASE LEGAL */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.legalBasis.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.legalBasis.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.legalBasis.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 5. COMPARTILHAMENTO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.sharing.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.sharing.providers.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.sharing.providers.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.sharing.providers.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.sharing.integrations.title}</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.sharing.integrations.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.sharing.legal.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.sharing.legal.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.sharing.international.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.sharing.international.description}</p>
            </section>

            {/* 6. GOOGLE APIs */}
            <section className="mb-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.googleAPIs.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{t.sections.googleAPIs.description}</p>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.googleAPIs.limitedUse.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {t.sections.googleAPIs.limitedUse.description}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {t.sections.googleAPIs.limitedUse.policyLink}
                </a>
                {t.sections.googleAPIs.limitedUse.descriptionEnd}
              </p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.googleAPIs.ads.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.googleAPIs.ads.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.googleAPIs.calendar.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.googleAPIs.calendar.description}</p>
            </section>

            {/* 7. SEGURANÇA */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.security.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.security.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.security.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>

            {/* 8. RETENÇÃO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.retention.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.retention.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">
                {t.sections.retention.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.retention.after}</p>
            </section>

            {/* 9. IA */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.ai.title}</h2>
              
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.ai.responses.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.ai.responses.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">
                {t.sections.ai.responses.models.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.ai.responses.basedOn}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                {t.sections.ai.responses.basedOnItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.ai.audio.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.ai.audio.description}</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">{t.sections.ai.improvement.title}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.ai.improvement.description}</p>
            </section>

            {/* 10. COOKIES */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.cookies.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.cookies.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">
                {t.sections.cookies.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.cookies.manage}</p>
            </section>

            {/* 11. DIREITOS */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.rights.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{t.sections.rights.description}</p>
              
              <div className="space-y-4">
                {t.sections.rights.items.map((item, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{item.title}</h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
              
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">{t.sections.rights.contact}</p>
            </section>

            {/* 12. MENORES */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.minors.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.minors.description}</p>
            </section>

            {/* 13. ALTERAÇÕES */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.changes.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{t.sections.changes.description}</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">
                {t.sections.changes.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.changes.recommend}</p>
            </section>

            {/* 14. DPO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.dpo.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.dpo.description}</p>
            </section>

            {/* 15. CONTATO */}
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

            {/* 16. LEGISLAÇÃO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.legislation.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.legislation.description}</p>
            </section>

            {/* 17. CONSENTIMENTO */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.sections.consent.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{t.sections.consent.description}</p>
            </section>

            {/* ANEXO */}
            <section className="mb-8 mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t.sections.appendix.title}</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.sections.appendix.whatsapp.title}</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    {t.sections.appendix.whatsapp.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.sections.appendix.instagram.title}</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    {t.sections.appendix.instagram.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.sections.appendix.storage.title}</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    {t.sections.appendix.storage.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.sections.appendix.ai.title}</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    {t.sections.appendix.ai.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.sections.appendix.integrations.title}</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    {t.sections.appendix.integrations.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.sections.appendix.security.title}</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    {t.sections.appendix.security.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
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
