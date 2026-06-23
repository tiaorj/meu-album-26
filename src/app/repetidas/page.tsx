import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  RepetidasClient,
  type RepetidaItem,
} from "./repetidas-client";

type SelecaoRelacionamento = {
  codigo: string;
  nome: string;
};

type FigurinhaRelacionamento = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  ordem: number;

  selecoes:
    | SelecaoRelacionamento
    | SelecaoRelacionamento[]
    | null;
};

type ColecaoBanco = {
  quantidade: number;
  quantidade_repetida: number;

  figurinhas:
    | FigurinhaRelacionamento
    | FigurinhaRelacionamento[]
    | null;
};

export default async function RepetidasPage() {
  const supabase = await createClient();

  const { data: claimsData } =
    await supabase.auth.getClaims();

  const usuarioId = claimsData?.claims?.sub;

  if (!usuarioId) {
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

  const {
    data: colecaoData,
    error: colecaoError,
  } = await supabase
    .from("colecao_usuario")
    .select(`
      quantidade,
      quantidade_repetida,
      figurinhas!inner (
        id,
        codigo,
        nome,
        tipo,
        ordem,
        album_id,
        selecoes (
          codigo,
          nome
        )
      )
    `)
    .eq("usuario_id", usuarioId)
    .eq("figurinhas.album_id", album.id)
    .gt("quantidade_repetida", 0);

  if (colecaoError) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Erro ao carregar as repetidas
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {colecaoError.message}
          </p>
        </section>
      </main>
    );
  }

  const registros =
    (colecaoData ?? []) as unknown as ColecaoBanco[];

  const repetidas: RepetidaItem[] = registros
    .map((registro) => {
      const figurinha = Array.isArray(
        registro.figurinhas,
      )
        ? registro.figurinhas[0]
        : registro.figurinhas;

      if (!figurinha) {
        return null;
      }

      const selecao = Array.isArray(
        figurinha.selecoes,
      )
        ? figurinha.selecoes[0]
        : figurinha.selecoes;

      return {
        id: figurinha.id,
        codigo: figurinha.codigo,
        nome: figurinha.nome,
        tipo: figurinha.tipo,
        ordem: figurinha.ordem,

        selecaoCodigo:
          selecao?.codigo ?? "GER",

        selecaoNome:
          selecao?.nome ?? "Figurinhas gerais",

        repetidas:
          registro.quantidade_repetida,
      };
    })
    .filter(
      (item): item is RepetidaItem =>
        item !== null,
    )
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
              Figurinhas repetidas
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
            href="/colecao"
            className="text-sm font-semibold text-green-700 hover:underline"
          >
            ← Voltar para minha coleção
          </Link>

          <h2 className="mt-4 text-3xl font-bold text-slate-900">
            Minhas repetidas
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Consulte as figurinhas disponíveis para
            troca e compartilhe sua lista.
          </p>
        </div>

        <RepetidasClient
          albumNome={album.nome}
          initialItems={repetidas}
        />
      </section>
    </main>
  );
}