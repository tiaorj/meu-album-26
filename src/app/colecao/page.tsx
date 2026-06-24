import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  ColecaoClient,
  type FigurinhaItem,
} from "./colecao-client";

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
  nome: string;
  tipo: string;
  ordem: number;

  selecoes:
    | SelecaoRelacionamento
    | SelecaoRelacionamento[]
    | null;

  colecao_usuario:
    | ColecaoRelacionamento[]
    | null;
};

export default async function ColecaoPage() {
  const supabase = await createClient();

  const { data: claimsData } =
    await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: album, error: albumError } =
    await supabase
      .from("albuns")
      .select("id, nome")
      .eq("slug", "copa-do-mundo-2026")
      .eq("ativo", true)
      .maybeSingle();

  if (albumError || !album) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Álbum não encontrado
          </h1>

          <p className="mt-2 text-sm text-red-700">
            Verifique se o álbum Copa do Mundo 2026
            está cadastrado e ativo.
          </p>
        </div>
      </main>
    );
  }

  /*
   * A política RLS da tabela colecao_usuario
   * permite retornar apenas os registros do
   * usuário autenticado.
   */
  const {
    data: figurinhasData,
    error: figurinhasError,
  } = await supabase
    .from("figurinhas")
    .select(`
      id,
      codigo,
      nome,
      tipo,
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
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Erro ao carregar as figurinhas
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {figurinhasError.message}
          </p>
        </div>
      </main>
    );
  }

  const figurinhasBanco =
    (figurinhasData ??
      []) as unknown as FigurinhaBanco[];

  const figurinhas: FigurinhaItem[] =
    figurinhasBanco.map((item) => {
      const selecao = Array.isArray(
        item.selecoes,
      )
        ? item.selecoes[0]
        : item.selecoes;

      const colecao =
        item.colecao_usuario?.[0];

      return {
        id: item.id,
        codigo: item.codigo,
        nome: item.nome,
        tipo: item.tipo,

        selecaoCodigo:
          selecao?.codigo ?? "GER",

        selecaoNome:
          selecao?.nome ?? "Figurinhas gerais",

        quantidade:
          colecao?.quantidade ?? 0,

        colada:
          colecao?.colada ?? false,

        repetidas:
          colecao?.quantidade_repetida ?? 0,
      };
    });

  const total = figurinhas.length;

  const coladas = figurinhas.filter(
    (item) => item.colada,
  ).length;

  const percentual =
    total > 0
      ? Math.round((coladas / total) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-slate-100 pb-20">
      <header className="bg-green-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs text-green-100">
              {album.nome}
            </p>

            <h1 className="text-lg font-bold">
              Minha coleção
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/painel"
              className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25"
            >
              Painel
            </Link>

            <form
              action="/auth/signout"
              method="post"
            >
              <button
                type="submit"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 to-green-900 p-6 text-white shadow-lg">
          <p className="text-sm font-medium text-green-100">
            Progresso do álbum
          </p>

          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold">
                {percentual}%
              </p>

              <p className="mt-2 text-sm text-green-100">
                {coladas} de {total} figurinhas coladas
              </p>
            </div>

            <div className="text-5xl">
              🏆
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all"
              style={{
                width: `${percentual}%`,
              }}
            />
          </div>
        </div>
            <Link
              href="/selecoes"
              className="mb-4 flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 p-5 transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                  🌎
                </div>

                <div>
                  <h2 className="font-bold text-green-900">
                    Marcação por seleção
                  </h2>

                  <p className="mt-1 text-sm text-green-700">
                    Marque rapidamente país por país.
                  </p>
                </div>
              </div>

              <span className="text-3xl text-green-700">
                ›
              </span>
            </Link>
        <Link
        href="/faltantes"
        className="mb-4 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-5 transition hover:border-red-300 hover:shadow-sm"
        >
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl">
            🔍
            </div>
            <div>
              <h2 className="font-bold text-red-900">
                  Minhas faltantes
              </h2>

              <p className="mt-1 text-sm text-red-700">
                  Veja e compartilhe as figurinhas que procura.
              </p>
            </div>
        </div>

        <span className="text-3xl text-red-700">
            ›
        </span>
        </Link>

        <Link
        href="/repetidas"
        className="mb-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5 transition hover:border-amber-300 hover:shadow-sm"
        >
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            🔄
            </div>

            <div>
            <h2 className="font-bold text-amber-900">
                Minhas repetidas
            </h2>

            <p className="mt-1 text-sm text-amber-700">
                Veja e compartilhe sua lista para troca.
            </p>
            </div>
        </div>

        <span className="text-3xl text-amber-700">
            ›
        </span>
        </Link>
        <ColecaoClient
          initialItems={figurinhas}
        />
      </section>
    </main>
  );
}