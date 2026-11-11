"use client";

import { useEffect, useState } from "react";
import { getTemplates } from "@/lib/store";
import { Template } from "@/lib/types";
import Image from "next/image";

export function TemplateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const data = await getTemplates();
      setTemplates(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const filteredTemplates = templates.filter(
    (t) => category === "all" || t.category === category
  );

  if (isLoading) {
    return <div className="animate-pulse flex space-x-4">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "standard", "unique", "custom"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 text-sm rounded-md capitalize transition-colors ${
              category === cat
                ? "bg-[#9a6a3a] text-white"
                : "bg-white text-[#241f1a] border border-[#e0d4c7] hover:bg-[#f7f3ed]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredTemplates.map((template) => (
          <button
            type="button"
            aria-pressed={value === template.id}
            key={template.id}
            onClick={() => onChange(template.id)}
            className={`min-w-0 text-left rounded-xl border-2 overflow-hidden transition-all ${
              value === template.id
                ? "border-[#9a6a3a] ring-2 ring-[#9a6a3a]/20 shadow-md"
                : "border-[#e0d4c7] hover:border-[#9a6a3a]/50"
            }`}
          >
            <div className="aspect-[4/3] relative bg-gray-100">
              <Image
                src={failedImages.has(template.id) ? "/sample-wedding.svg" : template.thumbnailUrl}
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 90vw"
                onError={() => setFailedImages((current) => new Set(current).add(template.id))}
                alt={template.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3 bg-white">
              <h3 className="font-semibold text-[#241f1a]">{template.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{template.category}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
