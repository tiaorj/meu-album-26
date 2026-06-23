import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { InstallAppCard } from "@/components/install-app-card";

type ColecaoResumo = {
  quantidade: number;
  colada: boolean;
  quantidade_repetida: number;
};

export default async function PainelPage() {
  const supabase = await createClient();

  /*
   * Valida o token e recupera o ID do usuário.
   */
  const { data: claimsData } =
    await supabase.auth.getClaims();

  const usuarioId = claimsData?.claims?.sub;

  if (!usuarioId) {
    redirect("/login");
  }

  /*
   * Recupera os dados atuais do usuário.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nome =
    typeof user.user_metadata?.nome === "string"
      ? user.user_metadata.nome
      : "Colecionador";

  /*
   * Busca o álbum ativo.
   */
  const { data: album, error: albumError } =
    await supabase
      .from("albuns")
      .select("id, nome, ano")
      .eq("slug", "copa-do-mundo-2026")
      .eq("ativo", true)
      .maybeSingle();

  if (albumError || !album) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Álbum não encontrado
          </h1>

          <p className="mt-2 text-sm text-red-700">
            Verifique se o álbum da Copa do Mundo
            de 2026 está cadastrado e ativo.
          </p>
        </section>
      </main>
    );
  }

  /*
   * Executa as duas consultas ao mesmo tempo:
   *
   * 1. quantidade total de figurinhas do álbum;
   * 2. coleção do usuário para esse álbum.
   */
  const [
    resultadoTotal,
    resultadoColecao,
  ] = await Promise.all([
    supabase
      .from("figurinhas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("album_id", album.id),

    supabase
      .from("colecao_usuario")
      .select(`
        quantidade,
        colada,
        quantidade_repetida,
        figurinhas!inner (
          album_id
        )
      `)
      .eq("usuario_id", usuarioId)
      .eq("figurinhas.album_id", album.id),
  ]);

  if (
    resultadoTotal.error ||
    resultadoColecao.error
  ) {
    const mensagem =
      resultadoTotal.error?.message ??
      resultadoColecao.error?.message ??
      "Erro desconhecido.";

    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Erro ao carregar o painel
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {mensagem}
          </p>
        </section>
      </main>
    );
  }

  const colecao =
    (resultadoColecao.data ??
      []) as unknown as ColecaoResumo[];

  /*
   * Indicadores reais do usuário.
   */
  const totalFigurinhas =
    resultadoTotal.count ?? 0;

  const codigosPossuidos = colecao.filter(
    (item) => item.quantidade > 0,
  ).length;

  const coladas = colecao.filter(
    (item) => item.colada,
  ).length;

  const naoColadas = colecao.filter(
    (item) =>
      item.quantidade > 0 &&
      !item.colada,
  ).length;

  const faltantes = Math.max(
    totalFigurinhas - codigosPossuidos,
    0,
  );

  const codigosRepetidos = colecao.filter(
    (item) =>
      item.quantidade_repetida > 0,
  ).length;

  const totalRepetidas = colecao.reduce(
    (total, item) =>
      total + item.quantidade_repetida,
    0,
  );

  const percentual =
    totalFigurinhas > 0
      ? Math.round(
          (coladas / totalFigurinhas) * 100,
        )
      : 0;

  const resumo = [
    {
      titulo: "Já coladas",
      valor: coladas,
      descricao: "No álbum",
      icone: "✅",
      classe:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    {
      titulo: "Ainda não coladas",
      valor: naoColadas,
      descricao: "Você já possui",
      icone: "🖼️",
      classe:
        "border-blue-200 bg-blue-50 text-blue-800",
    },
    {
      titulo: "Faltantes",
      valor: faltantes,
      descricao: "Para conseguir",
      icone: "🔍",
      classe:
        "border-red-200 bg-red-50 text-red-800",
    },
    {
      titulo: "Repetidas",
      valor: totalRepetidas,
      descricao: `${codigosRepetidos} códigos diferentes`,
      icone: "🔄",
      classe:
        "border-amber-200 bg-amber-50 text-amber-800",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      {/* CABEÇALHO */}
      <header className="bg-green-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              ⚽
            </div>

            <div>
              <p className="text-xs text-green-100">
                {album.nome}
              </p>

              <h1 className="text-lg font-bold">
                Meu Álbum 26
              </h1>
            </div>
          </div>

          <form
            action="/auth/signout"
            method="post"
          >
            <button
              type="submit"
              className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        {/* APRESENTAÇÃO */}
        <div className="mb-6">
          <p className="text-sm font-medium text-green-700">
            Bem-vindo de volta
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            Olá, {nome}!
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Acompanhe o progresso da sua coleção.
          </p>
        </div>

        {/* PROGRESSO */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 to-green-900 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-green-100">
                Progresso do álbum
              </p>

              <p className="mt-2 text-4xl font-bold">
                {percentual}%
              </p>

              <p className="mt-2 text-sm text-green-100">
                {coladas} de {totalFigurinhas} figurinhas coladas
              </p>
            </div>

            <div className="text-5xl">
              🏆
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-green-100">
              <span>
                {coladas} coladas
              </span>

              <span>
                {Math.max(
                  totalFigurinhas - coladas,
                  0,
                )}{" "}
                restantes
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                style={{
                  width: `${percentual}%`,
                }}
              />
            </div>
          </div>
        </section>
        <InstallAppCard />
        {/* RESUMO */}
        <section className="mt-7">
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Resumo da coleção
          </h2>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {resumo.map((item) => (
              <article
                key={item.titulo}
                className={`rounded-2xl border p-4 ${item.classe}`}
              >
                <div className="text-2xl">
                  {item.icone}
                </div>

                <p className="mt-4 text-3xl font-bold">
                  {item.valor}
                </p>

                <h3 className="mt-1 text-sm font-bold">
                  {item.titulo}
                </h3>

                <p className="mt-1 text-xs opacity-80">
                  {item.descricao}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ACESSOS RÁPIDOS */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Acesso rápido
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
<Link
  href="/troca"
  className="group flex items-center gap-4 rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm transition hover:border-green-300 hover:shadow-md active:scale-[0.99]"
>
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-2xl">
    🤝
  </div>

  <div className="flex-1">
    <h3 className="font-bold text-green-900">
      Modo troca
    </h3>

    <p className="mt-1 text-sm text-green-700">
      Consulte faltantes e repetidas rapidamente.
    </p>
  </div>

  <span className="text-3xl text-green-400 transition group-hover:translate-x-1 group-hover:text-green-700">
    ›
  </span>
</Link>            
            <Link
              href="/colecao"
              className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-green-300 hover:shadow-md"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                📚
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-slate-900">
                  Minha coleção
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Marque figurinhas, quantidades e coladas.
                </p>
              </div>

              <span className="text-3xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-green-700">
                ›
              </span>
            </Link>

            <Link
              href="/repetidas"
              className="group flex items-center gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                🔄
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-amber-900">
                  Minhas repetidas
                </h3>

                <p className="mt-1 text-sm text-amber-700">
                  {totalRepetidas > 0
                    ? `${totalRepetidas} unidades disponíveis para troca.`
                    : "Nenhuma figurinha repetida ainda."}
                </p>
              </div>

              <span className="text-3xl text-amber-400 transition group-hover:translate-x-1 group-hover:text-amber-700">
                ›
              </span>
            </Link>

            <Link
              href="/faltantes"
              className="group flex items-center gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm transition hover:border-red-300 hover:shadow-md"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-2xl">
                🔍
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-red-900">
                  Figurinhas faltantes
                </h3>

                <p className="mt-1 text-sm text-red-700">
                  {faltantes > 0
                    ? `Ainda faltam ${faltantes} figurinhas.`
                    : "Você já possui todos os códigos."}
                </p>

              </div>

              <span className="text-3xl text-red-300 transition group-hover:translate-x-1 group-hover:text-red-700">
                ›
              </span>
            </Link>

            <div className="flex items-center gap-4 rounded-3xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                🖼️
              </div>

              <div>
                <h3 className="font-bold text-blue-900">
                  Aguardando colagem
                </h3>

                <p className="mt-1 text-sm text-blue-700">
                  {naoColadas > 0
                    ? `${naoColadas} figurinhas ainda podem ser coladas.`
                    : "Nenhuma figurinha aguardando colagem."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DADOS DO USUÁRIO */}
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              👤
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                {nome}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {user.email}
              </p>
            </div>
          </div>
        </section>
      </section>

      {/* NAVEGAÇÃO MOBILE */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          <Link
            href="/painel"
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-green-700"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs font-semibold">
              Início
            </span>
          </Link>

          <Link
            href="/colecao"
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500"
          >
            <span className="text-xl">📚</span>
            <span className="text-xs">
              Coleção
            </span>
          </Link>
        <Link
        href="/faltantes"
        className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500"
        >
        <span className="text-xl">🔍</span>

        <span className="text-xs">
            Faltantes
        </span>
        </Link>
          <Link
            href="/repetidas"
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500"
          >
            <span className="text-xl">🔄</span>
            <span className="text-xs">
              Repetidas
            </span>
          </Link>
        </div>
      </nav>
    </main>
  );
}