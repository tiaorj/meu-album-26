"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ItemNavegacao = {
  href: string;
  nome: string;
  icone: string;
  rotasAtivas: string[];
};

const itensNavegacao: ItemNavegacao[] = [
  {
    href: "/painel",
    nome: "Início",
    icone: "🏠",
    rotasAtivas: [
      "/painel",
    ],
  },
  {
    href: "/colecao",
    nome: "Coleção",
    icone: "📚",
    rotasAtivas: [
      "/colecao",
    ],
  },
  {
    href: "/selecoes",
    nome: "Seleções",
    icone: "🌎",
    rotasAtivas: [
      "/selecoes",
    ],
  },
  {
    href: "/troca",
    nome: "Troca",
    icone: "🤝",
    rotasAtivas: [
      "/troca",
      "/faltantes",
      "/repetidas",
    ],
  },
];

function rotaEstaAtiva(
  pathname: string,
  rotasAtivas: string[],
): boolean {
  return rotasAtivas.some(
    (rota) => {
      if (rota === "/painel") {
        return pathname === rota;
      }

      return (
        pathname === rota ||
        pathname.startsWith(
          `${rota}/`,
        )
      );
    },
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-2">
        {itensNavegacao.map(
          (item) => {
            const ativo =
              rotaEstaAtiva(
                pathname,
                item.rotasAtivas,
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  ativo
                    ? "page"
                    : undefined
                }
                className={`touch-manipulation flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition active:scale-95 ${
                  ativo
                    ? "bg-green-50 text-green-700"
                    : "text-slate-500 active:bg-slate-100"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`text-xl leading-none ${
                    ativo
                      ? "scale-110"
                      : ""
                  }`}
                >
                  {item.icone}
                </span>

                <span
                  className={`text-[11px] leading-none ${
                    ativo
                      ? "font-bold"
                      : "font-medium"
                  }`}
                >
                  {item.nome}
                </span>

                <span
                  aria-hidden="true"
                  className={`h-1 w-5 rounded-full transition ${
                    ativo
                      ? "bg-green-600"
                      : "bg-transparent"
                  }`}
                />
              </Link>
            );
          },
        )}
      </div>
    </nav>
  );
}