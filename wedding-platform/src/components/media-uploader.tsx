"use client";

import { useState } from "react";
import { MediaCategory, MediaType } from "@/lib/types";
import Image from "next/image";

type LocalMedia = {
  id: string;
  file: File;
  url: string;
  category: MediaCategory;
  type: MediaType;
};

export function MediaUploader({
  media,
  onChange,
}: {
  media: LocalMedia[];
  onChange: (media: LocalMedia[]) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>("gallery");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newMedia = files.map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        url: URL.createObjectURL(file),
        category: selectedCategory,
        type: file.type.startsWith("video/") ? "video" : "photo" as MediaType,
      }));
      onChange([...media, ...newMedia]);
    }
  };

  const removeMedia = (id: string) => {
    const item = media.find((m) => m.id === id);
    if (item) URL.revokeObjectURL(item.url);
    onChange(media.filter((m) => m.id !== id));
  };

  const categories: MediaCategory[] = ["cover", "bride", "groom", "prewedding", "gallery", "map"];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border border-[#e0d4c7] rounded-lg shadow-sm">
        <label className="block text-sm font-medium text-[#241f1a] mb-2">
          Upload New Media
        </label>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as MediaCategory)}
            className="w-full sm:w-auto p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a] bg-white text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button
              type="button"
              className="px-4 py-2 bg-[#9a6a3a] text-white rounded-md hover:bg-[#855930] transition-colors text-sm font-medium whitespace-nowrap"
            >
              Choose Files
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Select a category first, then choose files to upload. Files are kept locally for this demo.
        </p>
      </div>

      {media.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#241f1a] mb-3 border-b border-[#e0d4c7] pb-2">
            Uploaded Media
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <div key={item.id} className="relative group rounded-md overflow-hidden border border-[#e0d4c7] bg-white">
                <div className="aspect-square relative bg-gray-100">
                  {item.type === "photo" ? (
                    <Image src={item.url} alt="Uploaded media" fill className="object-cover" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removeMedia(item.id)}
                      className="bg-white text-red-600 rounded-full p-2 hover:bg-red-50"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-2 text-xs">
                  <span className="inline-block px-2 py-1 bg-[#f7f3ed] text-[#9a6a3a] rounded-sm font-medium capitalize w-full text-center">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
