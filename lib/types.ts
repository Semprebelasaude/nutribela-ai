export interface Nutricao {
  porcoes_base: number;
  kcal_total: number;
  kcal_porcao: number;
  proteina_g: number;
  carboidrato_g: number;
  gordura_g: number;
  indice_glicemico: "baixo" | "médio" | "alto";
  estimado: boolean;
  ingredientes_nao_calculados: string[];
  disponivel?: boolean; // false quando todos ingredientes não mapeáveis
}

export interface Receita {
  id: string;
  modulo: string;
  nome: string;
  ingredientes: string[];
  modo_preparo: string;
  rende?: string;
  tags?: string[];
  nutricao?: Nutricao;
  tipo_geral?: "doce" | "salgado";
  estilos?: string[];
  tipo_prato?: string;
}

export interface ReceitaClassificacao {
  tipo_geral: string;
  estilos: string[];
  tipo_prato: string;
}

export interface ReceitaEnriquecida extends Receita {
  ingredientes_ajustados?: string[];
  porcoes?: number;
  // campos legados (manter para compatibilidade com NutritionPanel enquanto não migra)
  calorias?: number;
  proteina?: number;
  carboidrato?: number;
  gordura?: number;
  indice_glicemico?: string;
  imagem_url?: string;
}

export interface PerfilUsuaria {
  objetivo: "emagrecer" | "ganho_massa" | "low_carb" | "diabetico" | "desinchar" | "geral";
  restricoes: string[];
  nome?: string;
}

export interface ItemCardapio {
  receitaId: string;
  refeicao: "cafe" | "almoco" | "jantar" | "lanche";
  dia: number; // 0=seg, 1=ter, ... 6=dom
  porcoes: number;
}

export interface ItemLista {
  id: string;
  descricao: string;
  categoria: string;
  quantidade?: string;
  marcado: boolean;
}

export type Objetivo = PerfilUsuaria["objetivo"];
