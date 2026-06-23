"use client";

import { useMemo, useState } from "react";

export type FaltanteItem = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  ordem: number;

  selecaoCodigo: string;
  selecaoNome: string;
};

type FaltantesClientProps = {
  albumNome: string;
  initialItems: FaltanteItem[];
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

export function FaltantesClient({
  albumNome,
  initialItems,
}: FaltantesClientProps) {
  const [busca, setBusca] = useState("");

  const [selecaoSelecionada, setSelecaoSelecionada] =
    useState("todas");

  const [mensagemCopia, setMensagemCopia] =
    useState("");

  /*
   * Lista de seleções disponíveis nas figurinhas
   * que ainda estão faltando.
   */
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

  /*
   * Aplica busca e filtro por seleção.
   */
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
          item.tipo,
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

  /*
   * Agrupa as figurinhas por seleção.
   */
  const grupos = useMemo(() => {
    const mapa = new Map<
      string,
      {
        codigo: string;
        nome: string;
        itens: FaltanteItem[];
      }
    >();

    itensFiltrados.forEach((item) => {
      const grupoExistente = mapa.get(
        item.selecaoCodigo,
      );

      if (grupoExistente) {
        grupoExistente.itens.push(item);
        return;
      }

      mapa.set(item.selecaoCodigo, {
        codigo: item.selecaoCodigo,
        nome: item.selecaoNome,
        itens: [item],
      });
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [itensFiltrados]);

  const totalFaltantes = itensFiltrados.length;

  const totalSelecoes = grupos.length;

  /*
   * Gera a mensagem considerando somente
   * os itens atualmente exibidos.
   */
  const textoCompartilhamento = useMemo(() => {
    const linhas: string[] = [
      `⚽ *Figurinhas que estou procurando — ${albumNome}*`,
      "",
    ];

    grupos.forEach((grupo) => {
      linhas.push(`*${grupo.nome}*`);

      const codigos = grupo.itens
        .map((item) => item.codigo)
        .join(", ");

      linhas.push(codigos);
      linhas.push("");
    });

    linhas.push(
      `Total: ${totalFaltantes} figurinhas faltantes.`,
    );

    linhas.push("");
    linhas.push(
      "Quem tiver alguma disponível para troca, pode me chamar!",
    );

    return linhas.join("\n");
  }, [
    albumNome,
    grupos,
    totalFaltantes,
  ]);

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(
      textoCompartilhamento,
    )}`;

  const possuiFiltro =
    busca.trim() !== "" ||
    selecaoSelecionada !== "todas";

  function limparFiltros() {
    setBusca("");
    setSelecaoSelecionada("todas");
    setMensagemCopia("");
  }

  /*
   * Possui uma alternativa para navegadores
   * que não liberam navigator.clipboard.
   */
  async function copiarLista() {
    setMensagemCopia("");

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
          document.createElement("textarea");

        textarea.value = textoCompartilhamento;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        const copiado =
          document.execCommand("copy");

        document.body.removeChild(textarea);

        if (!copiado) {
          throw new Error(
            "O navegador não permitiu copiar.",
          );
        }
      }

      setMensagemCopia(
        "Lista copiada com sucesso.",
      );
    } catch {
      setMensagemCopia(
        "Não foi possível copiar a lista.",
      );
    }
  }

  return (
    <div>
      {/* RESUMO */}
      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
            Figurinhas faltantes
          </p>

          <p className="mt-2 text-3xl font-bold text-red-900">
            {totalFaltantes}
          </p>

          <p className="mt-1 text-xs text-red-700">
            Códigos que você procura
          </p>
        </article>

        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Seleções
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-900">
            {totalSelecoes}
          </p>

          <p className="mt-1 text-xs text-blue-700">
            Com figurinhas faltando
          </p>
        </article>
      </section>

      {/* BUSCA E FILTRO */}
      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div>
            <label
              htmlFor="busca-faltante"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Buscar figurinha
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                🔍
              </span>

              <input
                id="busca-faltante"
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
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="selecao-faltante"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Seleção
            </label>

            <select
              id="selecao-faltante"
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
              {totalFaltantes}
            </strong>{" "}
            de{" "}
            <strong className="text-slate-800">
              {initialItems.length}
            </strong>{" "}
            figurinhas faltantes
          </p>

          {possuiFiltro && (
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

      {/* COMPARTILHAMENTO */}
      {itensFiltrados.length > 0 && (
        <section className="mt-5 rounded-3xl bg-green-700 p-5 text-white shadow-sm">
          <h2 className="text-lg font-bold">
            Compartilhar lista
          </h2>

          <p className="mt-1 text-sm text-green-100">
            Envie a lista exibida para amigos e
            grupos de troca.
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
      <div className="mt-6 space-y-7">
        {grupos.map((grupo) => (
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

              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                {grupo.itens.length} faltantes
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {item.codigo}
                        </span>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                          Faltando
                        </span>
                      </div>

                      <h3 className="mt-3 font-bold text-slate-900">
                        {item.nome}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.selecaoNome}
                      </p>
                    </div>

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                      {item.tipo === "escudo"
                        ? "🛡️"
                        : "⚽"}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* SEM RESULTADOS */}
      {itensFiltrados.length === 0 && (
        <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-5xl">
            {possuiFiltro ? "🔍" : "🏆"}
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {possuiFiltro
              ? "Nenhuma figurinha encontrada"
              : "Você já possui todas as figurinhas"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {possuiFiltro
              ? "Altere a busca ou limpe os filtros."
              : "Não existem códigos faltando na sua coleção."}
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