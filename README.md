# TaskFlow

Sistema completo de gerenciamento de projetos e tarefas com colaboração em equipe.

![TaskFlow](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Sobre

TaskFlow é uma aplicação web moderna para gerenciamento de projetos e tarefas. Permite criar projetos, adicionar tarefas com diferentes status e prioridades, e convidar colaboradores através de um sistema de User ID único.

## Funcionalidades

- **Autenticação Completa**: Cadastro e login com email/senha via Supabase Auth
- **Gestão de Projetos**: Criar, editar e excluir projetos com cores personalizadas
- **Quadro de Tarefas**: Sistema Kanban com colunas (A Fazer, Em Progresso, Revisão, Concluído)
- **Prioridades**: Classificação de tarefas por prioridade (Baixa, Média, Alta, Urgente)
- **Colaboração**: Convide membros usando o User ID único de cada usuário
- **Perfil Personalizável**: Upload de foto de perfil
- **Responsivo**: Funciona em desktop, tablet e mobile
- **User ID Único**: Cada usuário possui um ID exclusivo para receber convites

## Tecnologias

- HTML5, CSS3, JavaScript (ES6+)
- Supabase (Autenticação + PostgreSQL + Storage)
- Design responsivo com CSS Grid e Flexbox
- Google Fonts (Inter)

## Configuração

### 1. Banco de Dados

Execute o arquivo `database/schema.sql` no SQL Editor do Supabase:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de `database/schema.sql`
5. Execute

### 2. Storage

O script SQL cria automaticamente o bucket `avatars` para fotos de perfil. Caso não funcione, crie manualmente:

1. Vá em **Storage** no Supabase Dashboard
2. Clique em **New Bucket**
3. Nome: `avatars`
4. Marque como **Public bucket**

### 3. Variáveis de Ambiente

Atualize as credenciais no arquivo `script.js`:

```javascript
const SUPABASE_URL = 'sua-url-do-supabase';
const SUPABASE_ANON_KEY = 'sua-anon-key';
```

## Estrutura do Projeto

```
taskflow/
├── index.html          # Página principal (SPA)
├── style.css           # Estilos CSS
├── script.js           # Lógica JavaScript
├── server.py           # Servidor de desenvolvimento
├── database/
│   └── schema.sql      # Schema do banco de dados
└── README.md           # Documentação
```

## Como Usar

### Criar Conta
1. Clique em "Cadastrar"
2. Preencha nome, email e senha
3. Confirme o email (verifique sua caixa de entrada)

### Criar Projeto
1. No dashboard, clique em "+ Novo Projeto"
2. Defina nome, descrição e cor
3. Clique em "Criar Projeto"

### Adicionar Tarefas
1. Abra um projeto
2. Clique em "+ Nova Tarefa"
3. Preencha título, descrição, status, prioridade e prazo
4. Atribua a um membro (opcional)

### Convidar Membros
1. Abra um projeto
2. Clique em "👥 Membros"
3. Peça o User ID da pessoa que deseja convidar
4. Cole o ID e clique em "Convidar"

### Compartilhar seu ID
1. No painel lateral, encontre "Seu ID"
2. Clique no ícone de copiar
3. Compartilhe com quem deseja que te convide

## Banco de Dados

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuários (nome, email, avatar) |
| `projects` | Projetos criados |
| `project_members` | Relação usuário-projeto |
| `tasks` | Tarefas dos projetos |

### Políticas de Segurança (RLS)

- Usuários só veem seus próprios projetos e aqueles onde são membros
- Apenas donos podem editar/excluir projetos
- Membros podem criar e editar tarefas
- Upload de avatar restrito ao próprio usuário

## Licença

MIT License - Uso livre para projetos pessoais e comerciais.

## Autor

**Italo S. Santos**

---

Desenvolvido com foco em usabilidade e performance.
