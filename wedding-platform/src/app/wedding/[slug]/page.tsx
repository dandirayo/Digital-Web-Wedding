import { notFound } from "next/navigation";
import { events } from "@/lib/demo-data";

type WeddingPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    to?: string;
  }>;
};

export default async function WeddingPage({ params, searchParams }: WeddingPageProps) {
  const { slug } = await params;
  const { to } = await searchParams;
  const event = events.find((item) => item.slug === slug);

  if (!event) notFound();

  const guestQuery = to ? `?to=${encodeURIComponent(to)}` : "";
  const templateUrl = `/templates/sheila-yoga/index.html${guestQuery}`;

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <iframe
        src={templateUrl}
        title={`${event.couple} wedding website`}
        className="h-full w-full border-0"
        allow="autoplay; clipboard-write"
      />
    </main>
  );
}
