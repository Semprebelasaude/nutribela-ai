export interface Receita {
  id: string;
  modulo: string;
  nome: string;
  ingredientes: string[];
  modo_preparo: string;
  rende?: string;
  tags?: string[];
}

export interface ReceitaEnriquecida extends Receita {
  calorias?: number;
  proteina?: number;
  carboidrato?: number;
  gordura?: number;
  indice_glicemico?: string;
  ingredientes_ajustados?: string[];
  porcoes?: number;
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
