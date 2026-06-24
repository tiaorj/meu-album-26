import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  TrocaClient,
  type TrocaItem,
} from "./troca-client";
import { MobileNav } from "@/components/mobile-nav";

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

export default async function TrocaPage() {
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
            Verifique o cadastro do álbum da Copa
            do Mundo de 2026.
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
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Erro ao carregar o modo troca
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

  const itens: TrocaItem[] = registros.map(
    (registro) => {
      const selecao = Array.isArray(
        registro.selecoes,
      )
        ? registro.selecoes[0]
        : registro.selecoes;

      const colecao =
        registro.colecao_usuario?.[0];

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

        quantidade:
          colecao?.quantidade ?? 0,

        colada:
          colecao?.colada ?? false,

        repetidas:
          colecao?.quantidade_repetida ??
          0,
      };
    },
  );

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <header className="bg-green-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs text-green-100">
              {album.nome}
            </p>

            <h1 className="text-lg font-bold">
              Modo troca
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/colecao"
              className="touch-manipulation rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold active:bg-white/25"
            >
              Coleção
            </Link>

            <form
              action="/auth/signout"
              method="post"
            >
              <button
                type="submit"
                className="touch-manipulation rounded-xl bg-white px-3 py-2 text-sm font-semibold text-green-700 active:bg-green-50"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-3 py-3 sm:px-4">
        <TrocaClient
          albumNome={album.nome}
          initialItems={itens}
        />
      </section>

      <MobileNav />
    </main>
  );
}