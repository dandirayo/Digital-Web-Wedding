import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { database } from "@/lib/backend/server";
import { rows } from "@/lib/backend/database.mjs";
import { WeddingView } from "./wedding-view";

type WeddingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function findEvent(slug: string) {
  return (rows(database(), "events") as Array<{ slug: string; isPublished?: boolean; coupleName?: string }>).find((e) => e.slug === slug);
}

// Judul memakai nama pasangan hanya untuk undangan yang sudah dipublikasikan; draft tidak boleh bocor.
export async function generateMetadata({ params }: WeddingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = findEvent(slug);
  if (!event?.isPublished) return { title: "Undangan | Occasio", robots: { index: false, follow: false } };
  return { title: `Undangan Pernikahan ${event.coupleName} | Occasio`, robots: { index: false, follow: false } };
}

export default async function WeddingPage({ params }: WeddingPageProps) {
  const { slug } = await params;
  // Slug yang tidak pernah ada menjawab 404 sungguhan; draft tetap dirender agar owner/klien bisa pratinjau.
  if (!findEvent(slug)) notFound();

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
