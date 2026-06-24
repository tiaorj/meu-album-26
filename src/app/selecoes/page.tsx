import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type SelecaoRelacionamento = {
  codigo: string;
  nome: string;
};

type ColecaoRelacionamento = {
  quantidade: number;
  colada: boolean;
  quantidade_repetida: number;
};

type FigurinhaBanco = {
  id: string;
  codigo: string;
  ordem: number;

  selecoes:
    | SelecaoRelacionamento
    | SelecaoRelacionamento[]
    | null;

  colecao_usuario:
    | ColecaoRelacionamento[]
    | null;
};

type ResumoSelecao = {
  codigo: string;
  nome: string;
  total: number;
  possuidas: number;
  coladas: number;
  repetidas: number;
  percentual: number;
};

export default async function SelecoesPage() {
  const supabase = await createClient();

  const { data: claimsData } =
    await supabase.auth.getClaims();

  const usuarioId =
    claimsData?.claims?.sub;

  if (!usuarioId) {
    redirect("/login");
  }

  const {
    data: album,
    error: albumError,
  } = await supabase
    .from("albuns")
    .select("id, nome")
    .eq(
      "slug",
      "copa-do-mundo-2026",
    )
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
            Verifique o cadastro do álbum
            da Copa do Mundo de 2026.
          </p>
        </section>
      </main>
    );
  }

  const {
    data: figurinhasData,
    error: figurinhasError,
  } = await supabase
    .from("figurinhas")
    .select(`
      id,
      codigo,
      ordem,
      selecoes (
        codigo,
        nome
      ),
      colecao_usuario (
        quantidade,
        colada,
        quantidade_repetida
      )
    `)
    .eq("album_id", album.id)
    .order("ordem", {
      ascending: true,
    });

  if (figurinhasError) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Erro ao carregar seleções
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {figurinhasError.message}
          </p>
        </section>
      </main>
    );
  }

  const registros =
    (figurinhasData ??
      []) as unknown as FigurinhaBanco[];

  const mapaSelecoes =
    new Map<
      string,
      Omit<
        ResumoSelecao,
        "percentual"
      >
    >();

  registros.forEach((registro) => {
    const selecao =
      Array.isArray(
        registro.selecoes,
      )
        ? registro.selecoes[0]
        : registro.selecoes;

    const codigo =
      selecao?.codigo ?? "GER";

    const nome =
      selecao?.nome ??
      "Figurinhas gerais";

    const colecao =
      registro.colecao_usuario?.[0];

    const atual =
      mapaSelecoes.get(codigo) ?? {
        codigo,
        nome,
        total: 0,
        possuidas: 0,
        coladas: 0,
        repetidas: 0,
      };

    atual.total += 1;

    if (
      (colecao?.quantidade ?? 0) >
      0
    ) {
      atual.possuidas += 1;
    }

    if (colecao?.colada) {
      atual.coladas += 1;
    }

    atual.repetidas +=
      colecao
        ?.quantidade_repetida ??
      0;

    mapaSelecoes.set(
      codigo,
      atual,
    );
  });

  const selecoes: ResumoSelecao[] =
    Array.from(
      mapaSelecoes.values(),
    )
      .map((selecao) => ({
        ...selecao,

        percentual:
          selecao.total > 0
            ? Math.round(
                (
                  selecao.possuidas /
                  selecao.total
                ) * 100,
              )
            : 0,
      }))
      .sort((a, b) => {
        if (a.codigo === "GER") {
          return -1;
        }

        if (b.codigo === "GER") {
          return 1;
        }

        return a.nome.localeCompare(
          b.nome,
          "pt-BR",
        );
      });

  const totalPossuidas =
    selecoes.reduce(
      (total, selecao) =>
        total +
        selecao.possuidas,
      0,
    );

  const totalFigurinhas =
    selecoes.reduce(
      (total, selecao) =>
        total + selecao.total,
      0,
    );

  const percentualGeral =
    totalFigurinhas > 0
      ? Math.round(
          (
            totalPossuidas /
            totalFigurinhas
          ) * 100,
        )
      : 0;

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <header className="bg-green-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs text-green-100">
              {album.nome}
            </p>

            <h1 className="text-lg font-bold">
              Progresso por seleção
            </h1>
          </div>

          <Link
            href="/painel"
            className="touch-manipulation rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold active:bg-white/25"
          >
            Painel
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 to-green-900 p-6 text-white shadow-lg">
          <p className="text-sm font-medium text-green-100">
            Progresso da coleção
          </p>

          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-black">
                {percentualGeral}%
              </p>

              <p className="mt-2 text-sm text-green-100">
                {totalPossuidas} de{" "}
                {totalFigurinhas} códigos
                conquistados
              </p>
            </div>

            <div className="text-5xl">
              🌎
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all"
              style={{
                width: `${percentualGeral}%`,
              }}
            />
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Seleções
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Toque para abrir a marcação
              rápida.
            </p>
          </div>

          <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
            {selecoes.length} grupos
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selecoes.map(
            (selecao) => {
              const completa =
                selecao.possuidas ===
                  selecao.total &&
                selecao.total > 0;

              return (
                <Link
                  key={selecao.codigo}
                  href={`/selecoes/${selecao.codigo}`}
                  className="touch-manipulation rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                          completa
                            ? "bg-green-700 text-white"
                            : "bg-green-50 text-green-800"
                        }`}
                      >
                        {selecao.codigo}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-900">
                          {selecao.nome}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            selecao.possuidas
                          }
                          /{selecao.total}{" "}
                          figurinhas
                        </p>
                      </div>
                    </div>

                    <span className="text-2xl text-slate-300">
                      ›
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>
                      {
                        selecao.percentual
                      }
                      % completo
                    </span>

                    <span>
                      {
                        selecao.repetidas
                      }{" "}
                      repetida
                      {selecao.repetidas ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        completa
                          ? "bg-green-600"
                          : "bg-yellow-400"
                      }`}
                      style={{
                        width: `${selecao.percentual}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {
                        selecao.coladas
                      }{" "}
                      coladas
                    </span>

                    {completa && (
                      <span className="font-bold text-green-700">
                        ✓ Completa
                      </span>
                    )}
                  </div>
                </Link>
              );
            },
          )}
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          <Link
            href="/painel"
            className="touch-manipulation flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500 active:bg-slate-100"
          >
            <span className="text-xl">
              🏠
            </span>

            <span className="text-xs">
              Início
            </span>
          </Link>

          <Link
            href="/colecao"
            className="touch-manipulation flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500 active:bg-slate-100"
          >
            <span className="text-xl">
              📚
            </span>

            <span className="text-xs">
              Coleção
            </span>
          </Link>

          <Link
            href="/selecoes"
            className="touch-manipulation flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-green-700 active:bg-green-50"
          >
            <span className="text-xl">
              🌎
            </span>

            <span className="text-xs font-semibold">
              Seleções
            </span>
          </Link>

          <Link
            href="/troca"
            className="touch-manipulation flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500 active:bg-slate-100"
          >
            <span className="text-xl">
              🤝
            </span>

            <span className="text-xs">
              Troca
            </span>
          </Link>
        </div>
      </nav>
    </main>
  );
}