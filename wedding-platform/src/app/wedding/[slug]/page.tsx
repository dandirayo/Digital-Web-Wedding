import { Suspense } from "react";
import { WeddingView } from "./wedding-view";

type WeddingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function WeddingPage({ params }: WeddingPageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ed]">
        <div className="text-xl font-semibold text-[#9a6a3a]">Loading...</div>
      </div>
    }>
      <WeddingView slug={slug} />
    </Suspense>
  );
}
