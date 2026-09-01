"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProps } from '../types';
import { Play, Info, Plus, Check, ThumbsUp, Volume2, Calendar, MapPin, Clock } from 'lucide-react';
import { addGuest, addWish } from '@/lib/store';
import QRCode from 'qrcode';
import Image from 'next/image';

export default function NetflixTheme({ event, content, guests, wishes, media, guestName }: ThemeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<'pending' | 'attending' | 'declined'>('pending');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  
  const [name, setName] = useState(guestName || '');
  const [wishText, setWishText] = useState('');
  
  const defaultBg = '/templates/sheila-yoga/assets/hero-bg.jpg';
  const heroImage = media.length > 0 ? media[0].url : defaultBg;
  const galleryImages = media.length > 1 ? media.slice(1) : Array(4).fill({ url: defaultBg });

  const handleRSVP = async (status: 'attending' | 'declined') => {
    setRsvpStatus(status);
    if (status === 'attending' && name) {
      try {
        const qr = await QRCode.toDataURL(name);
        setQrCodeData(qr);
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
    <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-[#e50914] selection:text-white">
      {/* Hero Section */}
      <div className="relative h-[85vh] w-full">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/40 to-transparent" />
        </div>
        
        <div className="absolute bottom-[10%] left-[4%] md:left-[8%] max-w-2xl z-10">
          <div className="flex items-center space-x-2 text-[#e50914] font-bold text-sm md:text-base tracking-widest mb-4">
            <span className="text-xl">N</span>
            <span>SERIES</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-4 uppercase tracking-tighter">
            {content.brideName} <br />
            <span className="text-3xl md:text-5xl text-[#e50914]">&</span> {content.groomName}
          </h1>
          
          <div className="flex items-center space-x-4 text-sm md:text-base text-gray-300 mb-6 font-semibold">
            <span className="text-green-500 font-bold">98% Match</span>
            <span>{new Date(event.eventDate).getFullYear()}</span>
            <span className="border border-gray-600 px-1 text-xs">13+</span>
            <span>Wedding</span>
            <span className="border border-gray-600 px-1 text-xs">HD</span>
          </div>

          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl">
            Two lives intertwine in this romantic feature. Watch as they say "I do" and begin their forever journey together.
          </p>

          <div className="flex space-x-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center justify-center bg-white text-black px-6 py-2 md:px-8 md:py-3 rounded hover:bg-gray-200 transition font-bold text-lg"
            >
              <Play className="w-6 h-6 mr-2 fill-black" />
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button className="flex items-center justify-center bg-gray-500/70 text-white px-6 py-2 md:px-8 md:py-3 rounded hover:bg-gray-500/90 transition font-bold text-lg">
              <Info className="w-6 h-6 mr-2" />
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Cast & Info */}
      <div className="px-[4%] md:px-[8%] py-8 text-gray-400">
        <p className="mb-2"><span className="text-gray-500">Starring:</span> <span className="text-white">{content.brideName}, {content.groomName}</span></p>
        <p className="mb-2"><span className="text-gray-500">Creators:</span> <span className="text-white">Families of the Bride & Groom</span></p>
        <p><span className="text-gray-500">Genres:</span> <span className="text-white">Romance, Wedding, Drama, Documentary</span></p>
      </div>

      {/* Episodes (Details) */}
      <div className="px-[4%] md:px-[8%] py-12 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">Episodes</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row bg-[#2b2b2b]/50 rounded-lg p-6 hover:bg-[#2b2b2b] transition border-b-2 border-transparent hover:border-[#e50914]">
            <div className="flex items-center text-4xl text-gray-500 font-bold mr-6 mb-4 md:mb-0">1</div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">The Vows (Akad)</h3>
                <span className="text-gray-400">1h 30m</span>
              </div>
              <p className="text-gray-400 mb-4">{new Date(event.eventDate).toLocaleDateString()} • {content.akadTime}</p>
              <div className="flex items-start text-sm text-gray-300">
                <MapPin className="w-4 h-4 mr-2 mt-1 text-[#e50914] flex-shrink-0" />
                <p>{event.venue}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row bg-[#2b2b2b]/50 rounded-lg p-6 hover:bg-[#2b2b2b] transition border-b-2 border-transparent hover:border-[#e50914]">
            <div className="flex items-center text-4xl text-gray-500 font-bold mr-6 mb-4 md:mb-0">2</div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">The Celebration (Resepsi)</h3>
                <span className="text-gray-400">3h 00m</span>
              </div>
              <p className="text-gray-400 mb-4">{new Date(event.eventDate).toLocaleDateString()} • Following the Akad</p>
              <div className="flex items-start text-sm text-gray-300">
                <MapPin className="w-4 h-4 mr-2 mt-1 text-[#e50914] flex-shrink-0" />
                <p>{event.venue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="px-[4%] md:px-[8%] py-12">
        <h2 className="text-2xl font-bold text-white mb-6">More Like This</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryImages.map((img, idx) => (
            <div key={idx} className="relative aspect-video bg-gray-800 rounded overflow-hidden group cursor-pointer hover:scale-105 transition duration-300 ease-in-out">
              <img src={img.url} alt={`Gallery ${idx}`} className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Play className="w-12 h-12 text-white/80" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RSVP & Wishes Section */}
      <div className="px-[4%] md:px-[8%] py-12 bg-gradient-to-b from-[#141414] to-black">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* RSVP Form */}
          <div className="bg-[#181818] rounded-xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <Plus className="w-6 h-6 mr-2 text-[#e50914]" /> My List (RSVP)
            </h2>
            <p className="text-gray-400 mb-6">Add this event to your watch list.</p>
            
            {guestName && <p className="mb-4 text-xl font-semibold">Welcome, {guestName}</p>}

            {!qrCodeData ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#333] border-none rounded p-4 text-white focus:ring-2 focus:ring-[#e50914] outline-none"
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleRSVP('attending')}
                    disabled={!name}
                    className="flex-1 bg-white text-black py-4 rounded font-bold hover:bg-gray-200 transition disabled:opacity-50 flex justify-center items-center"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Add to List
                  </button>
                  <button 
                    onClick={() => handleRSVP('declined')}
                    disabled={!name}
                    className="flex-1 bg-[#333] text-white py-4 rounded font-bold hover:bg-[#444] transition disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center bg-[#222] p-8 rounded-lg">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Added to Your List!</h3>
                <p className="text-gray-400 mb-6">Present this code at the premiere.</p>
                <div className="bg-white p-4 inline-block rounded-lg">
                  <img src={qrCodeData} alt="RSVP QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}
          </div>

          {/* Wishes */}
          <div className="bg-[#181818] rounded-xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">Reviews & Comments</h2>
            
            <form onSubmit={handleAddWish} className="mb-8">
              <textarea
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Leave a review..."
                className="w-full bg-[#333] border-none rounded p-4 text-white focus:ring-2 focus:ring-[#e50914] outline-none min-h-[100px] mb-4"
              />
              <button 
                type="submit" 
                disabled={!wishText || !name}
                className="bg-[#e50914] text-white px-8 py-3 rounded font-bold hover:bg-[#f40612] transition disabled:opacity-50"
              >
                Post Review
              </button>
            </form>

            <div className="space-y-6">
              {wishes.map((wish) => (
                <div key={wish.id} className="border-b border-gray-800 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-[#333] flex items-center justify-center font-bold">
                        {wish.guestName.charAt(0)}
                      </div>
                      <span className="font-bold text-white">{wish.guestName}</span>
                    </div>
                    <div className="flex text-gray-500 text-sm">
                      <ThumbsUp className="w-4 h-4 mr-1" /> Helpful
                    </div>
                  </div>
                  <p className="text-gray-300 ml-13">{wish.message}</p>
                </div>
              ))}
              {wishes.length === 0 && (
                <p className="text-gray-500 italic text-center py-8">Be the first to leave a review!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
