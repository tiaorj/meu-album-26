import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({
  path: ".env.local",
});

type FigurinhaOrigem = {
  code: string;
  name: string;
  team: string;
};

type CatalogoOrigem = {
  edition: string;
  stickers: FigurinhaOrigem[];
};

const CATALOGO_URL =
  "https://raw.githubusercontent.com/danieltartaro/sticker-swap/main/data/raw/panini-wc-2026-catalog.json";

const NOMES_PT_BR: Record<string, string> = {
  Algeria: "Argélia",
  Argentina: "Argentina",
  Australia: "Austrália",
  Austria: "Áustria",
  Belgium: "Bélgica",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  Brazil: "Brasil",
  Canada: "Canadá",
  "Cape Verde": "Cabo Verde",
  Colombia: "Colômbia",
  "Congo DR": "República Democrática do Congo",
  Croatia: "Croácia",
  Curaçao: "Curaçao",
  Czechia: "Tchéquia",
  Ecuador: "Equador",
  Egypt: "Egito",
  England: "Inglaterra",
  France: "França",
  Germany: "Alemanha",
  Ghana: "Gana",
  Haiti: "Haiti",
  Iran: "Irã",
  Iraq: "Iraque",
  "Ivory Coast": "Costa do Marfim",
  Japan: "Japão",
  Jordan: "Jordânia",
  Mexico: "México",
  Morocco: "Marrocos",
  Netherlands: "Países Baixos",
  "New Zealand": "Nova Zelândia",
  Norway: "Noruega",
  Panama: "Panamá",
  Paraguay: "Paraguai",
  Portugal: "Portugal",
  Qatar: "Catar",
  "Saudi Arabia": "Arábia Saudita",
  Scotland: "Escócia",
  Senegal: "Senegal",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  Spain: "Espanha",
  Sweden: "Suécia",
  Switzerland: "Suíça",
  Tunisia: "Tunísia",
  Türkiye: "Turquia",
  Uruguay: "Uruguai",
  USA: "Estados Unidos",
  Uzbekistan: "Uzbequistão",
};

function obterCodigoSelecao(
  figurinha: FigurinhaOrigem,
): string | null {
  if (
    figurinha.code === "00" ||
    figurinha.code.startsWith("FWC")
  ) {
    return null;
  }

  const resultado =
    figurinha.code.match(/^([A-Z]{3})\d+$/);

  return resultado?.[1] ?? null;
}

function obterNumero(codigo: string): number {
  if (codigo === "00") {
    return 0;
  }

  const resultado = codigo.match(/(\d+)$/);

  return resultado
    ? Number(resultado[1])
    : 0;
}

function obterTipo(
  figurinha: FigurinhaOrigem,
): string {
  const codigoSelecao =
    obterCodigoSelecao(figurinha);

  if (!codigoSelecao) {
    return "especial";
  }

  const numero = obterNumero(figurinha.code);

  if (numero === 1) {
    return "escudo";
  }

  if (numero === 13) {
    return "selecao";
  }

  return "jogador";
}

function traduzirNome(
  figurinha: FigurinhaOrigem,
): string {
  const traducoes: Record<string, string> = {
    "Panini Logo": "Logo Panini",
    Emblem: "Escudo",
    "Team Photo": "Foto da seleção",
    "Official Emblem1": "Emblema oficial 1",
    "Official Emblem2": "Emblema oficial 2",
    "Official Mascots": "Mascotes oficiais",
    "Official Slogan": "Slogan oficial",
    "Official Ball": "Bola oficial",
    Canada: "Canadá",
    Mexico: "México",
    USA: "Estados Unidos",
    "Italy 1934": "Itália 1934",
    "Uruguay 1950": "Uruguai 1950",
    "West Germany 1954": "Alemanha Ocidental 1954",
    "Brazil 1962": "Brasil 1962",
    "West Germany 1974": "Alemanha Ocidental 1974",
    "Argentina 1986": "Argentina 1986",
    "Brazil 1994": "Brasil 1994",
    "Brazil 2002": "Brasil 2002",
    "Italy 2006": "Itália 2006",
    "Germany 2014": "Alemanha 2014",
    "Argentina 2022": "Argentina 2022",
  };

  return traducoes[figurinha.name] ??
    figurinha.name;
}

async function executarEmLotes<T>(
  itens: T[],
  tamanho: number,
  executar: (lote: T[]) => Promise<void>,
) {
  for (
    let inicio = 0;
    inicio < itens.length;
    inicio += tamanho
  ) {
    const lote = itens.slice(
      inicio,
      inicio + tamanho,
    );

    await executar(lote);
  }
}

