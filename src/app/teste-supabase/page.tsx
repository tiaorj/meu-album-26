import { createClient } from "@/lib/supabase/server";
import { BrowserTest } from "./browser-test";

type Album = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ano: number;
  ativo: boolean;
};

export default async function TesteSupabasePage() {
  const supabase = await createClient();

  const { data: albuns, error } = await supabase
    .from("albuns")
    .select("id, nome, slug, descricao, ano, ativo")
    .order("ano", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-800">
            Erro ao consultar o Supabase
          </h1>

          <p className="mt-3 text-sm text-red-700">
            {error.message}
          </p>

          <pre className="mt-4 overflow-x-auto rounded-xl bg-white p-4 text-xs text-red-700">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-xl font-bold text-emerald-800">
            Supabase conectado com sucesso
          </h1>

          <p className="mt-2 text-sm text-emerald-700">
            Foram encontrados {albuns?.length ?? 0} álbuns.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {albuns?.map((album: Album) => (
            <article
              key={album.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {album.nome}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {album.descricao ?? "Sem descrição"}
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {album.ano}
                </span>
              </div>

              <div className="mt-4 text-xs text-slate-500">
                Slug: {album.slug}
              </div>
            </article>
          ))}

          {albuns?.length === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
              A conexão funcionou, mas nenhum álbum foi encontrado.
            </div>
          )}
        </div>

        <BrowserTest />
      </section>
    </main>
  );
}