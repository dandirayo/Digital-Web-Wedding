"use client";

import React, { useState } from 'react';
import { ThemeProps } from '../types';
import { Plane, Calendar, MapPin, Clock, CheckCircle, Ticket, Camera, MessageSquare } from 'lucide-react';
import { addGuest, addWish } from '@/lib/store';
import QRCode from 'qrcode';

export default function BoardingPassTheme({ event, content, guests, wishes, media, guestName }: ThemeProps) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  
  const [name, setName] = useState(guestName || '');
  const [wishText, setWishText] = useState('');
  
  const defaultBg = '/templates/sheila-yoga/assets/hero-bg.jpg';
  const heroImage = media.length > 0 ? media[0].url : defaultBg;
  const galleryImages = media.length > 1 ? media.slice(1) : Array(4).fill({ url: defaultBg });

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && !isCheckedIn) {
      try {
        const qr = await QRCode.toDataURL(name);
        setQrCodeData(qr);
        setIsCheckedIn(true);
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
    <div className="min-h-screen bg-[#f0f4f8] text-[#1a202c] font-sans">
      
      {/* Navbar/Header */}
      <div className="bg-[#0055a4] text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center font-bold text-xl tracking-wider">
          <Plane className="w-6 h-6 mr-2" />
          <span>LOVE AIRLINES</span>
        </div>
        <div className="text-sm font-medium opacity-80">FLIGHT {new Date(event.eventDate).getFullYear()}</div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
        
        {/* Giant Boarding Pass Hero */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
          {/* Cutouts */}
          <div className="hidden md:block absolute top-0 bottom-0 left-[70%] w-[2px] border-l-2 border-dashed border-gray-300 z-10"></div>
          <div className="hidden md:block absolute -top-4 left-[70%] -translate-x-1/2 w-8 h-8 bg-[#f0f4f8] rounded-full z-10"></div>
          <div className="hidden md:block absolute -bottom-4 left-[70%] -translate-x-1/2 w-8 h-8 bg-[#f0f4f8] rounded-full z-10"></div>
          
          <div className="md:hidden absolute left-0 right-0 top-[60%] h-[2px] border-t-2 border-dashed border-gray-300 z-10"></div>
          <div className="md:hidden absolute top-[60%] -left-4 -translate-y-1/2 w-8 h-8 bg-[#f0f4f8] rounded-full z-10"></div>
          <div className="md:hidden absolute top-[60%] -right-4 -translate-y-1/2 w-8 h-8 bg-[#f0f4f8] rounded-full z-10"></div>

          {/* Main Ticket */}
          <div className="flex-1 p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[#0055a4] font-bold text-sm uppercase tracking-widest mb-1">First Class Ticket</p>
                <h1 className="text-4xl md:text-5xl font-black text-gray-800 uppercase tracking-tighter">
                  {content.brideName} <span className="text-[#0055a4] font-light">&</span> {content.groomName}
                </h1>
              </div>
              <Plane className="w-12 h-12 text-[#0055a4] opacity-20 transform rotate-45" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 flex-1">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Passenger 1</p>
                <p className="font-mono text-lg md:text-xl font-bold">{content.brideName.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Passenger 2</p>
                <p className="font-mono text-lg md:text-xl font-bold">{content.groomName.toUpperCase()}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Date</p>
                <p className="font-mono text-lg font-bold text-[#0055a4]">
                  {new Date(event.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Departing (Akad)</p>
                <div className="flex items-center text-gray-700">
                  <Clock className="w-4 h-4 mr-2 text-[#0055a4]" />
                  <span className="font-mono font-bold">{content.akadTime}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Arrival (Resepsi)</p>
                <div className="flex items-center text-gray-700">
                  <Clock className="w-4 h-4 mr-2 text-[#0055a4]" />
                  <span className="font-mono font-bold">Following Akad</span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Gate / Venue</p>
                <div className="flex items-start text-gray-700">
                  <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0 text-[#0055a4]" />
                  <span className="font-mono text-sm">{event.venue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Stub */}
          <div className="w-full md:w-[30%] bg-[#0055a4] text-white p-6 md:p-8 flex flex-col justify-center items-center text-center">
            <Ticket className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm uppercase tracking-widest mb-2 font-bold">Boarding Pass</p>
            <p className="text-2xl font-black mb-6">{new Date(event.eventDate).getFullYear()}</p>
            
            <div className="bg-white p-2 rounded-lg mb-4 w-full aspect-square flex items-center justify-center">
              {qrCodeData ? (
                <img src={qrCodeData} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-400">
                  <p className="text-xs text-center px-2">Check-in to generate barcode</p>
                </div>
              )}
            </div>
            
            <p className="font-mono text-xs opacity-70 break-all">
              {Math.random().toString(36).substring(2, 15).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Gallery (Travel Polaroids) */}
        <div>
          <div className="flex items-center mb-6 text-[#0055a4]">
            <Camera className="w-6 h-6 mr-2" />
            <h2 className="text-2xl font-bold uppercase tracking-wider">Travel Memories</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {galleryImages.map((img, idx) => (
              <div key={idx} className="bg-white p-3 pb-8 md:pb-12 shadow-lg transform hover:-translate-y-2 transition duration-300" style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }}>
                <div className="aspect-square bg-gray-200 mb-3 overflow-hidden">
                  <img src={img.url} alt={`Memory ${idx}`} className="w-full h-full object-cover filter contrast-110 sepia-[.2]" />
                </div>
                <p className="font-handwriting text-center text-gray-600 font-medium">Destination {idx + 1}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Check-in (RSVP) & Messages */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* RSVP */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-t-8 border-[#0055a4]">
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wider mb-2">Web Check-In</h2>
            <p className="text-gray-500 mb-6 text-sm">Confirm your flight to generate your boarding barcode.</p>

            {!isCheckedIn ? (
              <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Passenger Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 focus:border-[#0055a4] focus:ring-2 focus:ring-[#0055a4]/20 transition outline-none font-mono"
                    placeholder="ENTER FULL NAME"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!name}
                  className="w-full bg-[#0055a4] text-white font-bold py-3 rounded-lg hover:bg-[#004080] transition shadow-md disabled:opacity-50 flex justify-center items-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Confirm Flight
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Check-in Complete</h3>
                <p className="text-gray-500 text-sm">Your boarding pass has been issued. Have a safe flight!</p>
              </div>
            )}
          </div>

          {/* Guestbook */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-t-8 border-[#0055a4] flex flex-col">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-6 h-6 mr-2 text-[#0055a4]" />
              <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wider">Flight Log</h2>
            </div>
            
            <form onSubmit={handleAddWish} className="mb-6">
              <textarea
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Leave a message for the crew..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 focus:border-[#0055a4] focus:ring-2 focus:ring-[#0055a4]/20 outline-none min-h-[80px] mb-3 text-sm"
                required
              />
              <button 
                type="submit"
                disabled={!wishText || !name}
                className="bg-gray-800 text-white font-bold px-6 py-2 rounded-lg hover:bg-black transition disabled:opacity-50 text-sm w-full"
              >
                Sign Logbook
              </button>
            </form>

            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-4 pr-2">
              {wishes.map((wish) => (
                <div key={wish.id} className="bg-gray-50 p-4 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#0055a4] rounded-l-lg"></div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-gray-800 text-sm">{wish.guestName}</span>
                    <span className="text-xs text-gray-400 font-mono">CONFIRMED</span>
                  </div>
                  <p className="text-gray-600 text-sm">{wish.message}</p>
                </div>
              ))}
              {wishes.length === 0 && (
                <div className="text-center text-gray-400 py-8 italic text-sm">
                  The logbook is empty. Be the first to sign!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
