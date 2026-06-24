"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type TipoToast =
  | "salvando"
  | "sucesso"
  | "erro"
  | null;

type SalvamentoToastProps = {
  quantidadeSalvando: number;
  erro?: string;
  onLimparErro?: () => void;
};

export function SalvamentoToast({
  quantidadeSalvando,
  erro = "",
  onLimparErro,
}: SalvamentoToastProps) {
  const [
    tipo,
    setTipo,
  ] = useState<TipoToast>(
    null,
  );

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const quantidadeAnteriorRef =
    useRef(0);

  const timerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      >
      | null
    >(null);

  function cancelarTimer() {
    if (!timerRef.current) {
      return;
    }

    clearTimeout(
      timerRef.current,
    );

    timerRef.current = null;
  }

  function fecharToast() {
    cancelarTimer();

    setTipo(null);
    setMensagem("");

    if (tipo === "erro") {
      onLimparErro?.();
    }
  }

  /*
   * Controla as mensagens de erro.
   */
  useEffect(() => {
    if (!erro) {
      return;
    }

    cancelarTimer();

    setTipo("erro");
    setMensagem(erro);

    timerRef.current =
      setTimeout(() => {
        setTipo(null);
        setMensagem("");

        onLimparErro?.();
      }, 6000);

    return cancelarTimer;
  }, [
    erro,
    onLimparErro,
  ]);

  /*
   * Controla o ciclo:
   *
   * Salvando...
   * Alterações salvas
   */
  useEffect(() => {
    const quantidadeAnterior =
      quantidadeAnteriorRef.current;

    quantidadeAnteriorRef.current =
      quantidadeSalvando;

    /*
     * Um erro tem prioridade sobre
     * a informação de salvamento.
     */
    if (erro) {
      return;
    }

    if (
      quantidadeSalvando > 0
    ) {
      cancelarTimer();

      setTipo("salvando");

      setMensagem(
        quantidadeSalvando === 1
          ? "Salvando alteração..."
          : `Salvando ${quantidadeSalvando} alterações...`,
      );

      return;
    }

    /*
     * Somente mostra sucesso quando ocorreu
     * uma transição de salvando para concluído.
     */
    if (
      quantidadeAnterior > 0 &&
      quantidadeSalvando === 0
    ) {
      cancelarTimer();

      setTipo("sucesso");

      setMensagem(
        "Alterações salvas.",
      );

      timerRef.current =
        setTimeout(() => {
          setTipo(null);
          setMensagem("");
        }, 1800);
    }
  }, [
    erro,
    quantidadeSalvando,
  ]);

  useEffect(() => {
    return cancelarTimer;
  }, []);

  if (!tipo) {
    return null;
  }

  const classesPorTipo = {
    salvando:
      "border-blue-200 bg-blue-600 text-white",

    sucesso:
      "border-emerald-200 bg-emerald-600 text-white",

    erro:
      "border-red-200 bg-red-600 text-white",
  };

  const iconePorTipo = {
    salvando: null,
    sucesso: "✓",
    erro: "!",
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-24 z-[80] mx-auto flex max-w-sm justify-center md:bottom-6"
    >
      <div
        role={
          tipo === "erro"
            ? "alert"
            : "status"
        }
        aria-live={
          tipo === "erro"
            ? "assertive"
            : "polite"
        }
        className={`pointer-events-auto flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur transition ${classesPorTipo[tipo]}`}
      >
        {tipo ===
        "salvando" ? (
          <span
            aria-hidden="true"
            className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-black"
          >
            {iconePorTipo[tipo]}
          </span>
        )}

        <p className="min-w-0 flex-1 text-sm font-semibold leading-5">
          {mensagem}
        </p>

        {tipo !==
          "salvando" && (
          <button
            type="button"
            onClick={fecharToast}
            aria-label="Fechar notificação"
            className="touch-manipulation flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-white/80 active:bg-white/20"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}