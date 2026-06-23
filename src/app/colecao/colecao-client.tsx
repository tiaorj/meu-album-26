"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { atualizarFigurinha } from "./actions";

export type FigurinhaItem = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;

  selecaoCodigo: string;
  selecaoNome: string;

  quantidade: number;
  colada: boolean;
  repetidas: number;
};

type ColecaoClientProps = {
  initialItems: FigurinhaItem[];
};

type FiltroStatus =
  | "todas"
  | "faltantes"
  | "coladas"
  | "repetidas";

type SelecaoFiltro = {
  codigo: string;
  nome: string;
};

/*
 * Remove acentos e transforma o texto em minúsculo.
 *
 * Assim, pesquisar "franca" também encontra "França".
 */
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function ColecaoClient({
  initialItems,
}: ColecaoClientProps) {
  const router = useRouter();

  const [itens, setItens] =
    useState<FigurinhaItem[]>(initialItems);

  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatus>("todas");

  const [selecaoSelecionada, setSelecaoSelecionada] =
    useState("todas");

  const [busca, setBusca] = useState("");

  const [erro, setErro] = useState("");

  const [isPending, startTransition] =
    useTransition();

  /*
   * Monta a lista de seleções disponíveis,
   * removendo valores duplicados.
   */
  const selecoes = useMemo<SelecaoFiltro[]>(() => {
    const mapaSelecoes =
      new Map<string, SelecaoFiltro>();

    initialItems.forEach((item) => {
      if (!mapaSelecoes.has(item.selecaoCodigo)) {
        mapaSelecoes.set(item.selecaoCodigo, {
          codigo: item.selecaoCodigo,
          nome: item.selecaoNome,
        });
      }
    });

    return Array.from(mapaSelecoes.values()).sort(
      (a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [initialItems]);

  /*
   * Primeiro aplicamos a busca e o filtro por seleção.
   */
  const itensPorBuscaESelecao = useMemo(() => {
    const buscaNormalizada =
      normalizarTexto(busca);

    return itens.filter((item) => {
      const pertenceSelecao =
        selecaoSelecionada === "todas" ||
        item.selecaoCodigo === selecaoSelecionada;

      if (!pertenceSelecao) {
        return false;
      }

      if (!buscaNormalizada) {
        return true;
      }

      const camposPesquisaveis = normalizarTexto(
        [
          item.codigo,
          item.nome,
          item.selecaoNome,
          item.selecaoCodigo,
          item.tipo,
        ].join(" "),
      );

      return camposPesquisaveis.includes(
        buscaNormalizada,
      );
    });
  }, [
    busca,
    itens,
    selecaoSelecionada,
  ]);

  /*
   * Os contadores refletem a busca e a seleção
   * escolhida pelo usuário.
   */
  const contagens = useMemo(() => {
    return {
      todas: itensPorBuscaESelecao.length,

      faltantes: itensPorBuscaESelecao.filter(
        (item) => item.quantidade === 0,
      ).length,

      coladas: itensPorBuscaESelecao.filter(
        (item) => item.colada,
      ).length,

      repetidas: itensPorBuscaESelecao.filter(
        (item) => item.repetidas > 0,
      ).length,
    };
  }, [itensPorBuscaESelecao]);

  /*
   * Por último, aplicamos o filtro de status.
   */
  const itensFiltrados = useMemo(() => {
    if (filtroStatus === "faltantes") {
      return itensPorBuscaESelecao.filter(
        (item) => item.quantidade === 0,
      );
    }

    if (filtroStatus === "coladas") {
      return itensPorBuscaESelecao.filter(
        (item) => item.colada,
      );
    }

    if (filtroStatus === "repetidas") {
      return itensPorBuscaESelecao.filter(
        (item) => item.repetidas > 0,
      );
    }

    return itensPorBuscaESelecao;
  }, [
    filtroStatus,
    itensPorBuscaESelecao,
  ]);

  const possuiFiltrosAtivos =
    busca.trim() !== "" ||
    selecaoSelecionada !== "todas" ||
    filtroStatus !== "todas";

  function limparFiltros() {
    setBusca("");
    setSelecaoSelecionada("todas");
    setFiltroStatus("todas");
  }

  function salvarAlteracao(
    figurinhaId: string,
    quantidade: number,
    colada: boolean,
  ) {
    const estadoAnterior = itens;

    const novaQuantidade = Math.max(
      0,
      Math.min(999, quantidade),
    );

    const novaColada =
      novaQuantidade > 0 ? colada : false;

    setErro("");

    /*
     * Atualização visual imediata.
     */
    setItens((estadoAtual) =>
      estadoAtual.map((item) => {
        if (item.id !== figurinhaId) {
          return item;
        }

        return {
          ...item,
          quantidade: novaQuantidade,
          colada: novaColada,
          repetidas: Math.max(
            novaQuantidade - 1,
            0,
          ),
        };
      }),
    );

    startTransition(async () => {
      const resultado =
        await atualizarFigurinha(
          figurinhaId,
          novaQuantidade,
          novaColada,
        );

      if (!resultado.ok) {
        setItens(estadoAnterior);
        setErro(resultado.error);
        return;
      }

      router.refresh();
    });
  }

  function alterarQuantidade(
    item: FigurinhaItem,
    valor: number,
  ) {
    salvarAlteracao(
      item.id,
      valor,
      item.colada,
    );
  }

  function alternarColada(
    item: FigurinhaItem,
  ) {
    /*
     * Se marcar como colada sem possuir,
     * registra automaticamente uma unidade.
     */
    const quantidade =
      item.quantidade === 0
        ? 1
        : item.quantidade;

    salvarAlteracao(
      item.id,
      quantidade,
      !item.colada,
    );
  }

  const filtros: {
    id: FiltroStatus;
    nome: string;
    quantidade: number;
  }[] = [
    {
      id: "todas",
      nome: "Todas",
      quantidade: contagens.todas,
    },
    {
      id: "faltantes",
      nome: "Faltantes",
      quantidade: contagens.faltantes,
    },
    {
      id: "coladas",
      nome: "Coladas",
      quantidade: contagens.coladas,
    },
    {
      id: "repetidas",
      nome: "Repetidas",
      quantidade: contagens.repetidas,
    },
  ];

  return (
    <div>
      {erro && (
        <div
          role="alert"
          className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {erro}
        </div>
      )}

      {isPending && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          Salvando alteração...
        </div>
      )}

      {/* BUSCA E FILTRO POR SELEÇÃO */}
      <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div>
            <label
              htmlFor="busca-figurinha"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Buscar figurinha
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                🔍
              </span>

              <input
                id="busca-figurinha"
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder="Código, nome ou seleção"
                className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="filtro-selecao"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Seleção
            </label>

            <select
              id="filtro-selecao"
              value={selecaoSelecionada}
              onChange={(event) =>
                setSelecaoSelecionada(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="todas">
                Todas as seleções
              </option>

              {selecoes.map((selecao) => (
                <option
                  key={selecao.codigo}
                  value={selecao.codigo}
                >
                  {selecao.nome} ({selecao.codigo})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Exibindo{" "}
            <strong className="text-slate-800">
              {itensFiltrados.length}
            </strong>{" "}
            de{" "}
            <strong className="text-slate-800">
              {itens.length}
            </strong>{" "}
            figurinhas
          </p>

          {possuiFiltrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {/* FILTROS DE STATUS */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {filtros.map((item) => {
          const selecionado =
            filtroStatus === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setFiltroStatus(item.id)
              }
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                selecionado
                  ? "bg-green-700 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-green-300"
              }`}
            >
              {item.nome} ({item.quantidade})
            </button>
          );
        })}
      </div>

      {/* LISTA DE FIGURINHAS */}
      <div className="grid gap-4 md:grid-cols-2">
        {itensFiltrados.map((item) => {
          const status =
            item.quantidade === 0
              ? "Faltando"
              : item.colada
                ? "Colada"
                : "Tenho";

          const statusClass =
            item.quantidade === 0
              ? "bg-red-100 text-red-700"
              : item.colada
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-100 text-blue-700";

          return (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {item.codigo}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                    >
                      {status}
                    </span>
                  </div>

                  <h2 className="mt-3 font-bold text-slate-900">
                    {item.nome}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {item.selecaoNome}
                  </p>
                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                  {item.tipo === "escudo"
                    ? "🛡️"
                    : "⚽"}
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Quantidade que possuo
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={
                      isPending ||
                      item.quantidade === 0
                    }
                    onClick={() =>
                      alterarQuantidade(
                        item,
                        item.quantidade - 1,
                      )
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-700 transition hover:border-green-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>

                  <span className="text-3xl font-bold text-slate-900">
                    {item.quantidade}
                  </span>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      alterarQuantidade(
                        item,
                        item.quantidade + 1,
                      )
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 text-xl font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    alternarColada(item)
                  }
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    item.colada
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-emerald-400"
                  }`}
                >
                  {item.colada
                    ? "✓ Já colada"
                    : "Marcar colada"}
                </button>

                <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-amber-700">
                    Repetidas
                  </p>

                  <p className="text-lg font-bold text-amber-800">
                    {item.repetidas}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* NENHUM RESULTADO */}
      {itensFiltrados.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-4xl">
            {possuiFiltrosAtivos ? "🔍" : "🎉"}
          </div>

          <h2 className="mt-3 font-bold text-slate-900">
            Nenhuma figurinha encontrada
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {possuiFiltrosAtivos
              ? "Tente alterar a busca ou limpar os filtros."
              : "Não existem figurinhas cadastradas neste álbum."}
          </p>

          {possuiFiltrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}