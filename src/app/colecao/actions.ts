"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AtualizarFigurinhaResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export async function atualizarFigurinha(
  figurinhaId: string,
  quantidade: number,
  colada: boolean,
): Promise<AtualizarFigurinhaResult> {
  const supabase = await createClient();

  /*
   * A autenticação deve ser validada novamente
   * dentro da Server Action.
   */
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const usuarioId = claimsData?.claims?.sub;

  if (claimsError || !usuarioId) {
    return {
      ok: false,
      error: "Sua sessão expirou. Entre novamente.",
    };
  }

  const uuidValido =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidValido.test(figurinhaId)) {
    return {
      ok: false,
      error: "A figurinha informada é inválida.",
    };
  }

  if (
    !Number.isInteger(quantidade) ||
    quantidade < 0 ||
    quantidade > 999
  ) {
    return {
      ok: false,
      error: "A quantidade informada é inválida.",
    };
  }

  /*
   * Não faz sentido uma figurinha estar colada
   * quando a quantidade é zero.
   */
  const figurinhaColada =
    quantidade > 0 ? colada : false;

  /*
   * Quando a quantidade volta para zero,
   * removemos o registro da coleção.
   */
  if (quantidade === 0) {
    const { error } = await supabase
      .from("colecao_usuario")
      .delete()
      .eq("usuario_id", usuarioId)
      .eq("figurinha_id", figurinhaId);

    if (error) {
      return {
        ok: false,
        error: `Não foi possível atualizar: ${error.message}`,
      };
    }

    revalidatePath("/colecao");
    revalidatePath("/painel");

    return {
      ok: true,
    };
  }

  const { error } = await supabase
    .from("colecao_usuario")
    .upsert(
      {
        usuario_id: usuarioId,
        figurinha_id: figurinhaId,
        quantidade,
        colada: figurinhaColada,
      },
      {
        onConflict: "usuario_id,figurinha_id",
      },
    );

  if (error) {
    return {
      ok: false,
      error: `Não foi possível atualizar: ${error.message}`,
    };
  }

  revalidatePath("/colecao");
  revalidatePath("/painel");

  return {
    ok: true,
  };
}