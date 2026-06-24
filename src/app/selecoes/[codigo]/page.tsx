import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  SelecaoClient,
  type SelecaoFigurinhaItem,
} from "./selecao-client";

import { MobileNav } from "@/components/mobile-nav";

type PageProps = {
  params: Promise<{
    codigo: string;
  }>;
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

  colecao_usuario:
    | ColecaoRelacionamento[]
    | null;
};

export default async function SelecaoDetalhePage({
  params,
}: PageProps) {
  const { codigo: codigoParametro } =
    await params;

  const codigo =
    decodeURIComponent(
      codigoParametro,
    )
      .trim()
      .toUpperCase();

  const supabase =
    await createClient();

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
    notFound();
  }

  let selecaoId: string | null =
    null;

  let selecaoNome =
    "Figurinhas gerais";

  if (codigo !== "GER") {
    const {
      data: selecao,
      error: selecaoError,
    } = await supabase
      .from("selecoes")
      .select("id, codigo, nome")
      .eq(
        "album_id",
        album.id,
      )
      .eq("codigo", codigo)
      .maybeSingle();

    if (
      selecaoError ||
      !selecao
    ) {
      notFound();
    }

    selecaoId = selecao.id;
    selecaoNome = selecao.nome;
  }

  let consulta = supabase
    .from("figurinhas")
    .select(`
      id,
      codigo,
      nome,
      tipo,
      ordem,
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

  if (selecaoId) {
    consulta = consulta.eq(
      "selecao_id",
      selecaoId,
    );
  } else {
    consulta = consulta.is(
      "selecao_id",
      null,
    );
  }

  const {
    data: figurinhasData,
    error: figurinhasError,
  } = await consulta;

  if (figurinhasError) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Erro ao carregar seleção
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

  const figurinhas: SelecaoFigurinhaItem[] =
    registros.map((registro) => {
      const colecao =
        registro.colecao_usuario?.[0];

      return {
        id: registro.id,
        codigo: registro.codigo,
        nome: registro.nome,
        tipo: registro.tipo,
        ordem: registro.ordem,

        quantidade:
          colecao?.quantidade ?? 0,

        colada:
          colecao?.colada ?? false,

        repetidas:
          colecao
            ?.quantidade_repetida ??
          0,
      };
    });

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <header className="bg-green-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/selecoes"
              aria-label="Voltar para seleções"
              className="touch-manipulation flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-2xl active:bg-white/25"
            >
              ‹
            </Link>

            <div>
              <p className="text-xs text-green-100">
                {album.nome}
              </p>

              <h1 className="text-lg font-bold">
                {selecaoNome}
              </h1>
            </div>
          </div>

          <div className="rounded-xl bg-white/15 px-3 py-2 text-sm font-black">
            {codigo}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
        <SelecaoClient
          selecaoCodigo={codigo}
          selecaoNome={selecaoNome}
          initialItems={figurinhas}
        />
      </section>

      <MobileNav />
    </main>
  );
}