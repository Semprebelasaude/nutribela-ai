import ReceitaDetalhe from "./ReceitaDetalhe";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceitaPage({ params }: PageProps) {
  const { id } = await params;
  return <ReceitaDetalhe id={id} />;
}
