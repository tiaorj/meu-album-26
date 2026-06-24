# Meu Álbum 26

Aplicação web para organização de figurinhas do álbum da Copa do Mundo de 2026.

O **Meu Álbum 26** permite controlar figurinhas adquiridas, coladas, faltantes e repetidas, além de gerar listas para troca e compartilhamento.

O sistema foi desenvolvido com foco em utilização rápida pelo celular, especialmente durante encontros e eventos de troca de figurinhas.

---

## Funcionalidades

* Autenticação de usuários
* Coleção individual protegida por usuário
* Controle da quantidade de cada figurinha
* Marcação de figurinhas já coladas
* Identificação automática de repetidas
* Lista de figurinhas faltantes
* Lista de figurinhas disponíveis para troca
* Compartilhamento da lista pelo WhatsApp
* Cópia da lista para a área de transferência
* Filtros por seleção
* Pesquisa por código, jogador ou país
* Progresso geral do álbum
* Progresso individual por seleção
* Marcação compacta de figurinhas por país
* Salvamento otimista em segundo plano
* Notificações de salvamento e erro
* Navegação otimizada para dispositivos móveis
* Instalação como aplicativo PWA
* Página de indisponibilidade offline
* Importação automatizada do catálogo de figurinhas

---

## Tecnologias

### Front-end

* Next.js
* React
* TypeScript
* Tailwind CSS
* App Router
* Server Components
* Client Components

### Back-end

* Next.js Server Actions
* Supabase
* Supabase Auth
* PostgreSQL
* Row Level Security — RLS

### PWA

* Web App Manifest
* Service Worker
* Cache de arquivos essenciais
* Página offline
* Ícones para Android e iOS

### Desenvolvimento

* Node.js
* npm
* ESLint
* tsx
* Git
* GitHub

---

## Arquitetura

O projeto utiliza a arquitetura do Next.js com App Router.

As páginas são divididas entre componentes executados no servidor e componentes interativos executados no navegador.

### Server Components

Responsáveis por:

* validar a autenticação;
* consultar o Supabase;
* carregar o álbum;
* carregar figurinhas e seleções;
* preparar os dados iniciais;
* proteger rotas privadas.

Exemplos:

```text
src/app/painel/page.tsx
src/app/colecao/page.tsx
src/app/selecoes/page.tsx
src/app/troca/page.tsx
```

### Client Components

Responsáveis por:

* responder aos cliques;
* controlar filtros e pesquisas;
* atualizar quantidades;
* exibir notificações;
* alterar a interface imediatamente;
* compartilhar listas.

Exemplos:

```text
src/app/colecao/colecao-client.tsx
src/app/troca/troca-client.tsx
src/app/selecoes/[codigo]/selecao-client.tsx
```

### Server Actions

As Server Actions recebem as alterações realizadas pelo usuário e gravam os dados no Supabase sem a necessidade de criar uma API REST separada.

Exemplo:

```text
src/app/colecao/actions.ts
```

### Salvamento otimista

O projeto utiliza atualização otimista.

Quando o usuário marca uma figurinha, a interface é atualizada imediatamente. A gravação no banco ocorre em segundo plano.

O controle desse processo está centralizado em:

```text
src/hooks/use-colecao-rapida.ts
```

Esse hook também:

* agrupa alterações rápidas;
* evita gravações simultâneas da mesma figurinha;
* controla figurinhas em salvamento;
* restaura o estado anterior em caso de erro;
* mantém a interface responsiva.

---

## Estrutura do projeto

