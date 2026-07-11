import { WeddingView } from "./wedding-view";

type WeddingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function WeddingPage({ params }: WeddingPageProps) {
  const { slug } = await params;

  return <WeddingView slug={slug} />;
}
