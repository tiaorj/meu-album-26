import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { cadastrar } from "./actions";

type CadastroPageProps = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

export default async function CadastroPage({
  searchParams,
}: CadastroPageProps) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/painel");
  }

  const parametros = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-green-700 text-3xl shadow-lg"
          >
            ⚽
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Criar conta
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organize suas figurinhas da Copa de 2026.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {parametros.erro && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {parametros.erro}
            </div>
          )}

          <form action={cadastrar} className="space-y-5">
            <div>
              <label
                htmlFor="nome"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nome
              </label>

              <input
                id="nome"
                name="nome"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                placeholder="Seu nome"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                E-mail
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@email.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Senha
              </label>

              <input
                id="senha"
                name="senha"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="No mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label
                htmlFor="confirmarSenha"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirmar senha
              </label>

              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Digite novamente"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Criar minha conta
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-green-700 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}