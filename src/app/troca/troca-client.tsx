"use client";

import {
  useMemo,
  useState,
} from "react";

export type TrocaItem = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  ordem: number;

  selecaoCodigo: string;
  selecaoNome: string;

  quantidade: number;
  colada: boolean;
  repetidas: number;
};

type TrocaClientProps = {
  albumNome: string;
  initialItems: TrocaItem[];
};

type ModoTroca =
  | "faltantes"
  | "repetidas";

type GrupoTroca = {
  codigo: string;
  nome: string;
  itens: TrocaItem[];
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

export function TrocaClient({
  albumNome,
  initialItems,
}: TrocaClientProps) {
  const [modo, setModo] =
    useState<ModoTroca>("faltantes");

  const [busca, setBusca] =
    useState("");

  const [
    selecaoSelecionada,
    setSelecaoSelecionada,
  ] = useState("todas");

  const [
    mostrarNomes,
    setMostrarNomes,
  ] = useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const totalFaltantes = useMemo(
    () =>
      initialItems.filter(
        (item) => item.quantidade === 0,
      ).length,
    [initialItems],
  );

  const codigosRepetidos = useMemo(
    () =>
      initialItems.filter(
        (item) => item.repetidas > 0,
      ).length,
    [initialItems],
  );

  const unidadesRepetidas = useMemo(
    () =>
      initialItems.reduce(
        (total, item) =>
          total + item.repetidas,
        0,
      ),
    [initialItems],
  );

  const itensDoModo = useMemo(() => {
    if (modo === "repetidas") {
      return initialItems.filter(
        (item) => item.repetidas > 0,
      );
    }

    return initialItems.filter(
      (item) => item.quantidade === 0,
    );
  }, [
    initialItems,
    modo,
  ]);

  const selecoes = useMemo(() => {
    const mapa = new Map<
      string,
      {
        codigo: string;
        nome: string;
      }
    >();

    itensDoModo.forEach((item) => {
      if (!mapa.has(item.selecaoCodigo)) {
        mapa.set(item.selecaoCodigo, {
          codigo: item.selecaoCodigo,
          nome: item.selecaoNome,
        });
      }
    });

    return Array.from(mapa.values()).sort(
      (a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR",
        ),
    );
  }, [itensDoModo]);

  const itensFiltrados = useMemo(() => {
    const termo =
      normalizarTexto(busca);

    return itensDoModo.filter((item) => {
      const selecaoCorreta =
        selecaoSelecionada === "todas" ||
        item.selecaoCodigo ===
          selecaoSelecionada;

      if (!selecaoCorreta) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const texto = normalizarTexto(
        [
          item.codigo,
          item.nome,
          item.selecaoCodigo,
          item.selecaoNome,
        ].join(" "),
      );

      return texto.includes(termo);
    });
  }, [
    busca,
    itensDoModo,
    selecaoSelecionada,
  ]);

  const grupos = useMemo<GrupoTroca[]>(
    () => {
      const mapa = new Map<
        string,
        GrupoTroca
      >();

      itensFiltrados.forEach((item) => {
        const existente = mapa.get(
          item.selecaoCodigo,
        );

        if (existente) {
          existente.itens.push(item);
          return;
        }

        mapa.set(item.selecaoCodigo, {
          codigo: item.selecaoCodigo,
          nome: item.selecaoNome,
          itens: [item],
        });
      });

      return Array.from(
        mapa.values(),
      ).sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR",
        ),
      );
    },
    [itensFiltrados],
  );

  const totalExibido = useMemo(() => {
    if (modo === "faltantes") {
      return itensFiltrados.length;
    }

    return itensFiltrados.reduce(
      (total, item) =>
        total + item.repetidas,
      0,
    );
  }, [
    itensFiltrados,
    modo,
  ]);

  const textoCompartilhamento =
    useMemo(() => {
      const titulo =
        modo === "faltantes"
          ? "Figurinhas que procuro"
          : "Figurinhas repetidas";

      const linhas: string[] = [
        `⚽ *${titulo} — ${albumNome}*`,
        "",
      ];

      grupos.forEach((grupo) => {
        linhas.push(`*${grupo.nome}*`);

        const codigos =
          grupo.itens
            .map((item) => {
              if (
                modo === "repetidas"
              ) {
                return `${item.codigo} x${item.repetidas}`;
              }

              return item.codigo;
            })
            .join(", ");

        linhas.push(codigos);
        linhas.push("");
      });

      if (modo === "faltantes") {
        linhas.push(
          `Total: ${itensFiltrados.length} figurinhas faltantes.`,
        );
      } else {
        linhas.push(
          `Total: ${itensFiltrados.length} códigos e ${totalExibido} unidades repetidas.`,
        );
      }

      linhas.push("");
      linhas.push(
        "Lista gerada pelo Meu Álbum 26.",
      );

      return linhas.join("\n");
    }, [
      albumNome,
      grupos,
      itensFiltrados.length,
      modo,
      totalExibido,
    ]);

  const possuiFiltro =
    busca.trim() !== "" ||
    selecaoSelecionada !== "todas";

  function alterarModo(
    novoModo: ModoTroca,
  ) {
    setModo(novoModo);
    setSelecaoSelecionada("todas");
    setBusca("");
    setMensagem("");
  }

  function limparFiltros() {
    setBusca("");
    setSelecaoSelecionada("todas");
    setMensagem("");
  }

  function compartilharWhatsApp() {
    setMensagem("");

    /*
     * Listas enormes podem ultrapassar o
     * tamanho permitido pelo endereço do WhatsApp.
     */
    if (
      textoCompartilhamento.length >
      6500
    ) {
      setMensagem(
        "A lista está muito grande. Filtre por uma seleção antes de compartilhar.",
      );

      return;
    }

    const url =
      `https://wa.me/?text=${encodeURIComponent(
        textoCompartilhamento,
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function copiarLista() {
    setMensagem("");

    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          textoCompartilhamento,
        );
      } else {
        const textarea =
          document.createElement(
            "textarea",
          );

        textarea.value =
          textoCompartilhamento;

        textarea.style.position =
          "fixed";

        textarea.style.opacity = "0";

        document.body.appendChild(
          textarea,
        );

        textarea.focus();
        textarea.select();

        const resultado =
          document.execCommand("copy");

        document.body.removeChild(
          textarea,
        );

        if (!resultado) {
          throw new Error(
            "Não foi possível copiar.",
          );
        }
      }

      setMensagem(
        "Lista copiada com sucesso.",
      );
    } catch {
      setMensagem(
        "Não foi possível copiar a lista.",
      );
    }
  }

  return (
    <div>
      {/* CONTROLES FIXOS */}
      <section className="sticky top-0 z-30 -mx-3 border-b border-slate-200 bg-slate-100/95 px-3 pb-3 pt-1 backdrop-blur sm:-mx-4 sm:px-4">
        {/* MODOS */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200 p-1">
          <button
            type="button"
            onClick={() =>
              alterarModo("faltantes")
            }
            className={`touch-manipulation rounded-xl px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${
              modo === "faltantes"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-600"
            }`}
          >
            Procuro
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">
              {totalFaltantes}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              alterarModo("repetidas")
            }
            className={`touch-manipulation rounded-xl px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${
              modo === "repetidas"
                ? "bg-amber-500 text-amber-950 shadow-sm"
                : "text-slate-600"
            }`}
          >
            Repetidas
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">
              {codigosRepetidos}
            </span>
          </button>
        </div>

        {/* BUSCA */}
        <div className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              🔍
            </span>

            <input
              type="search"
              value={busca}
              onChange={(event) =>
                setBusca(
                  event.target.value,
                )
              }
              placeholder="BRA12, Messi, Brasil..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-10 text-base font-medium outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

            {busca && (
              <button
                type="button"
                onClick={() =>
                  setBusca("")
                }
                aria-label="Limpar busca"
                className="touch-manipulation absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-xl text-slate-500 active:bg-slate-100"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setMostrarNomes(
                (valor) => !valor,
              )
            }
            className={`touch-manipulation h-12 shrink-0 rounded-xl border px-3 text-xs font-bold active:scale-95 ${
              mostrarNomes
                ? "border-green-700 bg-green-700 text-white"
                : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            {mostrarNomes
              ? "Ocultar nomes"
              : "Ver nomes"}
          </button>
        </div>

        {/* SELEÇÕES */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() =>
              setSelecaoSelecionada(
                "todas",
              )
            }
            className={`touch-manipulation shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
              selecaoSelecionada ===
              "todas"
                ? "bg-green-700 text-white"
                : "border border-slate-300 bg-white text-slate-600"
            }`}
          >
            Todas
          </button>

          {selecoes.map((selecao) => (
            <button
              key={selecao.codigo}
              type="button"
              title={selecao.nome}
              onClick={() =>
                setSelecaoSelecionada(
                  selecao.codigo,
                )
              }
              className={`touch-manipulation shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
                selecaoSelecionada ===
                selecao.codigo
                  ? "bg-green-700 text-white"
                  : "border border-slate-300 bg-white text-slate-600"
              }`}
            >
              {selecao.codigo}
            </button>
          ))}
        </div>
      </section>

      {/* RESUMO E AÇÕES */}
      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {modo === "faltantes"
                ? "Códigos procurados"
                : "Unidades para troca"}
            </p>

            <p className="mt-1 text-2xl font-black text-slate-900">
              {totalExibido}
            </p>

            {modo === "repetidas" && (
              <p className="text-xs text-slate-500">
                {itensFiltrados.length} códigos
                diferentes
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={copiarLista}
              disabled={
                itensFiltrados.length === 0
              }
              className="touch-manipulation rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 active:scale-95 disabled:opacity-40"
            >
              📋 Copiar
            </button>

            <button
              type="button"
              onClick={
                compartilharWhatsApp
              }
              disabled={
                itensFiltrados.length === 0
              }
              className="touch-manipulation rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white active:scale-95 disabled:opacity-40"
            >
              📱 WhatsApp
            </button>
          </div>
        </div>

        {possuiFiltro && (
          <button
            type="button"
            onClick={limparFiltros}
            className="touch-manipulation mt-3 text-sm font-semibold text-red-600"
          >
            Limpar busca e seleção
          </button>
        )}

        {mensagem && (
          <p
            role="status"
            className="mt-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-700"
          >
            {mensagem}
          </p>
        )}
      </section>

      {/* LISTA COMPACTA */}
      <div className="mt-4 space-y-6">
        {grupos.map((grupo) => {
          const totalGrupo =
            modo === "repetidas"
              ? grupo.itens.reduce(
                  (total, item) =>
                    total +
                    item.repetidas,
                  0,
                )
              : grupo.itens.length;

          return (
            <section key={grupo.codigo}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-green-700">
                    {grupo.codigo}
                  </p>

                  <h2 className="text-base font-bold text-slate-900">
                    {grupo.nome}
                  </h2>
                </div>

                <span className="text-xs font-bold text-slate-500">
                  {totalGrupo}{" "}
                  {modo === "repetidas"
                    ? "unidades"
                    : "códigos"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                {grupo.itens.map(
                  (item) => (
                    <article
                      key={item.id}
                      title={`${item.codigo} — ${item.nome}`}
                      className={`relative min-h-14 rounded-xl border px-1.5 py-2 text-center shadow-sm ${
                        modo === "faltantes"
                          ? "border-red-200 bg-red-50 text-red-900"
                          : "border-amber-300 bg-amber-50 text-amber-950"
                      }`}
                    >
                      <span className="block break-all text-base font-black leading-tight tracking-tight">
                        {item.codigo}
                      </span>

                      {modo ===
                        "repetidas" && (
                        <span className="absolute -right-1.5 -top-1.5 flex min-h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-black text-amber-950 shadow">
                          ×{item.repetidas}
                        </span>
                      )}

                      {mostrarNomes && (
                        <span className="mt-1 block line-clamp-2 text-[10px] font-medium leading-tight opacity-75">
                          {item.nome}
                        </span>
                      )}
                    </article>
                  ),
                )}
              </div>
            </section>
          );
        })}
      </div>

      {itensFiltrados.length === 0 && (
        <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-5xl">
            {possuiFiltro ? "🔍" : "🎉"}
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {possuiFiltro
              ? "Nenhuma figurinha encontrada"
              : modo === "faltantes"
                ? "Nenhuma figurinha faltando"
                : "Nenhuma figurinha repetida"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {possuiFiltro
              ? "Altere a busca ou limpe os filtros."
              : modo === "faltantes"
                ? "Você já possui todas as figurinhas."
                : "As repetidas aparecerão quando houver duas ou mais unidades."}
          </p>

          {possuiFiltro && (
            <button
              type="button"
              onClick={limparFiltros}
              className="touch-manipulation mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white"
            >
              Limpar filtros
            </button>
          )}
        </section>
      )}

      {modo === "repetidas" &&
        unidadesRepetidas > 0 && (
          <p className="mt-6 text-center text-xs text-slate-400">
            Total geral:{" "}
            {unidadesRepetidas} unidades
            repetidas.
          </p>
        )}
    </div>
  );
}