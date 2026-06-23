"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { atualizarFigurinha } from "@/app/colecao/actions";

export type ItemColecaoRapida = {
  id: string;
  quantidade: number;
  colada: boolean;
  repetidas: number;
};

type EstadoConfirmado = {
  quantidade: number;
  colada: boolean;
  repetidas: number;
};

/**
 * Atualiza a coleção imediatamente na tela e
 * salva no Supabase em segundo plano.
 *
 * Cada figurinha possui seu próprio temporizador,
 * portanto uma alteração não bloqueia as demais.
 */
export function useColecaoRapida<
  T extends ItemColecaoRapida,
>(
  initialItems: T[],
  atrasoSalvamento = 350,
) {
  /**
   * Estado exibido na tela.
   */
  const [itens, setItens] =
    useState<T[]>(() => initialItems);

  /**
   * IDs que estão aguardando ou realizando
   * uma gravação.
   */
  const [
    salvandoIds,
    setSalvandoIds,
  ] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const [erro, setErro] =
    useState("");

  /**
   * Referência com o estado mais atual.
   *
   * Ela evita que as funções assíncronas usem
   * valores antigos do React.
   */
  const itensRef =
    useRef<T[]>(initialItems);

  /**
   * Último estado confirmado pelo banco.
   *
   * Em caso de erro, somente a figurinha
   * afetada volta para esse estado.
   */
  const confirmadosRef = useRef<
    Map<string, EstadoConfirmado>
  >(
    new Map(
      initialItems.map((item) => [
        item.id,
        {
          quantidade:
            item.quantidade,

          colada:
            item.colada,

          repetidas:
            item.repetidas,
        },
      ]),
    ),
  );

  /**
   * Um timer separado para cada figurinha.
   */
  const timersRef = useRef<
    Map<
      string,
      ReturnType<
        typeof setTimeout
      >
    >
  >(new Map());

  /**
   * Figurinhas que estão sendo gravadas
   * neste momento.
   */
  const executandoRef = useRef<
    Set<string>
  >(new Set());

  /**
   * Indica que a figurinha foi alterada
   * novamente durante uma gravação.
   */
  const salvarNovamenteRef =
    useRef<Set<string>>(
      new Set(),
    );

  /**
   * Evita alterações de estado depois
   * que o componente for desmontado.
   */
  const montadoRef =
    useRef(true);

  useEffect(() => {
    montadoRef.current = true;

    const timers =
      timersRef.current;

    return () => {
      montadoRef.current =
        false;

      timers.forEach(
        (timer) => {
          clearTimeout(timer);
        },
      );

      timers.clear();
    };
  }, []);

  function alterarStatusSalvamento(
    figurinhaId: string,
    salvando: boolean,
  ) {
    if (!montadoRef.current) {
      return;
    }

    setSalvandoIds(
      (estadoAtual) => {
        const novoEstado =
          new Set(estadoAtual);

        if (salvando) {
          novoEstado.add(
            figurinhaId,
          );
        } else {
          novoEstado.delete(
            figurinhaId,
          );
        }

        return novoEstado;
      },
    );
  }

  function obterItemAtual(
    figurinhaId: string,
  ): T | undefined {
    return itensRef.current.find(
      (item) =>
        item.id === figurinhaId,
    );
  }

  function atualizarItemLocal(
    figurinhaId: string,
    quantidade: number,
    colada: boolean,
  ) {
    const novaQuantidade =
      Math.max(
        0,
        Math.min(
          999,
          quantidade,
        ),
      );

    const novaColada =
      novaQuantidade > 0
        ? colada
        : false;

    const novasRepetidas =
      Math.max(
        novaQuantidade - 1,
        0,
      );

    setItens((estadoAtual) => {
      const novoEstado =
        estadoAtual.map(
          (item) => {
            if (
              item.id !==
              figurinhaId
            ) {
              return item;
            }

            return {
              ...item,

              quantidade:
                novaQuantidade,

              colada:
                novaColada,

              repetidas:
                novasRepetidas,
            };
          },
        ) as T[];

      itensRef.current =
        novoEstado;

      return novoEstado;
    });
  }

  function restaurarEstadoConfirmado(
    figurinhaId: string,
  ) {
    const confirmado =
      confirmadosRef.current.get(
        figurinhaId,
      );

    if (!confirmado) {
      return;
    }

    setItens((estadoAtual) => {
      const novoEstado =
        estadoAtual.map(
          (item) => {
            if (
              item.id !==
              figurinhaId
            ) {
              return item;
            }

            return {
              ...item,

              quantidade:
                confirmado.quantidade,

              colada:
                confirmado.colada,

              repetidas:
                confirmado.repetidas,
            };
          },
        ) as T[];

      itensRef.current =
        novoEstado;

      return novoEstado;
    });
  }

  function cancelarTimer(
    figurinhaId: string,
  ) {
    const timer =
      timersRef.current.get(
        figurinhaId,
      );

    if (!timer) {
      return;
    }

    clearTimeout(timer);

    timersRef.current.delete(
      figurinhaId,
    );
  }

  function agendarSalvamento(
    figurinhaId: string,
    atraso = atrasoSalvamento,
  ) {
    cancelarTimer(
      figurinhaId,
    );

    alterarStatusSalvamento(
      figurinhaId,
      true,
    );

    const timer =
      setTimeout(() => {
        timersRef.current.delete(
          figurinhaId,
        );

        void persistirFigurinha(
          figurinhaId,
        );
      }, atraso);

    timersRef.current.set(
      figurinhaId,
      timer,
    );
  }

  async function persistirFigurinha(
    figurinhaId: string,
  ) {
    /**
     * Se já existe uma gravação para essa
     * figurinha, sinaliza que será necessário
     * salvar novamente ao final.
     */
    if (
      executandoRef.current.has(
        figurinhaId,
      )
    ) {
      salvarNovamenteRef.current.add(
        figurinhaId,
      );

      return;
    }

    const item =
      obterItemAtual(
        figurinhaId,
      );

    if (!item) {
      alterarStatusSalvamento(
        figurinhaId,
        false,
      );

      return;
    }

    const quantidadeEnviada =
      item.quantidade;

    const coladaEnviada =
      item.colada;

    executandoRef.current.add(
      figurinhaId,
    );

    salvarNovamenteRef.current.delete(
      figurinhaId,
    );

    alterarStatusSalvamento(
      figurinhaId,
      true,
    );

    let resultado:
      | Awaited<
          ReturnType<
            typeof atualizarFigurinha
          >
        >
      | undefined;

    try {
      resultado =
        await atualizarFigurinha(
          figurinhaId,
          quantidadeEnviada,
          coladaEnviada,
        );
    } catch (error) {
      resultado = {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a alteração.",
      };
    } finally {
      executandoRef.current.delete(
        figurinhaId,
      );
    }

    if (!montadoRef.current) {
      return;
    }

    if (!resultado.ok) {
      cancelarTimer(
        figurinhaId,
      );

      salvarNovamenteRef.current.delete(
        figurinhaId,
      );

      alterarStatusSalvamento(
        figurinhaId,
        false,
      );

      restaurarEstadoConfirmado(
        figurinhaId,
      );

      setErro(
        resultado.error,
      );

      return;
    }

    /**
     * Guarda como confirmado exatamente
     * o estado que foi enviado ao banco.
     */
    confirmadosRef.current.set(
      figurinhaId,
      {
        quantidade:
          quantidadeEnviada,

        colada:
          coladaEnviada,

        repetidas: Math.max(
          quantidadeEnviada - 1,
          0,
        ),
      },
    );

    const itemDepoisDoSalvamento =
      obterItemAtual(
        figurinhaId,
      );

    const mudouEnquantoSalvava =
      Boolean(
        itemDepoisDoSalvamento &&
          (
            itemDepoisDoSalvamento.quantidade !==
              quantidadeEnviada ||
            itemDepoisDoSalvamento.colada !==
              coladaEnviada
          ),
      );

    const precisaSalvarNovamente =
      mudouEnquantoSalvava ||
      salvarNovamenteRef.current.has(
        figurinhaId,
      );

    if (
      precisaSalvarNovamente
    ) {
      salvarNovamenteRef.current.delete(
        figurinhaId,
      );

      /**
       * Salva imediatamente o valor mais
       * recente sem esperar novamente.
       */
      agendarSalvamento(
        figurinhaId,
        0,
      );

      return;
    }

    alterarStatusSalvamento(
      figurinhaId,
      false,
    );
  }

  /**
   * Função utilizada pelos componentes.
   *
   * A alteração aparece imediatamente na tela.
   * A gravação ocorre depois de uma pequena pausa.
   */
  function salvarAlteracao(
    figurinhaId: string,
    quantidade: number,
    colada: boolean,
  ) {
    const item =
      obterItemAtual(
        figurinhaId,
      );

    if (!item) {
      setErro(
        "A figurinha não foi encontrada.",
      );

      return;
    }

    const novaQuantidade =
      Math.max(
        0,
        Math.min(
          999,
          Math.trunc(
            quantidade,
          ),
        ),
      );

    const novaColada =
      novaQuantidade > 0
        ? colada
        : false;

    setErro("");

    atualizarItemLocal(
      figurinhaId,
      novaQuantidade,
      novaColada,
    );

    /**
     * Caso já esteja gravando, registra que
     * haverá uma nova gravação em seguida.
     */
    if (
      executandoRef.current.has(
        figurinhaId,
      )
    ) {
      salvarNovamenteRef.current.add(
        figurinhaId,
      );

      alterarStatusSalvamento(
        figurinhaId,
        true,
      );

      return;
    }

    agendarSalvamento(
      figurinhaId,
    );
  }

  function limparErro() {
    setErro("");
  }

  return {
    itens,
    erro,
    salvandoIds,
    salvarAlteracao,
    limparErro,
  };
}