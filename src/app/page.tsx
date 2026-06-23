import Link from "next/link";

const resumo = [
  {
    titulo: "Já coladas",
    valor: 0,
    descricao: "No álbum",
    icone: "✅",
    estilo: "bg-emerald-50 text-emerald-700",
  },
  {
    titulo: "Tenho",
    valor: 0,
    descricao: "Ainda não coladas",
    icone: "🖼️",
    estilo: "bg-blue-50 text-blue-700",
  },
  {
    titulo: "Repetidas",
    valor: 0,
    descricao: "Disponíveis para troca",
    icone: "🔄",
    estilo: "bg-amber-50 text-amber-700",
  },
  {
    titulo: "Faltantes",
    valor: 0,
    descricao: "Para completar",
    icone: "🔍",
    estilo: "bg-red-50 text-red-700",
  },
];

const atalhos = [
  {
    titulo: "Minha coleção",
    descricao: "Visualize todas as figurinhas",
    icone: "📚",
    href: "/colecao",
  },
  {
    titulo: "Figurinhas faltantes",
    descricao: "Veja o que ainda falta",
    icone: "🔍",
    href: "/faltantes",
  },
  {
    titulo: "Figurinhas repetidas",
    descricao: "Organize suas trocas",
    icone: "🔄",
    href: "/repetidas",
  },
  {
    titulo: "Modo troca",
    descricao: "Consulta rápida durante as trocas",
    icone: "🤝",
    href: "/troca",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen pb-24">
      <header className="bg-green-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              ⚽
            </div>

            <div>
              <p className="text-xs font-medium text-green-100">
                Copa do Mundo 2026
              </p>

              <h1 className="text-lg font-bold">Meu Álbum 26</h1>
            </div>
          </div>

          <Link
            href="/login"
            className="touch-manipulation rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25 active:scale-95"
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 to-green-900 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-green-100">
                Progresso do álbum
              </p>

              <h2 className="mt-1 text-3xl font-bold">0% completo</h2>

              <p className="mt-2 text-sm text-green-100">
                Comece marcando as figurinhas que você já possui.
              </p>
            </div>

            <div className="text-5xl">🏆</div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-medium text-green-100">
              <span>0 coladas</span>
              <span>0 figurinhas</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-yellow-400"
                style={{ width: "0%" }}
              />
            </div>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            Resumo da coleção
          </h2>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {resumo.map((item) => (
              <article
                key={item.titulo}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${item.estilo}`}
                >
                  {item.icone}
                </div>

                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {item.valor}
                </p>

                <h3 className="text-sm font-semibold text-slate-800">
                  {item.titulo}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {item.descricao}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Acesso rápido</h2>

            <Link
              href="/colecao"
              className="touch-manipulation text-sm font-semibold text-green-700"
            >
              Ver todas
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {atalhos.map((atalho) => (
              <Link
                key={atalho.titulo}
                href={atalho.href}
                className="touch-manipulation flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-green-300 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                  {atalho.icone}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{atalho.titulo}</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {atalho.descricao}
                  </p>
                </div>

                <span className="text-xl text-slate-400">›</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-dashed border-green-300 bg-green-50 p-5">
          <div className="flex gap-4">
            <div className="text-3xl">💡</div>

            <div>
              <h2 className="font-bold text-green-900">
                Sua coleção ainda está vazia
              </h2>

              <p className="mt-1 text-sm leading-6 text-green-800">
                Quando cadastrarmos as figurinhas oficiais, você poderá marcar
                rapidamente quais já colou, quais possui e quantas estão
                repetidas.
              </p>
            </div>
          </div>
        </section>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          <Link
            href="/"
            className="touch-manipulation flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-green-700 active:bg-green-50"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs font-semibold">
              Início
            </span>
          </Link>

          <Link
            href="/colecao"
            className="touch-manipulation flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500 active:bg-slate-100"
          >
            <span className="text-xl">📚</span>
            <span className="text-xs">
              Coleção
            </span>
          </Link>

          <Link
            href="/troca"
            className="touch-manipulation flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500 active:bg-slate-100"
          >
            <span className="text-xl">🤝</span>
            <span className="text-xs">
              Troca
            </span>
          </Link>

          <Link
            href="/login"
            className="touch-manipulation flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-slate-500 active:bg-slate-100"
          >
            <span className="text-xl">👤</span>
            <span className="text-xs">
              Entrar
            </span>
          </Link>
        </div>
      </nav>
    </main>
  );
}