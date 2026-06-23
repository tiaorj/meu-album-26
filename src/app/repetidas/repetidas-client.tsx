"use client";

import { useMemo, useState } from "react";

export type RepetidaItem = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  ordem: number;

  selecaoCodigo: string;
  selecaoNome: string;

  repetidas: number;
};

type RepetidasClientProps = {
  albumNome: string;
  initialItems: RepetidaItem[];
};

type SelecaoFiltro = {
  codigo: string;
  nome: string;
};

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function RepetidasClient({
  albumNome,
  initialItems,
}: RepetidasClientProps) {
  const [busca, setBusca] = useState("");
  const [selecaoSelecionada, setSelecaoSelecionada] =
    useState("todas");

  const [mensagemCopia, setMensagemCopia] =
    useState("");

  const selecoes = useMemo<SelecaoFiltro[]>(() => {
    const mapa = new Map<string, SelecaoFiltro>();

    initialItems.forEach((item) => {
      if (!mapa.has(item.selecaoCodigo)) {
        mapa.set(item.selecaoCodigo, {
          codigo: item.selecaoCodigo,
          nome: item.selecaoNome,
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [initialItems]);

  const itensFiltrados = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    return initialItems.filter((item) => {
      const pertenceSelecao =
        selecaoSelecionada === "todas" ||
        item.selecaoCodigo === selecaoSelecionada;

      if (!pertenceSelecao) {
        return false;
      }

      if (!buscaNormalizada) {
        return true;
      }

      const textoPesquisavel = normalizarTexto(
        [
          item.codigo,
          item.nome,
          item.selecaoCodigo,
          item.selecaoNome,
        ].join(" "),
      );

      return textoPesquisavel.includes(
        buscaNormalizada,
      );
    });
  }, [
    busca,
    initialItems,
    selecaoSelecionada,
  ]);

  const grupos = useMemo(() => {
    const mapa = new Map<
      string,
      {
        codigo: string;
        nome: string;
        itens: RepetidaItem[];
      }
    >();

    itensFiltrados.forEach((item) => {
      const chave = item.selecaoCodigo;

      const grupoExistente = mapa.get(chave);

      if (grupoExistente) {
        grupoExistente.itens.push(item);
        return;
      }

      mapa.set(chave, {
        codigo: item.selecaoCodigo,
        nome: item.selecaoNome,
        itens: [item],
      });
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [itensFiltrados]);

  const totalCodigos = itensFiltrados.length;

  const totalRepetidas = useMemo(() => {
    return itensFiltrados.reduce(
      (total, item) => total + item.repetidas,
      0,
    );
  }, [itensFiltrados]);

  const textoCompartilhamento = useMemo(() => {
    const linhas: string[] = [
      `⚽ *Minhas figurinhas repetidas — ${albumNome}*`,
      "",
    ];

    grupos.forEach((grupo) => {
      linhas.push(`*${grupo.nome}*`);

      const codigos = grupo.itens
        .map(
          (item) =>
            `${item.codigo} (${item.repetidas})`,
        )
        .join(", ");

      linhas.push(codigos);
      linhas.push("");
    });

    linhas.push(
      `Total: ${totalCodigos} códigos e ${totalRepetidas} figurinhas repetidas.`,
    );

    linhas.push("");
    linhas.push("Disponíveis para troca.");

    return linhas.join("\n");
  }, [
    albumNome,
    grupos,
    totalCodigos,
    totalRepetidas,
  ]);

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(
      textoCompartilhamento,
    )}`;

  function limparFiltros() {
    setBusca("");
    setSelecaoSelecionada("todas");
    setMensagemCopia("");
  }

  async function copiarLista() {
    setMensagemCopia("");

    try {
      await navigator.clipboard.writeText(
        textoCompartilhamento,
      );

      setMensagemCopia(
        "Lista copiada com sucesso.",
      );
    } catch {
      setMensagemCopia(
        "Não foi possível copiar a lista.",
      );
    }
  }

  const possuiFiltro =
    busca.trim() !== "" ||
    selecaoSelecionada !== "todas";

  return (
    <div>
      {/* RESUMO */}
      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Códigos repetidos
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-900">
            {totalCodigos}
          </p>

          <p className="mt-1 text-xs text-amber-700">
            Figurinhas diferentes
          </p>
        </article>

        <article className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Total para troca
          </p>

          <p className="mt-2 text-3xl font-bold text-green-900">
            {totalRepetidas}
          </p>

          <p className="mt-1 text-xs text-green-700">
            Unidades repetidas
          </p>
        </article>
      </section>

      {/* FILTROS */}
      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div>
            <label
              htmlFor="busca-repetida"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Buscar repetida
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                🔍
              </span>

              <input
                id="busca-repetida"
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder="Código, nome ou seleção"
                className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="selecao-repetida"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Seleção
            </label>

            <select
              id="selecao-repetida"
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
              {totalCodigos}
            </strong>{" "}
            códigos repetidos
          </p>

          {possuiFiltro && (
            <button
              type="button"
              onClick={limparFiltros}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {/* COMPARTILHAMENTO */}
      {itensFiltrados.length > 0 && (
        <section className="mt-5 rounded-3xl bg-green-700 p-5 text-white shadow-sm">
          <h2 className="text-lg font-bold">
            Compartilhar lista
          </h2>

          <p className="mt-1 text-sm text-green-100">
            Envie as figurinhas exibidas para seus
            amigos e grupos de troca.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-green-700 transition hover:bg-green-50"
            >
              <span>📱</span>
              Compartilhar no WhatsApp
            </a>

            <button
              type="button"
              onClick={copiarLista}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              <span>📋</span>
              Copiar lista
            </button>
          </div>

          {mensagemCopia && (
            <p
              role="status"
              className="mt-3 rounded-xl bg-white/10 p-3 text-sm text-green-50"
            >
              {mensagemCopia}
            </p>
          )}
        </section>
      )}

      {/* LISTA AGRUPADA */}
      <div className="mt-6 space-y-6">
        {grupos.map((grupo) => {
          const totalGrupo = grupo.itens.reduce(
            (total, item) =>
              total + item.repetidas,
            0,
          );

          return (
            <section key={grupo.codigo}>
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                    {grupo.codigo}
                  </p>

                  <h2 className="text-xl font-bold text-slate-900">
                    {grupo.nome}
                  </h2>
                </div>

                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  {totalGrupo} para troca
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {grupo.itens.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {item.codigo}
                        </span>

                        <h3 className="mt-3 font-bold text-slate-900">
                          {item.nome}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.selecaoNome}
                        </p>
                      </div>

                      <div className="flex h-14 min-w-14 flex-col items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                        <span className="text-xl font-bold">
                          {item.repetidas}
                        </span>

                        <span className="text-[10px] font-semibold uppercase">
                          repetidas
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* SEM RESULTADOS */}
      {itensFiltrados.length === 0 && (
        <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-5xl">
            {possuiFiltro ? "🔍" : "🎉"}
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {possuiFiltro
              ? "Nenhuma repetida encontrada"
              : "Você não possui repetidas"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {possuiFiltro
              ? "Altere a busca ou limpe os filtros."
              : "Quando você possuir duas ou mais unidades de uma figurinha, ela aparecerá aqui."}
          </p>

          {possuiFiltro && (
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Limpar filtros
            </button>
          )}
        </section>
      )}
    </div>
  );
}