```text
meu-album-26/
├── public/
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   ├── apple-touch-icon.png
│   └── sw.js
│
├── scripts/
│   └── importar-catalogo-2026.ts
│
├── src/
│   ├── app/
│   │   ├── colecao/
│   │   ├── faltantes/
│   │   ├── login/
│   │   ├── offline/
│   │   ├── painel/
│   │   ├── repetidas/
│   │   ├── selecoes/
│   │   ├── troca/
│   │   ├── manifest.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── mobile-nav.tsx
│   │   └── salvamento-toast.tsx
│   │
│   ├── hooks/
│   │   └── use-colecao-rapida.ts
│   │
│   └── lib/
│       └── supabase/
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Banco de dados

O banco de dados é mantido no Supabase.

### Principais tabelas

#### `albuns`

Armazena os álbuns disponíveis no sistema.

Principais campos:

* `id`
* `nome`
* `slug`
* `descricao`
* `ano`
* `editora`
* `imagem_capa_url`
* `ativo`

#### `selecoes`

Armazena os países ou grupos de figurinhas.

Principais campos:

* `id`
* `album_id`
* `codigo`
* `nome`
* `grupo`
* `bandeira_url`
* `ordem`

#### `figurinhas`

Armazena o catálogo oficial utilizado pelo sistema.

Principais campos:

* `id`
* `album_id`
* `selecao_id`
* `codigo`
* `numero`
* `nome`
* `tipo`
* `pagina`
* `ordem`
* `imagem_url`

#### `colecao_usuario`

Relaciona cada usuário às figurinhas de sua coleção.

Principais campos:

* `id`
* `usuario_id`
* `figurinha_id`
* `quantidade`
* `colada`
* `quantidade_repetida`
* `observacao`

A quantidade de repetidas é calculada a partir da quantidade total possuída.

---

## Segurança

O acesso à coleção é protegido pelo Supabase Auth.

Cada usuário acessa somente os seus próprios registros por meio das políticas de Row Level Security.

As páginas privadas validam a sessão no servidor antes de carregar os dados.

A chave secreta utilizada na importação do catálogo nunca deve ser exposta no navegador ou enviada para o GitHub.

---

## Variáveis de ambiente

Crie o arquivo:

```text
.env.local
```

Adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
SUPABASE_SECRET_KEY=sua_chave_secreta
```

### Atenção

A variável abaixo é pública e pode ser utilizada pelo navegador:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

A variável abaixo é privada e deve ser utilizada somente no servidor ou em scripts administrativos:

```env
SUPABASE_SECRET_KEY
```

Nunca publique o arquivo `.env.local`.

---

## Instalação

Clone o repositório:

```bash
git clone https://github.com/tiaorj/meu-album-26.git
```

Entre na pasta:

```bash
cd meu-album-26
```

Instale as dependências:

```bash
npm install
```

Configure o arquivo `.env.local`.

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

---

## Comandos disponíveis

### Desenvolvimento

```bash
npm run dev
```

### Build de produção

```bash
npm run build
```

### Executar produção localmente

```bash
npm run start
```

### Verificar o código

```bash
npm run lint
```

### Importar o catálogo

```bash
npm run importar:catalogo
```

O importador utiliza o arquivo TypeScript localizado em:

```text
scripts/importar-catalogo-2026.ts
```

---

## Fluxo de funcionamento

1. O usuário realiza o login.
2. O Next.js valida a sessão no servidor.
3. O sistema consulta o álbum ativo.
4. As figurinhas e os registros do usuário são carregados.
5. Os dados são enviados ao componente interativo.
6. O usuário marca ou altera uma figurinha.
7. A interface é atualizada imediatamente.
8. A Server Action grava a alteração no Supabase.
9. Uma notificação informa se a alteração foi salva.
10. As listas de faltantes e repetidas são atualizadas com base na quantidade.

---

## PWA

O Meu Álbum 26 pode ser instalado como aplicativo no celular.

O projeto possui:

* manifesto da aplicação;
* ícones para diferentes dispositivos;
* modo de exibição independente;
* orientação vertical;
* Service Worker;
* página offline;
* cache dos arquivos essenciais.

Dados privados e autenticados não são armazenados no cache do Service Worker.

---

## Estado atual

O projeto possui um MVP funcional com:

* autenticação;
* catálogo de figurinhas;
* coleção individual;
* controle de quantidade;
* faltantes;
* repetidas;
* modo troca;
* progresso por seleção;
* interface responsiva;
* instalação como PWA.

---

## Próximas melhorias

* Link público para compartilhamento de listas
* QR Code para abrir uma lista de troca
* Comparação entre coleções de dois usuários
* Modo offline com sincronização posterior
* Importação e exportação da coleção
* Perfil público do colecionador
* Suporte a novos álbuns
* Testes automatizados
* Histórico de alterações
* Estatísticas da coleção

---

## Objetivo do projeto

O Meu Álbum 26 foi criado como projeto de estudo e produto funcional, aplicando conceitos modernos de desenvolvimento web:

* arquitetura full stack;
* autenticação;
* segurança de dados;
* banco relacional;
* aplicações responsivas;
* Progressive Web Apps;
* atualização otimista;
* componentes reutilizáveis;
* experiência de uso voltada para dispositivos móveis.

---

## Autor

**Sebastião Gonçalves de Oliveira**

GitHub: `@tiaorj`

Projeto desenvolvido para organização e troca de figurinhas da Copa do Mundo de 2026.
