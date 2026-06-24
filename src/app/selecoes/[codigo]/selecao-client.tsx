"use client";

import {
  useMemo,
  useState,
} from "react";

import { useColecaoRapida } from "@/hooks/use-colecao-rapida";

export type SelecaoFigurinhaItem = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  ordem: number;

  quantidade: number;
  colada: boolean;
  repetidas: number;
};

type SelecaoClientProps = {
  selecaoCodigo: string;
  selecaoNome: string;
  initialItems: SelecaoFigurinhaItem[];
};

type FiltroStatus =
  | "todas"
  | "faltantes"
  | "tenho"
  | "repetidas";

export function SelecaoClient({
  selecaoCodigo,
  selecaoNome,
  initialItems,
}: SelecaoClientProps) {
  const {
    itens,
    erro,
    salvandoIds,
    salvarAlteracao,
  } =
    useColecaoRapida<SelecaoFigurinhaItem>(
      initialItems,
    );

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState<FiltroStatus>("todas");

  const [
    mostrarNomes,
    setMostrarNomes,
  ] = useState(true);

  const [
    marcarColadaAoAdicionar,
    setMarcarColadaAoAdicionar,
  ] = useState(false);

  const contagens = useMemo(
    () => ({
      todas: itens.length,

      faltantes:
        itens.filter(
          (item) =>
            item.quantidade === 0,
        ).length,

      tenho:
        itens.filter(
          (item) =>
            item.quantidade > 0,
        ).length,

      repetidas:
        itens.filter(
          (item) =>
            item.repetidas > 0,
        ).length,

      coladas:
        itens.filter(
          (item) => item.colada,
        ).length,

      unidadesRepetidas:
        itens.reduce(
          (total, item) =>
            total +
            item.repetidas,
          0,
        ),
    }),
    [itens],
  );

  const itensFiltrados =
    useMemo(() => {
      if (
        filtroStatus ===
        "faltantes"
      ) {
        return itens.filter(
          (item) =>
            item.quantidade === 0,
        );
      }

      if (
        filtroStatus === "tenho"
      ) {
        return itens.filter(
          (item) =>
            item.quantidade > 0,
        );
      }

      if (
        filtroStatus ===
        "repetidas"
      ) {
        return itens.filter(
          (item) =>
            item.repetidas > 0,
        );
      }

      return itens;
    }, [
      filtroStatus,
      itens,
    ]);

  const percentual =
    itens.length > 0
      ? Math.round(
          (
            contagens.tenho /
            itens.length
          ) * 100,
        )
      : 0;

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
      id: "repetidas",
      nome: "Repetidas",
      quantidade:
        contagens.repetidas,
    },
  ];

  function marcarComoTenho(
    item: SelecaoFigurinhaItem,
  ) {
    if (item.quantidade > 0) {
      return;
    }

    salvarAlteracao(
      item.id,
      1,
      marcarColadaAoAdicionar,
    );
  }

  function aumentarQuantidade(
    item: SelecaoFigurinhaItem,
  ) {
    salvarAlteracao(
      item.id,
      item.quantidade + 1,
      item.colada,
    );
  }

  function diminuirQuantidade(
    item: SelecaoFigurinhaItem,
  ) {
    if (item.quantidade === 0) {
      return;
    }

    salvarAlteracao(
      item.id,
      item.quantidade - 1,
      item.colada,
    );
  }

  function alternarColada(
    item: SelecaoFigurinhaItem,
  ) {
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

  return (
    <div>
      {erro && (
        <div
          role="alert"
          className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {erro}
        </div>
      )}

      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-green-700">
              {selecaoCodigo}
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {selecaoNome}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {contagens.tenho} de{" "}
              {itens.length} figurinhas
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-black text-green-700">
              {percentual}%
            </p>

            <p className="text-xs text-slate-400">
              completo
            </p>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-green-600 transition-all"
            style={{
              width: `${percentual}%`,
            }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xl font-black text-red-700">
              {contagens.faltantes}
            </p>

            <p className="text-[10px] font-semibold uppercase text-red-500">
              Faltantes
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-xl font-black text-emerald-700">
              {contagens.coladas}
            </p>

            <p className="text-[10px] font-semibold uppercase text-emerald-500">
              Coladas
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-3">
            <p className="text-xl font-black text-amber-700">
              {
                contagens.unidadesRepetidas
              }
            </p>

            <p className="text-[10px] font-semibold uppercase text-amber-600">
              Repetidas
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-30 -mx-3 mt-3 border-y border-slate-200 bg-slate-100/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtros.map(
            (filtro) => (
              <button
                key={filtro.id}
                type="button"
                onClick={() =>
                  setFiltroStatus(
                    filtro.id,
                  )
                }
                className={`touch-manipulation shrink-0 rounded-full px-4 py-2 text-xs font-bold active:scale-95 ${
                  filtroStatus ===
                  filtro.id
                    ? "bg-green-700 text-white"
                    : "border border-slate-300 bg-white text-slate-600"
                }`}
              >
                {filtro.nome} (
                {filtro.quantidade})
              </button>
            ),
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={
                mostrarNomes
              }
              onChange={(event) =>
                setMostrarNomes(
                  event.target
                    .checked,
                )
              }
              className="h-4 w-4 accent-green-700"
            />

            Mostrar nomes
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={
                marcarColadaAoAdicionar
              }
              onChange={(event) =>
                setMarcarColadaAoAdicionar(
                  event.target
                    .checked,
                )
              }
              className="h-4 w-4 accent-green-700"
            />

            Adicionar como colada
          </label>
        </div>
      </section>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Toque em uma figurinha vermelha
        para marcar que possui. Use os
        botões − e + para ajustar a
        quantidade.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {itensFiltrados.map(
          (item) => {
            const faltando =
              item.quantidade === 0;

            const repetida =
              item.repetidas > 0;

            const estaSalvando =
              salvandoIds.has(
                item.id,
              );

            const classeCartao =
              faltando
                ? "border-red-200 bg-red-50 text-red-900"
                : repetida
                  ? "border-amber-300 bg-amber-50 text-amber-950"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900";

            return (
              <article
                key={item.id}
                className={`relative min-h-32 rounded-2xl border p-2 text-center shadow-sm transition ${classeCartao}`}
              >
                {estaSalvando && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
                )}

                {item.colada && (
                  <span className="absolute left-2 top-2 text-xs">
                    ✓
                  </span>
                )}

                <button
                  type="button"
                  onClick={() =>
                    marcarComoTenho(
                      item,
                    )
                  }
                  disabled={!faltando}
                  className="touch-manipulation w-full disabled:cursor-default"
                >
                  <span className="block text-base font-black leading-tight">
                    {item.codigo}
                  </span>

                  {mostrarNomes && (
                    <span className="mt-1 block line-clamp-2 min-h-7 text-[10px] font-semibold leading-tight opacity-75">
                      {item.nome}
                    </span>
                  )}

                  {faltando ? (
                    <span className="mt-2 block text-[9px] font-black uppercase text-red-500">
                      Toque para marcar
                    </span>
                  ) : (
                    <span className="mt-2 block text-lg font-black">
                      ×{item.quantidade}
                    </span>
                  )}
                </button>

                {!faltando && (
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        diminuirQuantidade(
                          item,
                        )
                      }
                      aria-label={`Diminuir ${item.codigo}`}
                      className="touch-manipulation flex h-8 items-center justify-center rounded-lg bg-white/80 text-lg font-black text-red-700 active:scale-90"
                    >
                      −
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        alternarColada(
                          item,
                        )
                      }
                      aria-label={
                        item.colada
                          ? `Desmarcar ${item.codigo} como colada`
                          : `Marcar ${item.codigo} como colada`
                      }
                      className={`touch-manipulation flex h-8 items-center justify-center rounded-lg text-xs font-black active:scale-90 ${
                        item.colada
                          ? "bg-emerald-600 text-white"
                          : "bg-white/80 text-slate-600"
                      }`}
                    >
                      ✓
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        aumentarQuantidade(
                          item,
                        )
                      }
                      aria-label={`Aumentar ${item.codigo}`}
                      className="touch-manipulation flex h-8 items-center justify-center rounded-lg bg-green-700 text-lg font-black text-white active:scale-90"
                    >
                      +
                    </button>
                  </div>
                )}
              </article>
            );
          },
        )}
      </div>

      {itensFiltrados.length ===
        0 && (
        <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-5xl">
            🎉
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Nenhuma figurinha neste filtro
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Escolha outro filtro para
            continuar.
          </p>

          <button
            type="button"
            onClick={() =>
              setFiltroStatus(
                "todas",
              )
            }
            className="touch-manipulation mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white"
          >
            Mostrar todas
          </button>
        </section>
      )}
    </div>
  );
}