async function main() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const secretKey =
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL não foi encontrada.",
    );
  }

  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY não foi encontrada.",
    );
  }

  const supabase = createClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  console.log("Baixando catálogo...");

  const resposta = await fetch(CATALOGO_URL);

  if (!resposta.ok) {
    throw new Error(
      `Erro ao baixar catálogo: ${resposta.status}`,
    );
  }

  const catalogo =
    (await resposta.json()) as CatalogoOrigem;

  /*
   * O arquivo possui 54 variações brilhantes
   * regionais terminadas em "s".
   *
   * Para o álbum padrão, mantemos somente
   * as 980 figurinhas normais.
   */
  const figurinhasOrigem =
    catalogo.stickers.filter(
      (figurinha) =>
        !figurinha.code.endsWith("s"),
    );

  if (figurinhasOrigem.length !== 980) {
    throw new Error(
      `Quantidade inesperada: ${figurinhasOrigem.length}. Esperado: 980.`,
    );
  }

  const {
    data: album,
    error: albumError,
  } = await supabase
    .from("albuns")
    .select("id, nome")
    .eq("slug", "copa-do-mundo-2026")
    .single();

  if (albumError || !album) {
    throw new Error(
      `Álbum não encontrado: ${
        albumError?.message ?? ""
      }`,
    );
  }

  /*
   * Cria a lista de seleções a partir
   * do catálogo.
   */
  const selecoesMap = new Map<
    string,
    {
      codigo: string;
      nome: string;
      ordem: number;
    }
  >();

  for (const figurinha of figurinhasOrigem) {
    const codigo =
      obterCodigoSelecao(figurinha);

    if (!codigo) {
      continue;
    }

    if (selecoesMap.has(codigo)) {
      continue;
    }

    const nomePt =
      NOMES_PT_BR[figurinha.team];

    if (!nomePt) {
      throw new Error(
        `Seleção sem tradução: ${figurinha.team}`,
      );
    }

    selecoesMap.set(codigo, {
      codigo,
      nome: nomePt,
      ordem: selecoesMap.size + 1,
    });
  }

  const selecoes =
    Array.from(selecoesMap.values());

  if (selecoes.length !== 48) {
    throw new Error(
      `Foram encontradas ${selecoes.length} seleções. Esperado: 48.`,
    );
  }

  console.log(
    "Catálogo validado: 48 seleções e 980 figurinhas.",
  );

  console.log(
    "Apagando catálogo de teste...",
  );

  /*
   * Esta exclusão também remove as marcações
   * de teste da coleção por causa do CASCADE.
   */
  const { error: deleteFigurinhasError } =
    await supabase
      .from("figurinhas")
      .delete()
      .eq("album_id", album.id);

  if (deleteFigurinhasError) {
    throw new Error(
      `Erro ao apagar figurinhas: ${deleteFigurinhasError.message}`,
    );
  }

  const { error: deleteSelecoesError } =
    await supabase
      .from("selecoes")
      .delete()
      .eq("album_id", album.id);

  if (deleteSelecoesError) {
    throw new Error(
      `Erro ao apagar seleções: ${deleteSelecoesError.message}`,
    );
  }

  console.log("Cadastrando seleções...");

  const selecoesParaInserir =
    selecoes.map((selecao) => ({
      album_id: album.id,
      codigo: selecao.codigo,
      nome: selecao.nome,
      grupo: null,
      ordem: selecao.ordem,
    }));

  const { error: selecoesError } =
    await supabase
      .from("selecoes")
      .insert(selecoesParaInserir);

  if (selecoesError) {
    throw new Error(
      `Erro ao cadastrar seleções: ${selecoesError.message}`,
    );
  }

  const {
    data: selecoesBanco,
    error: selecoesBancoError,
  } = await supabase
    .from("selecoes")
    .select("id, codigo")
    .eq("album_id", album.id);

  if (selecoesBancoError) {
    throw new Error(
      `Erro ao consultar seleções: ${selecoesBancoError.message}`,
    );
  }

  const selecaoIdPorCodigo =
    new Map<string, string>();

  for (const selecao of selecoesBanco ?? []) {
    selecaoIdPorCodigo.set(
      selecao.codigo,
      selecao.id,
    );
  }

  const figurinhasParaInserir =
    figurinhasOrigem.map(
      (figurinha, indice) => {
        const codigoSelecao =
          obterCodigoSelecao(figurinha);

        const selecaoId = codigoSelecao
          ? selecaoIdPorCodigo.get(
              codigoSelecao,
            )
          : null;

        if (codigoSelecao && !selecaoId) {
          throw new Error(
            `Seleção não encontrada para ${figurinha.code}.`,
          );
        }

        return {
          album_id: album.id,
          selecao_id: selecaoId ?? null,
          codigo: figurinha.code,
          numero: obterNumero(
            figurinha.code,
          ),
          nome: traduzirNome(figurinha),
          tipo: obterTipo(figurinha),
          ordem: indice + 1,
          pagina: null,
          imagem_url: null,
        };
      },
    );

  console.log(
    "Cadastrando 980 figurinhas...",
  );

  await executarEmLotes(
    figurinhasParaInserir,
    200,
    async (lote) => {
      const { error } = await supabase
        .from("figurinhas")
        .insert(lote);

      if (error) {
        throw new Error(
          `Erro ao inserir lote: ${error.message}`,
        );
      }

      console.log(
        `Lote de ${lote.length} figurinhas inserido.`,
      );
    },
  );

  await supabase
    .from("albuns")
    .update({
      editora: "Panini",
      descricao:
        "Álbum padrão da Copa do Mundo FIFA 2026 com 980 figurinhas.",
    })
    .eq("id", album.id);

  const { count, error: countError } =
    await supabase
      .from("figurinhas")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("album_id", album.id);

  if (countError) {
    throw new Error(
      `Erro ao conferir catálogo: ${countError.message}`,
    );
  }

  if (count !== 980) {
    throw new Error(
      `Importação incompleta. Encontradas: ${count}.`,
    );
  }

  console.log("");
  console.log("Importação concluída!");
  console.log(`Álbum: ${album.nome}`);
  console.log("Seleções: 48");
  console.log("Figurinhas: 980");
}

main().catch((error: unknown) => {
  console.error("");
  console.error("Falha na importação:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});