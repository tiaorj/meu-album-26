"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { traduzirErroAuth } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/server";

export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !email.includes("@")) {
    redirect(
      `/login?erro=${encodeURIComponent(
        "Informe um e-mail válido.",
      )}`,
    );
  }

  if (!senha) {
    redirect(
      `/login?erro=${encodeURIComponent(
        "Informe sua senha.",
      )}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    redirect(
      `/login?erro=${encodeURIComponent(
        traduzirErroAuth(error.message),
      )}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/painel");
}