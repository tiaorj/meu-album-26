import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  FaltantesClient,
  type FaltanteItem,
} from "./faltantes-client";

type SelecaoRelacionamento = {
  codigo: string;
  nome: string;
};

type ColecaoRelacionamento = {
  quantidade: number;
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

export default async function FaltantesPage() {
  const supabase = await createClient();

  /*
   * Confirma que existe um usuário autenticado.
   */
  const { data: claimsData } =
    await supabase.auth.getClaims();

  const usuarioId = claimsData?.claims?.sub;

  if (!usuarioId) {
    redirect("/login");
  }

  /*
   * Recupera o álbum ativo.
   */
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
   * Consulta todas as figurinhas do álbum e,
   * quando existir, a coleção do usuário.
   *
   * O RLS de colecao_usuario permite retornar
   * apenas os registros do usuário autenticado.
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
        quantidade
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
            Erro ao carregar as figurinhas faltantes
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

  /*
   * Uma figurinha está faltando quando:
   *
   * - não existe registro na coleção; ou
   * - a quantidade registrada é zero.
   */
  const faltantes: FaltanteItem[] = registros
    .filter((registro) => {
      const colecao =
        registro.colecao_usuario?.[0];

      return (colecao?.quantidade ?? 0) === 0;
    })
    .map((registro) => {
      const selecao = Array.isArray(
        registro.selecoes,
      )
        ? registro.selecoes[0]
        : registro.selecoes;

      return {
        id: registro.id,
        codigo: registro.codigo,
        nome: registro.nome,
        tipo: registro.tipo,
        ordem: registro.ordem,

        selecaoCodigo:
          selecao?.codigo ?? "GER",

        selecaoNome:
          selecao?.nome ??
          "Figurinhas gerais",
      };
    })
    .sort((a, b) => {
      const comparacaoSelecao =
        a.selecaoNome.localeCompare(
          b.selecaoNome,
          "pt-BR",
        );

      if (comparacaoSelecao !== 0) {
        return comparacaoSelecao;
      }

      return a.ordem - b.ordem;
    });

  return (
    <main className="min-h-screen bg-slate-100 pb-20">
      <header className="bg-green-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs text-green-100">
              {album.nome}
            </p>

            <h1 className="text-lg font-bold">
              Figurinhas faltantes
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/colecao"
              className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25"
            >
              Coleção
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
        <div className="mb-6">
          <Link
            href="/painel"
            className="text-sm font-semibold text-green-700 hover:underline"
          >
            ← Voltar para o painel
          </Link>

          <h2 className="mt-4 text-3xl font-bold text-slate-900">
            Figurinhas que procuro
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Consulte as figurinhas que ainda faltam
            e compartilhe a lista com amigos.
          </p>
        </div>

        <FaltantesClient
          albumNome={album.nome}
          initialItems={faltantes}
        />
      </section>

      {/* NAVEGAÇÃO MOBILE */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          <Link
            href="/painel"
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs">
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
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-red-700"
          >
            <span className="text-xl">🔍</span>
            <span className="text-xs font-semibold">
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