"use client";

import {
  useMemo,
  useState,
} from "react";

import { useColecaoRapida } from "@/hooks/use-colecao-rapida";
import { SalvamentoToast } from "@/components/salvamento-toast";

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

type UltimaAcao = {
  figurinhaId: string;
  quantidadeAnterior: number;
  coladaAnterior: boolean;
  mensagem: string;
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

  const [
    ultimaAcao,
    setUltimaAcao,
  ] = useState<UltimaAcao | null>(
    null,
  );

  /*
   * Mantém a coleção localmente e salva
   * as alterações no Supabase em segundo plano.
   */
  const {
    itens,
    erro,
    salvandoIds,
    salvarAlteracao,
    limparErro,
  } = useColecaoRapida<TrocaItem>(
    initialItems,
  );

  /*
   * Total de códigos que o usuário
   * ainda não possui.
   */
  const totalFaltantes = useMemo(
    () =>
      itens.filter(
        (item) =>
          item.quantidade === 0,
      ).length,
    [itens],
  );

  /*
   * Quantidade de códigos diferentes
   * que possuem pelo menos uma repetida.
   */
  const codigosRepetidos = useMemo(
    () =>
      itens.filter(
        (item) =>
          item.repetidas > 0,
      ).length,
    [itens],
  );

  /*
   * Soma de todas as unidades repetidas.
   */
  const unidadesRepetidas = useMemo(
    () =>
      itens.reduce(
        (total, item) =>
          total + item.repetidas,
        0,
      ),
    [itens],
  );

  /*
   * Define quais itens pertencem
   * ao modo atualmente selecionado.
   */
  const itensDoModo = useMemo(() => {
    if (modo === "repetidas") {
      return itens.filter(
        (item) =>
          item.repetidas > 0,
      );
    }

    return itens.filter(
      (item) =>
        item.quantidade === 0,
    );
  }, [
    itens,
    modo,
  ]);

  /*
   * Seleções que possuem itens
   * dentro do modo atual.
   */
  const selecoes = useMemo(() => {
    const mapa = new Map<
      string,
      {
        codigo: string;
        nome: string;
      }
    >();

    itensDoModo.forEach((item) => {
      if (
        !mapa.has(
          item.selecaoCodigo,
        )
      ) {
        mapa.set(
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
      mapa.values(),
    ).sort((a, b) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR",
      ),
    );
  }, [itensDoModo]);

  /*
   * Aplica a busca e o filtro
   * por seleção.
   */
  const itensFiltrados = useMemo(() => {
    const termo =
      normalizarTexto(busca);

    return itensDoModo.filter(
      (item) => {
        const selecaoCorreta =
          selecaoSelecionada ===
            "todas" ||
          item.selecaoCodigo ===
            selecaoSelecionada;

        if (!selecaoCorreta) {
          return false;
        }

        if (!termo) {
          return true;
        }

        const textoPesquisavel =
          normalizarTexto(
            [
              item.codigo,
              item.nome,
              item.selecaoCodigo,
              item.selecaoNome,
            ].join(" "),
          );

        return textoPesquisavel.includes(
          termo,
        );
      },
    );
  }, [
    busca,
    itensDoModo,
    selecaoSelecionada,
  ]);

  /*
   * Agrupa os códigos por seleção.
   */
  const grupos = useMemo<
    GrupoTroca[]
  >(() => {
    const mapa = new Map<
      string,
      GrupoTroca
    >();

    itensFiltrados.forEach(
      (item) => {
        const grupoExistente =
          mapa.get(
            item.selecaoCodigo,
          );

        if (grupoExistente) {
          grupoExistente.itens.push(
            item,
          );

          return;
        }

        mapa.set(
          item.selecaoCodigo,
          {
            codigo:
              item.selecaoCodigo,

            nome:
              item.selecaoNome,

            itens: [item],
          },
        );
      },
    );

    return Array.from(
      mapa.values(),
    ).sort((a, b) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR",
      ),
    );
  }, [itensFiltrados]);

  /*
   * Na aba Procuro, o total é a
   * quantidade de códigos.
   *
   * Na aba Repetidas, é a soma
   * das unidades disponíveis.
   */
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

  /*
   * Texto utilizado para copiar
   * ou compartilhar no WhatsApp.
   */
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
        linhas.push(
          `*${grupo.nome}*`,
        );

        const codigos =
          grupo.itens
            .map((item) => {
              if (
                modo ===
                "repetidas"
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
    selecaoSelecionada !==
      "todas";

  function alterarModo(
    novoModo: ModoTroca,
  ) {
    setModo(novoModo);
    setSelecaoSelecionada(
      "todas",
    );
    setBusca("");
    setMensagem("");
    setUltimaAcao(null);
  }

  function limparFiltros() {
    setBusca("");

    setSelecaoSelecionada(
      "todas",
    );

    setMensagem("");
  }

  /*
   * Na aba Procuro, tocar em uma
   * figurinha significa que ela foi
   * recebida durante a troca.
   */
  function marcarComoTenho(
    item: TrocaItem,
  ) {
    setMensagem("");

    setUltimaAcao({
      figurinhaId: item.id,

      quantidadeAnterior:
        item.quantidade,

      coladaAnterior:
        item.colada,

      mensagem:
        `${item.codigo} marcada como recebida.`,
    });

    /*
     * Registra uma unidade, mas não
     * marca automaticamente como colada.
     */
    salvarAlteracao(
      item.id,
      Math.max(
        item.quantidade,
        1,
      ),
      item.colada,
    );
  }

  /*
   * Utilizado quando o usuário entrega
   * uma figurinha repetida.
   */
  function diminuirRepetida(
    item: TrocaItem,
  ) {
    if (item.quantidade <= 1) {
      return;
    }

    setMensagem("");

    setUltimaAcao({
      figurinhaId: item.id,

      quantidadeAnterior:
        item.quantidade,

      coladaAnterior:
        item.colada,

      mensagem:
        `Uma ${item.codigo} foi entregue.`,
    });

    salvarAlteracao(
      item.id,
      item.quantidade - 1,
      item.colada,
    );
  }

  /*
   * Utilizado quando o usuário recebe
   * mais uma unidade da figurinha.
   */
  function aumentarRepetida(
    item: TrocaItem,
  ) {
    setMensagem("");

    setUltimaAcao({
      figurinhaId: item.id,

      quantidadeAnterior:
        item.quantidade,

      coladaAnterior:
        item.colada,

      mensagem:
        `Uma ${item.codigo} foi adicionada.`,
    });

    salvarAlteracao(
      item.id,
      item.quantidade + 1,
      item.colada,
    );
  }

  function desfazerUltimaAcao() {
    if (!ultimaAcao) {
      return;
    }

    salvarAlteracao(
      ultimaAcao.figurinhaId,
      ultimaAcao.quantidadeAnterior,
      ultimaAcao.coladaAnterior,
    );

    setUltimaAcao(null);
  }

  function compartilharWhatsApp() {
    setMensagem("");

    /*
     * Uma lista muito grande pode
     * ultrapassar o tamanho suportado
     * pelo endereço do WhatsApp.
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

        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea,
        );

        textarea.focus();
        textarea.select();

        const resultado =
          document.execCommand(
            "copy",
          );

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
        {/* ABAS */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200 p-1">
          <button
            type="button"
            onClick={() =>
              alterarModo(
                "faltantes",
              )
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
              alterarModo(
                "repetidas",
              )
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

        {/* FILTRO POR SELEÇÃO */}
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

          {selecoes.map(
            (selecao) => (
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
            ),
          )}
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
                {itensFiltrados.length}{" "}
                códigos diferentes
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={copiarLista}
              disabled={
                itensFiltrados.length ===
                0
              }
              className="touch-manipulation rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              📋 Copiar
            </button>

            <button
              type="button"
              onClick={
                compartilharWhatsApp
              }
              disabled={
                itensFiltrados.length ===
                0
              }
              className="touch-manipulation rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              📱 WhatsApp
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          {modo === "faltantes"
            ? "Toque em um código quando receber a figurinha."
            : "Use − quando entregar uma repetida e + quando receber outra unidade."}
        </p>

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
                  (item) => {
                    const estaSalvando =
                      salvandoIds.has(
                        item.id,
                      );

                    /*
                     * Na aba Procuro, todo o
                     * cartão é clicável.
                     */
                    if (
                      modo ===
                      "faltantes"
                    ) {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          title={`Marcar ${item.codigo} como recebida`}
                          onClick={() =>
                            marcarComoTenho(
                              item,
                            )
                          }
                          className="touch-manipulation relative min-h-16 rounded-xl border border-red-200 bg-red-50 px-1.5 py-2 text-center text-red-900 shadow-sm transition active:scale-95 active:bg-red-100"
                        >
                          <span className="block break-all text-base font-black leading-tight tracking-tight">
                            {item.codigo}
                          </span>

                          {mostrarNomes && (
                            <span className="mt-1 block line-clamp-2 text-[10px] font-medium leading-tight opacity-75">
                              {item.nome}
                            </span>
                          )}

                          <span className="mt-1 block text-[9px] font-bold uppercase text-red-500">
                            Toque ao receber
                          </span>

                          {estaSalvando && (
                            <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                          )}
                        </button>
                      );
                    }

                    /*
                     * Na aba Repetidas, os botões
                     * diminuem ou aumentam a quantidade.
                     */
                    return (
                      <article
                        key={item.id}
                        className="relative min-h-16 rounded-xl border border-amber-300 bg-amber-50 p-1.5 text-center text-amber-950 shadow-sm"
                      >
                        {estaSalvando && (
                          <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                        )}

                        <span className="block break-all text-sm font-black leading-tight tracking-tight">
                          {item.codigo}
                        </span>

                        {mostrarNomes && (
                          <span className="mt-1 block line-clamp-1 text-[9px] font-medium leading-tight opacity-75">
                            {item.nome}
                          </span>
                        )}

                        <div className="mt-2 grid grid-cols-[26px_1fr_26px] items-center justify-center gap-1">
                          <button
                            type="button"
                            aria-label={`Entregar uma ${item.codigo}`}
                            onClick={() =>
                              diminuirRepetida(
                                item,
                              )
                            }
                            className="touch-manipulation flex h-7 w-7 items-center justify-center rounded-lg bg-white text-base font-black text-red-700 shadow-sm active:scale-90"
                          >
                            −
                          </button>

                          <span className="text-xs font-black text-amber-900">
                            ×{item.repetidas}
                          </span>

                          <button
                            type="button"
                            aria-label={`Adicionar uma ${item.codigo}`}
                            onClick={() =>
                              aumentarRepetida(
                                item,
                              )
                            }
                            className="touch-manipulation flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-base font-black text-amber-950 shadow-sm active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* NENHUM RESULTADO */}
      {itensFiltrados.length === 0 && (
        <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-5xl">
            {possuiFiltro
              ? "🔍"
              : "🎉"}
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
              className="touch-manipulation mt-5 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white active:scale-95"
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

      {/* DESFAZER ÚLTIMA MARCAÇÃO */}
      {ultimaAcao && (
        <div className="fixed inset-x-3 bottom-40 z-[60] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
          <p className="text-sm">
            {ultimaAcao.mensagem}
          </p>

          <button
            type="button"
            onClick={
              desfazerUltimaAcao
            }
            className="touch-manipulation shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-900 active:scale-95"
          >
            Desfazer
          </button>
        </div>
      )}
      <SalvamentoToast
        quantidadeSalvando={
          salvandoIds.size
        }
        erro={erro}
        onLimparErro={limparErro}
      />      
    </div>
  );
}