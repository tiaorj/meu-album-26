import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          /*
           * Atualiza os cookies da requisição.
           * Assim, os Server Components recebem a sessão renovada.
           */
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          /*
           * Atualiza os cookies da resposta.
           * Assim, o navegador recebe os novos tokens.
           */
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          /*
           * Mantém os cabeçalhos enviados pelo Supabase.
           */
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  /*
   * Não coloque outras operações entre a criação do cliente
   * e getClaims().
   *
   * getClaims() valida o token e renova a sessão quando necessário.
   */
  await supabase.auth.getClaims();

  return supabaseResponse;
}