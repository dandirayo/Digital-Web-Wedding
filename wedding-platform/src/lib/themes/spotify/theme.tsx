"use client";

import React, { useState } from 'react';
import { ThemeProps } from '../types';
import { Play, Shuffle, Heart, MoreHorizontal, Clock, MapPin, Music, CheckCircle, Pause } from 'lucide-react';
import { addGuest, addWish } from '@/lib/store';
import QRCode from 'qrcode';

export default function SpotifyTheme({ event, content, guests, wishes, media, guestName }: ThemeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  
  const [name, setName] = useState(guestName || '');
  const [wishText, setWishText] = useState('');
  
  const defaultBg = '/templates/sheila-yoga/assets/hero-bg.jpg';
  const coverImage = media.length > 0 ? media[0].url : defaultBg;
  const galleryImages = media.length > 1 ? media.slice(1) : Array(4).fill({ url: defaultBg });

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && !isSaved) {
      try {
        const qr = await QRCode.toDataURL(name);
        setQrCodeData(qr);
        setIsSaved(true);
        addGuest(event.id, { name, phone: '', paxLimit: 1, rsvpStatus: 'attending', paxConfirmed: 1 });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && wishText) {
      addWish(event.id, { guestName: name, message: wishText });
      setWishText('');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-[#1db954] selection:text-white pb-24">
      {/* Header/Hero Area */}
      <div className="bg-gradient-to-b from-[#4a5568] to-[#121212] px-6 pt-12 pb-6 md:p-8 md:pt-20">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          <div className="w-52 h-52 md:w-64 md:h-64 shadow-2xl flex-shrink-0">
            <img src={coverImage} alt="Album Cover" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col text-center md:text-left">
            <span className="uppercase text-xs font-bold tracking-widest mb-2 hidden md:block">Public Playlist</span>
            <h1 className="text-5xl md:text-8xl font-black mb-4 md:mb-6 tracking-tighter">
              {content.brideName} & {content.groomName}
            </h1>
            <p className="text-gray-300 text-sm md:text-base font-medium mb-2">
              A celebration of love, life, and forever. Join us on our special day.
            </p>
            <div className="flex items-center justify-center md:justify-start text-sm text-gray-300 font-medium">
              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                <img src={coverImage} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-white hover:underline cursor-pointer">The Happy Couple</span>
              <span className="mx-1">•</span>
              <span>2 tracks,</span>
              <span className="text-gray-400 ml-1">approx. 6 hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 md:px-8 py-4 flex items-center gap-6">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-14 h-14 bg-[#1db954] rounded-full flex items-center justify-center hover:scale-105 hover:bg-[#1ed760] transition shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-black fill-black" />
          ) : (
            <Play className="w-7 h-7 text-black fill-black ml-1" />
          )}
        </button>
        <button 
          onClick={(e) => {
             // trigger rsvp
             if(!isSaved && name) handleRSVP(e as any);
          }}
          className="text-gray-400 hover:text-white transition"
          title="Save to Library (RSVP)"
        >
          <Heart className={`w-9 h-9 ${isSaved ? 'fill-[#1db954] text-[#1db954]' : ''}`} />
        </button>
        <button className="text-gray-400 hover:text-white transition">
          <MoreHorizontal className="w-8 h-8" />
        </button>
      </div>

      {/* Tracklist (Details) */}
      <div className="px-6 md:px-8 mt-6">
        <div className="grid grid-cols-[16px_1fr_100px] md:grid-cols-[16px_2fr_1fr_100px] gap-4 text-gray-400 border-b border-gray-800 pb-2 mb-4 text-sm font-medium px-4">
          <div className="text-center">#</div>
          <div>TITLE</div>
          <div className="hidden md:block">LOCATION</div>
          <div className="flex justify-end"><Clock className="w-5 h-5" /></div>
        </div>

        <div className="space-y-2">
          {/* Track 1 */}
          <div className="grid grid-cols-[16px_1fr_100px] md:grid-cols-[16px_2fr_1fr_100px] gap-4 items-center hover:bg-white/10 rounded-md p-2 px-4 transition group">
            <div className="text-gray-400 group-hover:hidden text-center">1</div>
            <div className="hidden group-hover:flex items-center justify-center text-white"><Play className="w-4 h-4 fill-white" /></div>
            
            <div className="flex flex-col truncate">
              <span className="text-white text-base font-medium truncate">The Vows (Akad)</span>
              <span className="text-gray-400 text-sm truncate">{new Date(event.eventDate).toLocaleDateString()}</span>
            </div>
            
            <div className="hidden md:flex items-center text-gray-400 text-sm truncate">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
            
            <div className="text-gray-400 text-sm text-right">{content.akadTime}</div>
          </div>

          {/* Track 2 */}
          <div className="grid grid-cols-[16px_1fr_100px] md:grid-cols-[16px_2fr_1fr_100px] gap-4 items-center hover:bg-white/10 rounded-md p-2 px-4 transition group">
            <div className="text-gray-400 group-hover:hidden text-center">2</div>
            <div className="hidden group-hover:flex items-center justify-center text-white"><Play className="w-4 h-4 fill-white" /></div>
            
            <div className="flex flex-col truncate">
              <span className="text-white text-base font-medium truncate">The Celebration (Resepsi)</span>
              <span className="text-gray-400 text-sm truncate">Following the Akad</span>
            </div>
            
            <div className="hidden md:flex items-center text-gray-400 text-sm truncate">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
            
            <div className="text-gray-400 text-sm text-right">3 hrs</div>
          </div>
        </div>
      </div>

      {/* Gallery (Fans Also Like) */}
      <div className="px-6 md:px-8 mt-12">
        <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">Fans Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {galleryImages.slice(0, 5).map((img, idx) => (
            <div key={idx} className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition group cursor-pointer">
              <div className="relative aspect-square mb-4 shadow-lg overflow-hidden rounded-md">
                <img src={img.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl hover:scale-105 hover:bg-[#1ed760]">
                  <Play className="w-6 h-6 text-black fill-black ml-1" />
                </button>
              </div>
              <h3 className="font-bold text-white truncate mb-1">Moments Vol. {idx + 1}</h3>
              <p className="text-sm text-gray-400 truncate">The Happy Couple</p>
            </div>
          ))}
        </div>
      </div>

      {/* RSVP Section */}
      <div className="px-6 md:px-8 mt-12 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Save to Library</h2>
          <div className="bg-[#181818] p-6 rounded-xl border border-white/5">
            {!qrCodeData ? (
              <form onSubmit={handleRSVP} className="space-y-4">
                <p className="text-gray-400 text-sm mb-4">Add your name to follow this event and secure your spot.</p>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Your Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#2a2a2a] border border-transparent rounded-[4px] p-3 text-white focus:border-white focus:bg-[#333] transition outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!name}
                  className="w-full bg-[#1db954] text-black font-bold py-3 rounded-full hover:scale-105 hover:bg-[#1ed760] transition disabled:opacity-50 disabled:hover:scale-100 mt-4"
                >
                  Follow Event
                </button>
              </form>
            ) : (
              <div className="text-center flex flex-col items-center justify-center py-6">
                <CheckCircle className="w-16 h-16 text-[#1db954] mb-4" />
                <h3 className="text-xl font-bold mb-2">Saved to Library!</h3>
                <p className="text-gray-400 text-sm mb-6">Show this code at the venue.</p>
                <div className="bg-white p-3 rounded-lg inline-block">
                  <img src={qrCodeData} alt="RSVP QR Code" className="w-40 h-40" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guestbook/Wishes */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Listener Reviews</h2>
          <div className="bg-[#181818] p-6 rounded-xl border border-white/5 h-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
              {wishes.map((wish) => (
                <div key={wish.id} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 font-bold">
                    {wish.guestName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-white hover:underline cursor-pointer">{wish.guestName}</span>
                      <span className="text-xs text-gray-400">just now</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{wish.message}</p>
                  </div>
                </div>
              ))}
              {wishes.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Music className="w-12 h-12 mb-4 opacity-50" />
                  <p>Be the first to dedicate a song or wish!</p>
                </div>
              )}
            </div>

            <form onSubmit={handleAddWish} className="mt-auto border-t border-white/10 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  placeholder="Dedicate a wish..."
                  className="flex-1 bg-[#2a2a2a] rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:bg-[#333] border border-transparent focus:border-white/20 transition"
                  required
                />
                <button 
                  type="submit"
                  disabled={!wishText || !name}
                  className="bg-white text-black font-bold px-6 py-2 rounded-full hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100 text-sm"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
