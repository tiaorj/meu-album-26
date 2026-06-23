"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { traduzirErroAuth } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/server";

export async function cadastrar(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const senha = String(formData.get("senha") ?? "");

  const confirmarSenha = String(
    formData.get("confirmarSenha") ?? "",
  );

  if (nome.length < 2) {
    redirect(
      `/cadastro?erro=${encodeURIComponent(
        "Informe um nome válido.",
      )}`,
    );
  }

  if (!email || !email.includes("@")) {
    redirect(
      `/cadastro?erro=${encodeURIComponent(
        "Informe um e-mail válido.",
      )}`,
    );
  }

  if (senha.length < 6) {
    redirect(
      `/cadastro?erro=${encodeURIComponent(
        "A senha deve possuir pelo menos 6 caracteres.",
      )}`,
    );
  }

  if (senha !== confirmarSenha) {
    redirect(
      `/cadastro?erro=${encodeURIComponent(
        "A confirmação da senha está diferente.",
      )}`,
    );
  }

  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
      },

      /*
       * Depois da confirmação, o Supabase enviará
       * o usuário para esta rota com um código.
       */
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect(
      `/cadastro?erro=${encodeURIComponent(
        traduzirErroAuth(error.message),
      )}`,
    );
  }

  /*
   * Caso a confirmação de e-mail esteja desativada,
   * o usuário já recebe uma sessão.
   */
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/painel");
  }

  redirect(
    `/login?sucesso=${encodeURIComponent(
      "Cadastro realizado. Abra seu e-mail e confirme a conta.",
    )}`,
  );
}