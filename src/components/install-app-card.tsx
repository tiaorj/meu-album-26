"use client";

import {
  useEffect,
  useState,
} from "react";

type ResultadoInstalacao = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent
  extends Event {
  readonly platforms: string[];

  readonly userChoice:
    Promise<ResultadoInstalacao>;

  prompt(): Promise<void>;
}

type NavigatorComStandalone =
  Navigator & {
    standalone?: boolean;
  };

export function InstallAppCard() {
  const [
    eventoInstalacao,
    setEventoInstalacao,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null,
    );

  const [isIOS, setIsIOS] =
    useState(false);

  const [isStandalone, setIsStandalone] =
    useState(true);

  useEffect(() => {
    const navegador =
      window.navigator as NavigatorComStandalone;

    const instalado =
      window.matchMedia(
        "(display-mode: standalone)",
      ).matches ||
      navegador.standalone === true;

    const dispositivoIOS =
      /iphone|ipad|ipod/i.test(
        window.navigator.userAgent,
      );

    setIsStandalone(instalado);
    setIsIOS(dispositivoIOS);

    function capturarEvento(
      event: Event,
    ) {
      event.preventDefault();

      setEventoInstalacao(
        event as BeforeInstallPromptEvent,
      );
    }

    function aplicativoInstalado() {
      setIsStandalone(true);
      setEventoInstalacao(null);
    }

    window.addEventListener(
      "beforeinstallprompt",
      capturarEvento,
    );

    window.addEventListener(
      "appinstalled",
      aplicativoInstalado,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        capturarEvento,
      );

      window.removeEventListener(
        "appinstalled",
        aplicativoInstalado,
      );
    };
  }, []);

  async function instalarAplicativo() {
    if (!eventoInstalacao) {
      return;
    }

    await eventoInstalacao.prompt();

    const escolha =
      await eventoInstalacao.userChoice;

    if (escolha.outcome === "accepted") {
      setIsStandalone(true);
    }

    setEventoInstalacao(null);
  }

  if (isStandalone) {
    return null;
  }

  if (!eventoInstalacao && !isIOS) {
    return null;
  }

  return (
    <section className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
          📲
        </div>

        <div className="flex-1">
          <h2 className="font-bold text-blue-900">
            Instale o Meu Álbum 26
          </h2>

          <p className="mt-1 text-sm leading-6 text-blue-700">
            Acesse sua coleção diretamente pela
            tela inicial do celular, como um
            aplicativo.
          </p>

          {eventoInstalacao && (
            <button
              type="button"
              onClick={instalarAplicativo}
              className="mt-4 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Instalar aplicativo
            </button>
          )}

          {isIOS && !eventoInstalacao && (
            <div className="mt-4 rounded-xl bg-white/70 p-4 text-sm leading-6 text-blue-800">
              <p className="font-semibold">
                Para instalar no iPhone:
              </p>

              <p className="mt-1">
                Abra pelo Safari, toque em
                Compartilhar e escolha
                <strong>
                  {" "}
                  Adicionar à Tela de Início
                </strong>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}