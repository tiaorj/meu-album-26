"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function BrowserTest() {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function testarConexao() {
    setCarregando(true);
    setMensagem("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("albuns")
      .select("nome")
      .limit(1);

    if (error) {
      setMensagem(`Erro: ${error.message}`);
      setCarregando(false);
      return;
    }

    const nomeAlbum = data?.[0]?.nome ?? "nenhum álbum encontrado";

    setMensagem(`Conexão funcionando: ${nomeAlbum}`);
    setCarregando(false);
  }

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold text-slate-900">
        Teste pelo navegador
      </h2>

      <button
        type="button"
        onClick={testarConexao}
        disabled={carregando}
        className="mt-4 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {carregando ? "Testando..." : "Testar cliente do navegador"}
      </button>

      {mensagem && (
        <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
          {mensagem}
        </p>
      )}
    </div>
  );
}