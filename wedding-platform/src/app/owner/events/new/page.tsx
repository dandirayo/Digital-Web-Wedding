"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TemplateSelector } from "@/components/template-selector";
import { MediaUploader } from "@/components/media-uploader";
import { CreateClientForm } from "@/components/create-client-form";
import { 
  getPackages, 
  getStorageItem, 
  createEvent, 
  updateEventContent, 
  addMedia 
} from "@/lib/store";
import { Package, UserProfile, MediaCategory, MediaType } from "@/lib/types";

type LocalMedia = {
  id: string;
  file: File;
  url: string;
  category: MediaCategory;
  type: MediaType;
};

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Template & Package
  const [templateId, setTemplateId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [packages, setPackages] = useState<Package[]>([]);

  // Step 2: Data Mempelai
  const [brideName, setBrideName] = useState("");
  const [brideParent, setBrideParent] = useState("");
  const [groomName, setGroomName] = useState("");
  const [groomParent, setGroomParent] = useState("");

  // Step 3: Data Acara
  const [eventDate, setEventDate] = useState("");
  const [akadTime, setAkadTime] = useState("");
  const [akadVenue, setAkadVenue] = useState("");
  const [resepsiTime, setResepsiTime] = useState("");
  const [resepsiVenue, setResepsiVenue] = useState("");

  // Step 4: Media
  const [media, setMedia] = useState<LocalMedia[]>([]);

  // Step 5: Review & Publish
  const [slug, setSlug] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [showCreateClient, setShowCreateClient] = useState(false);

  useEffect(() => {
    async function loadData() {
      const pkgs = await getPackages();
      setPackages(pkgs);

      const allProfiles = getStorageItem<UserProfile[]>("occasio_profiles", []);
      setClients(allProfiles.filter((p) => p.role === "client"));
    }
    loadData();
  }, []);

  // Auto-generate slug when bride/groom changes
  useEffect(() => {
    if (brideName && groomName && !slug) {
      setSlug(`${brideName}-${groomName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [brideName, groomName, slug]);

  const handleNext = () => setStep((s) => Math.min(5, s + 1));
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!templateId || !packageId || !clientId || !slug) {
      alert("Please ensure template, package, client, and slug are selected.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPackage = packages.find((p) => p.id === packageId);
      if (!selectedPackage) throw new Error("Package not found");

      const coupleName = `${brideName} & ${groomName}`;
      
      // Get current session or default to demo owner
      const session = getStorageItem<{ userId: string }>("occasio_session", { userId: "owner_1" });

      // Create Event
      const newEvent = await createEvent({
        ownerId: session.userId,
        clientId,
        slug,
        coupleName,
        templateId,
        packageId,
        packageTier: selectedPackage.slug,
        eventDate: eventDate || new Date().toISOString(),
        venue: resepsiVenue || akadVenue || "TBD",
        status: "active",
        isPublished: true,
        publishedAt: new Date().toISOString(),
        expiresAt: null,
      });

      // Update Event Content
      await updateEventContent(newEvent.id, {
        brideName,
        brideParent,
        groomName,
        groomParent,
        akadTime,
        akadVenue,
        resepsiTime,
        resepsiVenue,
        greeting: "Welcome to our wedding!",
      });

      // Add Media
      for (const [index, m] of media.entries()) {
        await addMedia(newEvent.id, {
          type: m.type,
          url: m.url, // In a real app, this would be an uploaded URL
          altText: `${m.category} media ${index + 1}`,
          category: m.category,
          sortOrder: index,
        });
      }

      // Redirect
      router.push(`/owner/dashboard`);
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. See console for details.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#241f1a]">Create New Event</h1>
        <p className="mt-2 text-sm text-gray-600">Follow the steps to set up a new wedding invitation.</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                  step >= i ? "bg-[#9a6a3a] text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i}
              </div>
              {i < 5 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > i ? "bg-[#9a6a3a]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-gray-500 px-1">
          <span className="w-8 text-center">Template</span>
          <span className="w-8 text-center ml-12">Couple</span>
          <span className="w-8 text-center ml-12">Event</span>
          <span className="w-8 text-center ml-12">Media</span>
          <span className="w-8 text-center">Publish</span>
        </div>
      </div>

      <div className="bg-[#f7f3ed] p-6 rounded-xl border border-[#e0d4c7] shadow-sm mb-6 min-h-[400px]">
        {/* Step 1: Template & Package */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-semibold text-[#241f1a] mb-4">Select Template</h2>
              <TemplateSelector value={templateId} onChange={setTemplateId} />
            </div>
            
            <div className="pt-6 border-t border-[#e0d4c7]">
              <h2 className="text-xl font-semibold text-[#241f1a] mb-4">Select Package</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setPackageId(pkg.id)}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      packageId === pkg.id
                        ? "border-[#9a6a3a] bg-white ring-1 ring-[#9a6a3a]"
                        : "border-[#e0d4c7] bg-white hover:border-[#9a6a3a]/50"
                    }`}
                  >
                    <h3 className="font-semibold text-lg text-[#241f1a] capitalize">{pkg.name}</h3>
                    <p className="text-[#9a6a3a] font-medium">{pkg.price}</p>
                    <ul className="mt-3 text-sm text-gray-600 space-y-1">
                      <li>Max {pkg.maxGuests} guests</li>
                      <li>{pkg.durationMonths} months active</li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Data Mempelai */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-[#241f1a] mb-4">Data Mempelai</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-white p-4 rounded-lg border border-[#e0d4c7]">
                <h3 className="font-medium text-[#9a6a3a]">Bride (Mempelai Wanita)</h3>
                <div>
                  <label className="block text-sm font-medium text-[#241f1a]">Full Name</label>
                  <input
                    type="text"
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#241f1a]">Parents Name</label>
                  <input
                    type="text"
                    value={brideParent}
                    onChange={(e) => setBrideParent(e.target.value)}
                    placeholder="Putri dari Bapak... & Ibu..."
                    className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
                  />
                </div>
              </div>

              <div className="space-y-4 bg-white p-4 rounded-lg border border-[#e0d4c7]">
                <h3 className="font-medium text-[#9a6a3a]">Groom (Mempelai Pria)</h3>
                <div>
                  <label className="block text-sm font-medium text-[#241f1a]">Full Name</label>
                  <input
                    type="text"
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#241f1a]">Parents Name</label>
                  <input
                    type="text"
                    value={groomParent}
                    onChange={(e) => setGroomParent(e.target.value)}
                    placeholder="Putra dari Bapak... & Ibu..."
                    className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Data Acara */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-[#241f1a] mb-4">Data Acara</h2>
            
            <div className="bg-white p-4 rounded-lg border border-[#e0d4c7] mb-6">
              <label className="block text-sm font-medium text-[#241f1a]">Event Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 block w-full max-w-md p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-white p-4 rounded-lg border border-[#e0d4c7]">
                <h3 className="font-medium text-[#9a6a3a]">Akad Nikah / Pemberkatan</h3>
                <div>
                  <label className="block text-sm font-medium text-[#241f1a]">Time</label>
                  <input
                    type="text"
                    value={akadTime}
                    onChange={(e) => setAkadTime(e.target.value)}
                    placeholder="08:00 - 10:00 WIB"
                    className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#241f1a]">Venue Name & Address</label>
                  <textarea
                    value={akadVenue}
                    onChange={(e) => setAkadVenue(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
                  />
                </div>
              </div>

              <div className="space-y-4 bg-white p-4 rounded-lg border border-[#e0d4c7]">
                <h3 className="font-medium text-[#9a6a3a]">Resepsi</h3>
                <div>
                  <label className="block text-sm font-medium text-[#241f1a]">Time</label>
                  <input
                    type="text"
                    value={resepsiTime}
                    onChange={(e) => setResepsiTime(e.target.value)}
                    placeholder="11:00 - Selesai"
                    className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#241f1a]">Venue Name & Address</label>
                  <textarea
                    value={resepsiVenue}
                    onChange={(e) => setResepsiVenue(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Media */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-[#241f1a] mb-4">Media (Opsional)</h2>
            <MediaUploader media={media} onChange={setMedia} />
          </div>
        )}

        {/* Step 5: Review & Publish */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-[#241f1a] mb-4">Review & Publish</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border border-[#e0d4c7]">
                  <h3 className="font-medium text-[#9a6a3a] mb-3">Event Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#241f1a]">Event Slug (URL)</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[#e0d4c7] bg-gray-50 text-gray-500 text-sm">
                          occasio.id/
                        </span>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="flex-1 block w-full min-w-0 rounded-none rounded-r-md p-2 border border-[#e0d4c7] focus:ring-[#9a6a3a] focus:border-[#9a6a3a] sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#241f1a] mb-1">Assign Client</label>
                      {!showCreateClient ? (
                        <div className="flex space-x-2">
                          <select
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className="block w-full p-2 border border-[#e0d4c7] rounded-md focus:ring-[#9a6a3a] focus:border-[#9a6a3a] text-sm bg-white"
                          >
                            <option value="">-- Select an existing client --</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowCreateClient(true)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 whitespace-nowrap border border-gray-300"
                          >
                            New Client
                          </button>
                        </div>
                      ) : (
                        <CreateClientForm
                          onSuccess={(newClient) => {
                            setClients([...clients, newClient]);
                            setClientId(newClient.id);
                            setShowCreateClient(false);
                          }}
                          onCancel={() => setShowCreateClient(false)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#e0d4c7]">
                <h3 className="font-medium text-[#9a6a3a] mb-3">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Couple</span>
                    <span className="font-medium text-[#241f1a]">{brideName} & {groomName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-[#241f1a]">{eventDate || "Not set"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Package</span>
                    <span className="font-medium text-[#241f1a] capitalize">
                      {packages.find((p) => p.id === packageId)?.name || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Media Count</span>
                    <span className="font-medium text-[#241f1a]">{media.length} items</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-[#e0d4c7]">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 1 || isSubmitting}
          className="px-6 py-2 border border-[#e0d4c7] text-[#241f1a] rounded-md font-medium hover:bg-white disabled:opacity-50 transition-colors"
        >
          Back
        </button>
        
        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 bg-[#9a6a3a] text-white rounded-md font-medium hover:bg-[#855930] transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#241f1a] text-white rounded-md font-medium hover:bg-black transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <span>Simpan & Publish</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
