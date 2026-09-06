"use client";

import { useEffect, useState, useRef, use } from 'react';
import { getEventBySlug, getGuests, updateGuest, initStore } from '@/lib/store';
import { WeddingEvent, Guest } from '@/lib/types';
import { hasFeature } from '@/lib/feature-gate';
import { QrCode, Search, CheckCircle, Clock, Users, ChevronLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CheckinPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [qrInput, setQrInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'qr' | 'search'>('qr');
  
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<Guest[]>([]);
  
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async (initial = false) => {
      if (initial) await initStore();

      try {
        const currentEvent = await getEventBySlug(resolvedParams.slug);

        if (!currentEvent) {
          if (!cancelled) setError('Acara tidak ditemukan');
          return;
        }

        if (!hasFeature(currentEvent.packageTier, 'qr_checkin')) {
          if (!cancelled) setError('Fitur QR Check-in hanya tersedia untuk paket Premium dan Signature');
          return;
        }

        const eventGuests = await getGuests(currentEvent.id);
        const checkedIn = eventGuests
          .filter((guest) => guest.checkedInAt)
          .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
          .slice(0, 10);

        if (!cancelled) {
          setEvent(currentEvent);
          setGuests(eventGuests);
          setRecentCheckins(checkedIn);
          setError('');
        }
      } catch (loadError) {
        console.error(loadError);
        if (initial && !cancelled) setError('Terjadi kesalahan saat memuat data');
      } finally {
        if (initial && !cancelled) setLoading(false);
      }
    };

    const initialLoad = window.setTimeout(() => void loadData(true), 0);
    const interval = window.setInterval(() => void loadData(false), 10000);

    return () => {
      cancelled = true;
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [resolvedParams.slug]);

  // Focus QR input automatically when in QR tab
  useEffect(() => {
    if (activeTab === 'qr' && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [activeTab, selectedGuest]);

  const playSuccessSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioWindow = window as Window & {
        webkitAudioContext?: typeof window.AudioContext;
      };
      const AudioContextClass = window.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio not supported or allowed", e);
    }
  };

  const handleQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    
    const guest = guests.find(g => g.qrCode === qrInput.trim());
    
    if (guest) {
      setSelectedGuest(guest);
      setCheckinSuccess(false);
    } else {
      alert('Kode QR tidak ditemukan');
    }
    
    setQrInput('');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const filteredGuests = searchQuery.trim() === '' 
    ? [] 
    : guests.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);

  const doCheckIn = async (guest: Guest) => {
    try {
      const now = new Date().toISOString();
      const updated = await updateGuest(guest.id, { 
        checkedInAt: now,
        // If they haven't RSVPed or confirmed pax, default to their limit
        paxConfirmed: guest.paxConfirmed > 0 ? guest.paxConfirmed : guest.paxLimit 
      });
      
      playSuccessSound();
      setCheckinSuccess(true);
      setSelectedGuest(updated);
      
      // Update local state immediately for snappy UI
      const newGuests = guests.map(g => g.id === guest.id ? updated : g);
      setGuests(newGuests);
      
      const newRecent = [updated, ...recentCheckins.filter(g => g.id !== guest.id)].slice(0, 10);
      setRecentCheckins(newRecent);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        setSelectedGuest(null);
        setCheckinSuccess(false);
        if (activeTab === 'qr' && qrInputRef.current) {
          qrInputRef.current.focus();
        }
      }, 3000);
      
    } catch (err) {
      console.error(err);
      alert('Gagal check-in, silakan coba lagi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#16c784]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center text-white p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-center">{error}</h1>
        <Link href="/" className="mt-6 px-6 py-3 bg-[#4a90d9] rounded-lg font-semibold hover:bg-blue-600 transition">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  if (!event) return null;

  const totalGuests = guests.reduce((sum, g) => sum + g.paxLimit, 0);
  const checkedInGuests = guests.filter(g => g.checkedInAt).reduce((sum, g) => sum + (g.paxConfirmed || g.paxLimit), 0);
  const notCheckedIn = totalGuests - checkedInGuests;
  const percentage = totalGuests > 0 ? Math.round((checkedInGuests / totalGuests) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white flex flex-col overflow-hidden font-sans selection:bg-[#16c784] selection:text-white">
      {/* Top Bar */}
      <header className="bg-[#111122] border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#16c784]">{event.coupleName}</h1>
            <p className="text-sm text-gray-400">QR Check-in System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-[#1a1a2e] px-6 py-2 rounded-xl border border-white/10">
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Kehadiran</div>
            <div className="text-2xl font-bold text-white">
              {checkedInGuests} <span className="text-gray-500 text-lg">/ {totalGuests}</span>
            </div>
          </div>
          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#16c784] transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="text-xl font-bold text-[#16c784]">{percentage}%</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Scanner / Search & Guest Info */}
        <div className="w-[60%] flex flex-col border-r border-white/10 relative">
          
          {/* Tabs */}
          <div className="flex bg-[#111122] border-b border-white/10">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-semibold text-lg transition-colors ${activeTab === 'qr' ? 'text-[#16c784] border-b-2 border-[#16c784] bg-white/5' : 'text-gray-400 hover:text-white'}`}
            >
              <QrCode className="w-5 h-5" />
              Scan QR
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-semibold text-lg transition-colors ${activeTab === 'search' ? 'text-[#4a90d9] border-b-2 border-[#4a90d9] bg-white/5' : 'text-gray-400 hover:text-white'}`}
            >
              <Search className="w-5 h-5" />
              Pencarian Manual
            </button>
          </div>

          <div className="flex-1 p-8 flex flex-col">
            
            {!selectedGuest ? (
              <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
                
                {activeTab === 'qr' ? (
                  <div className="text-center space-y-8">
                    <div className="w-64 h-64 mx-auto border-4 border-dashed border-[#16c784]/50 rounded-3xl flex items-center justify-center bg-[#16c784]/5 relative overflow-hidden">
                      <div className="absolute inset-0 border-4 border-[#16c784] rounded-3xl opacity-20 animate-pulse"></div>
                      <QrCode className="w-24 h-24 text-[#16c784]/50" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Manual Input QR</h2>
                      <form onSubmit={handleQrSubmit} className="relative">
                        <input
                          ref={qrInputRef}
                          type="text"
                          value={qrInput}
                          onChange={(e) => setQrInput(e.target.value)}
                          placeholder="Masukkan kode QR (contoh: QR-xxx)"
                          className="w-full bg-[#111122] border border-white/20 rounded-xl px-6 py-4 text-xl focus:outline-none focus:border-[#16c784] text-center"
                          autoFocus
                        />
                        <button type="submit" className="absolute right-3 top-3 bottom-3 px-4 bg-[#16c784] text-[#111122] rounded-lg font-bold">
                          Cek
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <h2 className="text-2xl font-bold">Cari Nama Tamu</h2>
                    <div className="relative">
                      <Search className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Ketik nama tamu..."
                        className="w-full bg-[#111122] border border-white/20 rounded-xl pl-14 pr-6 py-4 text-xl focus:outline-none focus:border-[#4a90d9]"
                        autoFocus
                      />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                      {searchQuery.length > 0 && filteredGuests.length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                          Tidak ada tamu dengan nama &quot;{searchQuery}&quot;
                        </div>
                      )}
                      
                      {filteredGuests.map(guest => (
                        <div 
                          key={guest.id}
                          onClick={() => setSelectedGuest(guest)}
                          className="bg-[#111122] p-4 rounded-xl border border-white/10 flex justify-between items-center cursor-pointer hover:border-[#4a90d9] hover:bg-white/5 transition-all"
                        >
                          <div>
                            <div className="font-bold text-lg">{guest.name}</div>
                            <div className="text-gray-400 text-sm">{guest.paxLimit} Orang</div>
                          </div>
                          {guest.checkedInAt ? (
                            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Hadir
                            </div>
                          ) : (
                            <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm font-semibold">
                              Belum Hadir
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            ) : (
              // GUEST INFO CARD
              <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full animate-in fade-in zoom-in duration-300">
                <div className="bg-[#111122] border border-white/10 rounded-3xl p-10 w-full shadow-2xl relative overflow-hidden">
                  
                  {checkinSuccess && (
                    <div className="absolute inset-0 bg-[#16c784]/10 flex flex-col items-center justify-center z-10 animate-in fade-in duration-300 backdrop-blur-sm">
                      <div className="bg-[#16c784] text-[#111122] p-4 rounded-full mb-4 shadow-lg scale-150 animate-bounce">
                        <CheckCircle className="w-12 h-12" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">Check-in Berhasil!</h2>
                      <p className="text-xl text-white/80">Selamat datang, {selectedGuest.name}</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => {
                      setSelectedGuest(null);
                      if (activeTab === 'qr') setTimeout(() => qrInputRef.current?.focus(), 100);
                    }}
                    className="absolute top-6 left-6 text-gray-400 hover:text-white"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  
                  <div className="text-center mt-6 mb-8">
                    <h2 className="text-4xl font-bold mb-4">{selectedGuest.name}</h2>
                    <div className="inline-flex items-center gap-6 text-xl text-gray-300 bg-white/5 px-6 py-3 rounded-full">
                      <div className="flex items-center gap-2">
                        <Users className="w-6 h-6 text-[#4a90d9]" />
                        <span>Undangan: <strong>{selectedGuest.paxLimit}</strong></span>
                      </div>
                      <div className="w-px h-6 bg-white/20"></div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          selectedGuest.rsvpStatus === 'attending' ? 'bg-green-500/20 text-green-400' :
                          selectedGuest.rsvpStatus === 'declined' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {selectedGuest.rsvpStatus === 'attending' ? 'Akan Hadir' :
                           selectedGuest.rsvpStatus === 'declined' ? 'Tidak Hadir' : 'Belum Konfirmasi'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedGuest.checkedInAt ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center mb-8">
                      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-yellow-500 mb-1">Sudah Check-in</h3>
                      <p className="text-yellow-500/70">
                        Tamu ini sudah melakukan check-in pada {new Date(selectedGuest.checkedInAt).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => doCheckIn(selectedGuest)}
                      className="w-full bg-[#16c784] hover:bg-[#12a66d] text-[#111122] font-bold text-2xl py-6 rounded-2xl shadow-[0_0_40px_rgba(22,199,132,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Konfirmasi Kehadiran
                    </button>
                  )}
                  
                </div>
              </div>
            )}

          </div>
        </div>
        
        {/* Right Side: Recent Check-ins */}
        <div className="w-[40%] bg-[#111122]/50 flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#111122]">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#4a90d9]" />
              Riwayat Check-in
            </h2>
            <div className="text-sm text-gray-400">Live Update</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {recentCheckins.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                Belum ada tamu yang hadir
              </div>
            ) : (
              recentCheckins.map((guest, idx) => (
                <div 
                  key={guest.id}
                  className="bg-[#1a1a2e] border border-white/5 rounded-xl p-4 flex justify-between items-center shadow-lg animate-in slide-in-from-right-4 fade-in duration-300"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#16c784]/20 flex items-center justify-center text-[#16c784]">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">{guest.name}</div>
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <Users className="w-4 h-4" /> {guest.paxConfirmed || guest.paxLimit} Orang
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white/80">
                      {new Date(guest.checkedInAt!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 border-t border-white/10 bg-[#111122]">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-1">Belum Hadir</div>
                <div className="text-2xl font-bold text-red-400">{notCheckedIn}</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5">
                <div className="text-sm text-gray-400 mb-1">Total Undangan</div>
                <div className="text-2xl font-bold text-white">{totalGuests}</div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
