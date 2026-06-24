const PEXELS_KEY = process.env.PEXELS_API_KEY;

const FALLBACKS: Record<string, string> = {
  bolo: "https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?w=800",
  carne: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=800",
  salada: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=800",
  frango: "https://images.pexels.com/photos/2673353/pexels-photo-2673353.jpeg?w=800",
  peixe: "https://images.pexels.com/photos/3997609/pexels-photo-3997609.jpeg?w=800",
  sopa: "https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?w=800",
  doce: "https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg?w=800",
  ovo: "https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg?w=800",
  fit: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=800",
  default: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=800",
};

export function imagemFallback(nomeReceita: string, modulo: string): string {
  const texto = (nomeReceita + " " + modulo).toLowerCase();
  for (const [chave, url] of Object.entries(FALLBACKS)) {
    if (texto.includes(chave)) return url;
  }
  return FALLBACKS.default;
}

export async function buscarImagemPexels(query: string): Promise<string> {
  if (!PEXELS_KEY) return imagemFallback(query, "");
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return imagemFallback(query, "");
    const data = await res.json();
    return data.photos?.[0]?.src?.large || imagemFallback(query, "");
  } catch {
    return imagemFallback(query, "");
  }
}
