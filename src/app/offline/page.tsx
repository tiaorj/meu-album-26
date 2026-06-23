import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-4xl">
          📡
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Você está sem internet
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Não foi possível acessar sua coleção neste momento.
          Verifique sua conexão e tente novamente.
        </p>

        <Link
          href="/painel"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          Tentar novamente
        </Link>

        <p className="mt-5 text-xs leading-5 text-slate-400">
          Os dados da sua coleção permanecem seguros no
          Supabase e não são armazenados offline neste aparelho.
        </p>
      </section>
    </main>
  );
}