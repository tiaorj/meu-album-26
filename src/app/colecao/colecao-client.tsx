"use client";

import {
  useMemo,
  useState,
} from "react";

import { useColecaoRapida } from "@/hooks/use-colecao-rapida";

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
  | "tenho"
  | "coladas"
  | "repetidas";

type SelecaoFiltro = {
  codigo: string;
  nome: string;
};

function normalizarTexto(
  texto: string,
): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function ColecaoClient({
  initialItems,
}: ColecaoClientProps) {
  /*
   * O hook mantém as mudanças imediatamente
   * na tela e salva no Supabase em segundo plano.
   */
  const {
    itens,
    erro,
    salvandoIds,
    salvarAlteracao,
  } = useColecaoRapida<FigurinhaItem>(
    initialItems,
  );

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState<FiltroStatus>("todas");

  const [
    selecaoSelecionada,
    setSelecaoSelecionada,
  ] = useState("todas");

  const [busca, setBusca] =
    useState("");

  /*
   * Monta a lista de seleções sem duplicidade.
   */
  const selecoes =
    useMemo<SelecaoFiltro[]>(() => {
      const mapaSelecoes =
        new Map<
          string,
          SelecaoFiltro
        >();

      itens.forEach((item) => {
        if (
          !mapaSelecoes.has(
            item.selecaoCodigo,
          )
        ) {
          mapaSelecoes.set(
            item.selecaoCodigo,
            {
              codigo:
                item.selecaoCodigo,

              nome:
                item.selecaoNome,
            },
          );
        }
      });

      return Array.from(
        mapaSelecoes.values(),
      ).sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR",
        ),
      );
    }, [itens]);

  /*
   * Primeiro aplica busca e seleção.
   */
  const itensPorBuscaESelecao =
    useMemo(() => {
      const buscaNormalizada =
        normalizarTexto(busca);

      return itens.filter((item) => {
        const pertenceSelecao =
          selecaoSelecionada ===
            "todas" ||
          item.selecaoCodigo ===
            selecaoSelecionada;

        if (!pertenceSelecao) {
          return false;
        }

        if (!buscaNormalizada) {
          return true;
        }

        const camposPesquisaveis =
          normalizarTexto(
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
   * Contadores considerando a busca
   * e a seleção escolhida.
   */
  const contagens = useMemo(() => {
    return {
      todas:
        itensPorBuscaESelecao.length,

      faltantes:
        itensPorBuscaESelecao.filter(
          (item) =>
            item.quantidade === 0,
        ).length,

      tenho:
        itensPorBuscaESelecao.filter(
          (item) =>
            item.quantidade > 0,
        ).length,

      coladas:
        itensPorBuscaESelecao.filter(
          (item) => item.colada,
        ).length,

      repetidas:
        itensPorBuscaESelecao.filter(
          (item) =>
            item.repetidas > 0,
        ).length,
    };
  }, [itensPorBuscaESelecao]);

  /*
   * Aplica o filtro de status.
   */
  const itensFiltrados =
    useMemo(() => {
      if (
        filtroStatus ===
        "faltantes"
      ) {
        return itensPorBuscaESelecao.filter(
          (item) =>
            item.quantidade === 0,
        );
      }

      if (
        filtroStatus === "tenho"
      ) {
        return itensPorBuscaESelecao.filter(
          (item) =>
            item.quantidade > 0,
        );
      }

      if (
        filtroStatus ===
        "coladas"
      ) {
        return itensPorBuscaESelecao.filter(
          (item) => item.colada,
        );
      }

      if (
        filtroStatus ===
        "repetidas"
      ) {
        return itensPorBuscaESelecao.filter(
          (item) =>
            item.repetidas > 0,
        );
      }

      return itensPorBuscaESelecao;
    }, [
      filtroStatus,
      itensPorBuscaESelecao,
    ]);

  const possuiFiltrosAtivos =
    busca.trim() !== "" ||
    selecaoSelecionada !==
      "todas" ||
    filtroStatus !== "todas";

  function limparFiltros() {
    setBusca("");

    setSelecaoSelecionada(
      "todas",
    );

    setFiltroStatus("todas");
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

  function marcarComoTenho(
    item: FigurinhaItem,
  ) {
    const novaQuantidade =
      item.quantidade > 0
        ? item.quantidade
        : 1;

    salvarAlteracao(
      item.id,
      novaQuantidade,
      item.colada,
    );
  }

  function removerDaColecao(
    item: FigurinhaItem,
  ) {
    salvarAlteracao(
      item.id,
      0,
      false,
    );
  }

  function alternarColada(
    item: FigurinhaItem,
  ) {
    /*
     * Ao marcar como colada uma figurinha
     * ainda não possuída, registra uma unidade.
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
      quantidade:
        contagens.todas,
    },
    {
      id: "faltantes",
      nome: "Faltantes",
      quantidade:
        contagens.faltantes,
    },
    {
      id: "tenho",
      nome: "Tenho",
      quantidade:
        contagens.tenho,
    },
    {
      id: "coladas",
      nome: "Coladas",
      quantidade:
        contagens.coladas,
    },
    {
      id: "repetidas",
      nome: "Repetidas",
      quantidade:
        contagens.repetidas,
    },
  ];

  return (
    <div>
      {/* ERRO */}
      {erro && (
        <div
          role="alert"
          className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-bold">
            Não foi possível salvar
          </p>

          <p className="mt-1">
            {erro}
          </p>
        </div>
      )}

      {/* SALVAMENTO EM SEGUNDO PLANO */}
      {salvandoIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="h-3 w-3 animate-pulse rounded-full bg-blue-500" />

          <span>
            Salvando{" "}
            {salvandoIds.size === 1
              ? "uma alteração"
              : `${salvandoIds.size} alterações`}
            ...
          </span>
        </div>
      )}

      {/* BUSCA E SELEÇÃO */}
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
                  setBusca(
                    event.target.value,
                  )
                }
                placeholder="BRA12, jogador ou seleção"
                className="h-12 w-full rounded-xl border border-slate-300 py-3 pl-12 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              {busca && (
                <button
                  type="button"
                  onClick={() =>
                    setBusca("")
                  }
                  aria-label="Limpar busca"
                  className="touch-manipulation absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-xl text-slate-400 active:bg-slate-100"
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
              value={
                selecaoSelecionada
              }
              onChange={(event) =>
                setSelecaoSelecionada(
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="todas">
                Todas as seleções
              </option>

              {selecoes.map(
                (selecao) => (
                  <option
                    key={
                      selecao.codigo
                    }
                    value={
                      selecao.codigo
                    }
                  >
                    {selecao.nome} (
                    {selecao.codigo})
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Exibindo{" "}
            <strong className="text-slate-800">
              {
                itensFiltrados.length
              }
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
              className="touch-manipulation rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition active:scale-95 active:bg-red-50 active:text-red-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {/* FILTROS DE STATUS */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {filtros.map((filtro) => {
          const selecionado =
            filtroStatus ===
            filtro.id;

          return (
            <button
              key={filtro.id}
              type="button"
              onClick={() =>
                setFiltroStatus(
                  filtro.id,
                )
              }
              className={`touch-manipulation shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                selecionado
                  ? "bg-green-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 active:bg-green-50"
              }`}
            >
              {filtro.nome} (
              {filtro.quantidade})
            </button>
          );
        })}
      </div>

      {/* LISTA DE FIGURINHAS */}
      <div className="grid gap-4 md:grid-cols-2">
        {itensFiltrados.map(
          (item) => {
            const estaSalvando =
              salvandoIds.has(
                item.id,
              );

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
                className={`rounded-3xl border bg-white p-5 shadow-sm transition ${
                  estaSalvando
                    ? "border-blue-300 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {item.codigo}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                      >
                        {status}
                      </span>

                      {estaSalvando && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />

                          Salvando
                        </span>
                      )}

                      {item.repetidas >
                        0 && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          {
                            item.repetidas
                          }{" "}
                          repetida
                          {item.repetidas >
                          1
                            ? "s"
                            : ""}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 truncate font-bold text-slate-900">
                      {item.nome}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        item.selecaoNome
                      }
                    </p>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                    {item.tipo ===
                    "escudo"
                      ? "🛡️"
                      : item.tipo ===
                          "selecao"
                        ? "📸"
                        : item.tipo ===
                            "especial"
                          ? "🏆"
                          : "⚽"}
                  </div>
                </div>

                {/* MARCAÇÃO RÁPIDA */}
                {item.quantidade ===
                0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      marcarComoTenho(
                        item,
                      )
                    }
                    className="touch-manipulation mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-4 py-4 text-sm font-bold text-white transition active:scale-[0.98] active:bg-green-800"
                  >
                    <span className="text-lg">
                      +
                    </span>

                    Marcar que tenho
                  </button>
                ) : (
                  <>
                    {/* QUANTIDADE */}
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Quantidade que
                        possuo
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          disabled={
                            item.quantidade ===
                            0
                          }
                          onClick={() =>
                            alterarQuantidade(
                              item,
                              item.quantidade -
                                1,
                            )
                          }
                          aria-label={`Diminuir quantidade de ${item.codigo}`}
                          className="touch-manipulation flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-2xl font-bold text-slate-700 transition active:scale-90 active:border-red-400 active:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          −
                        </button>

                        <div className="text-center">
                          <span className="block text-3xl font-black text-slate-900">
                            {
                              item.quantidade
                            }
                          </span>

                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            unidades
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            alterarQuantidade(
                              item,
                              item.quantidade +
                                1,
                            )
                          }
                          aria-label={`Aumentar quantidade de ${item.codigo}`}
                          className="touch-manipulation flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 text-2xl font-bold text-white transition active:scale-90 active:bg-green-800"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* COLADA E REPETIDAS */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          alternarColada(
                            item,
                          )
                        }
                        className={`touch-manipulation rounded-xl px-3 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                          item.colada
                            ? "bg-emerald-600 text-white active:bg-emerald-700"
                            : "border border-slate-300 bg-white text-slate-700 active:border-emerald-400 active:bg-emerald-50"
                        }`}
                      >
                        {item.colada
                          ? "✓ Já colada"
                          : "Marcar colada"}
                      </button>

                      <div className="rounded-xl bg-amber-50 px-3 py-3 text-center">
                        <p className="text-xs font-semibold text-amber-700">
                          Repetidas
                        </p>

                        <p className="text-lg font-black text-amber-800">
                          {
                            item.repetidas
                          }
                        </p>
                      </div>
                    </div>

                    {/* REMOVER */}
                    <button
                      type="button"
                      onClick={() =>
                        removerDaColecao(
                          item,
                        )
                      }
                      className="touch-manipulation mt-3 w-full rounded-xl px-4 py-2 text-xs font-semibold text-red-600 transition active:bg-red-50"
                    >
                      Remover da minha
                      coleção
                    </button>
                  </>
                )}
              </article>
            );
          },
        )}
      </div>

      {/* NENHUM RESULTADO */}
      {itensFiltrados.length ===
        0 && (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-5xl">
            {possuiFiltrosAtivos
              ? "🔍"
              : "🎉"}
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {possuiFiltrosAtivos
              ? "Nenhuma figurinha encontrada"
              : "Nenhuma figurinha cadastrada"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {possuiFiltrosAtivos
              ? "Altere a busca ou limpe os filtros utilizados."
              : "Não existem figurinhas cadastradas neste álbum."}
          </p>

          {possuiFiltrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="touch-manipulation mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white active:scale-95"
            >
              Limpar todos os
              filtros
            </button>
          )}
        </section>
      )}
    </div>
  );
}