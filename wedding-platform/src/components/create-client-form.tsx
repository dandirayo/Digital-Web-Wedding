"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/types";
import { getStorageItem, setStorageItem } from "@/lib/store";

export function CreateClientForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (client: UserProfile) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call and saving to local storage
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newClient: UserProfile = {
        id: `client_${Math.random().toString(36).substring(2, 9)}`,
        fullName,
        email,
        role: "client",
        createdAt: new Date().toISOString(),
      };

      const profiles = getStorageItem<UserProfile[]>("occasio_profiles", []);
      setStorageItem("occasio_profiles", [...profiles, newClient]);

      onSuccess(newClient);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 border border-[#e0d4c7] rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-[#241f1a] mb-4">Create New Client</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#241f1a]">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#241f1a]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#241f1a]">Password (for client login)</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-[#9a6a3a] text-white rounded-md hover:bg-[#855930] font-medium disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Create Client"}
          </button>
        </div>
      </form>
    </div>
  );
}
