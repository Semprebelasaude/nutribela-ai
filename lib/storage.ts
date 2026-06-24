"use client";

import { ItemCardapio, ItemLista, PerfilUsuaria, ReceitaEnriquecida } from "./types";

// Chaves do localStorage
const KEYS = {
  FAVORITOS: "nb_favoritos",
  CARDAPIO: "nb_cardapio",
  LISTA: "nb_lista",
  PERFIL: "nb_perfil",
} as const;

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// FAVORITOS
export function getFavoritos(): ReceitaEnriquecida[] {
  return get<ReceitaEnriquecida[]>(KEYS.FAVORITOS, []);
}

export function addFavorito(receita: ReceitaEnriquecida): void {
  const favs = getFavoritos();
  if (!favs.find((f) => f.id === receita.id)) {
    set(KEYS.FAVORITOS, [...favs, receita]);
  }
}

export function removeFavorito(id: string): void {
  set(KEYS.FAVORITOS, getFavoritos().filter((f) => f.id !== id));
}

export function isFavorito(id: string): boolean {
  return getFavoritos().some((f) => f.id === id);
}

// CARDÁPIO SEMANAL
export function getCardapio(): ItemCardapio[] {
  return get<ItemCardapio[]>(KEYS.CARDAPIO, []);
}

export function addCardapio(item: ItemCardapio): void {
  const cardapio = getCardapio();
  const existe = cardapio.findIndex(
    (c) => c.receitaId === item.receitaId && c.dia === item.dia && c.refeicao === item.refeicao
  );
  if (existe >= 0) {
    const novo = [...cardapio];
    novo[existe] = item;
    set(KEYS.CARDAPIO, novo);
  } else {
    set(KEYS.CARDAPIO, [...cardapio, item]);
  }
}

export function removeCardapio(receitaId: string, dia: number, refeicao: string): void {
  set(
    KEYS.CARDAPIO,
    getCardapio().filter(
      (c) => !(c.receitaId === receitaId && c.dia === dia && c.refeicao === refeicao)
    )
  );
}

// LISTA DE COMPRAS
export function getLista(): ItemLista[] {
  return get<ItemLista[]>(KEYS.LISTA, []);
}

export function setLista(itens: ItemLista[]): void {
  set(KEYS.LISTA, itens);
}

export function toggleItem(id: string): void {
  const lista = getLista();
  set(
    KEYS.LISTA,
    lista.map((i) => (i.id === id ? { ...i, marcado: !i.marcado } : i))
  );
}

export function removeItemLista(id: string): void {
  set(KEYS.LISTA, getLista().filter((i) => i.id !== id));
}

// PERFIL
export function getPerfil(): PerfilUsuaria {
  return get<PerfilUsuaria>(KEYS.PERFIL, {
    objetivo: "geral",
    restricoes: [],
  });
}

export function setPerfil(perfil: PerfilUsuaria): void {
  set(KEYS.PERFIL, perfil);
}
