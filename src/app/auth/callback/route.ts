import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    /*
     * Troca o código recebido por uma sessão
     * e salva os tokens nos cookies.
     */
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost =
        request.headers.get("x-forwarded-host");

      const isLocalEnv =
        process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(
          `${origin}/painel`,
        );
      }

      if (forwardedHost) {
        return NextResponse.redirect(
          `https://${forwardedHost}/painel`,
        );
      }

      return NextResponse.redirect(
        `${origin}/painel`,
      );
    }
  }

  const loginUrl = new URL("/login", request.url);

  loginUrl.searchParams.set(
    "erro",
    "Não foi possível confirmar o e-mail. O link pode ter expirado.",
  );

  return NextResponse.redirect(loginUrl);
}