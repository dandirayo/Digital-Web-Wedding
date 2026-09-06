import { Template, Package, WeddingEvent, EventContent, Guest, Wish, EventMedia, UserProfile } from '../types';

const now = new Date().toISOString();

export const seedData = {
  templates: [
    {
      id: 'tpl-1',
      name: 'Classic Elegant',
      slug: 'classic-elegant',
      category: 'standard',
      description: 'Desain elegan dengan warna cokelat hangat dan tipografi serif klasik.',
      thumbnailUrl: '/templates/classic-elegant-thumb.jpg',
      previewUrl: '/preview/classic-elegant',
      minPackage: 'silver',
      isActive: true,
      configJson: {
        primaryColor: '#9a6a3a',
        secondaryColor: '#f7f3ed',
        fontFamily: 'serif',
        darkMode: false,
        sections: ['hero', 'couple', 'details', 'gallery', 'wishes', 'rsvp']
      },
      createdAt: now
    },
    {
      id: 'tpl-2',
      name: 'Modern Minimal',
      slug: 'modern-minimal',
      category: 'standard',
      description: 'Desain hitam-putih yang bersih, tegas, dan minimal untuk pasangan modern.',
      thumbnailUrl: '/templates/modern-minimal-thumb.jpg',
      previewUrl: '/preview/modern-minimal',
      minPackage: 'silver',
      isActive: true,
      configJson: {
        primaryColor: '#1a1a1a',
        secondaryColor: '#ffffff',
        fontFamily: 'sans-serif',
        darkMode: false,
        sections: ['hero', 'couple', 'details', 'gallery', 'wishes', 'rsvp']
      },
      createdAt: now
    },
    {
      id: 'tpl-3',
      name: 'Rustic Garden',
      slug: 'rustic-garden',
      category: 'standard',
      description: 'Warna natural dan aksen floral untuk pernikahan outdoor atau garden.',
      thumbnailUrl: '/templates/rustic-garden-thumb.jpg',
      previewUrl: '/preview/rustic-garden',
      minPackage: 'silver',
      isActive: true,
      configJson: {
        primaryColor: '#4a5d23',
        secondaryColor: '#f4f1ea',
        fontFamily: 'serif',
        darkMode: false,
        sections: ['hero', 'couple', 'details', 'gallery', 'wishes', 'rsvp']
      },
      createdAt: now
    },
    {
      id: 'tpl-4',
      name: 'Netflix',
      slug: 'netflix',
      category: 'unique',
      description: 'Undangan bertema film dengan pengalaman visual seperti layanan streaming.',
      thumbnailUrl: '/templates/netflix-thumb.jpg',
      previewUrl: '/preview/netflix',
      minPackage: 'gold',
      isActive: true,
      configJson: {
        primaryColor: '#e50914',
        secondaryColor: '#141414',
        fontFamily: 'sans-serif',
        darkMode: true,
        sections: ['hero', 'couple', 'details', 'gallery', 'wishes', 'rsvp']
      },
      createdAt: now
    },
    {
      id: 'tpl-5',
      name: 'Spotify',
      slug: 'spotify',
      category: 'unique',
      description: 'Undangan bertema musik yang disusun seperti sebuah playlist personal.',
      thumbnailUrl: '/templates/spotify-thumb.jpg',
      previewUrl: '/preview/spotify',
      minPackage: 'gold',
      isActive: true,
      configJson: {
        primaryColor: '#1db954',
        secondaryColor: '#121212',
        fontFamily: 'sans-serif',
        darkMode: true,
        sections: ['hero', 'couple', 'details', 'gallery', 'wishes', 'rsvp']
      },
      createdAt: now
    },
    {
      id: 'tpl-6',
      name: 'Boarding Pass',
      slug: 'boarding-pass',
      category: 'unique',
      description: 'Desain tiket perjalanan untuk destination wedding dan pasangan traveler.',
      thumbnailUrl: '/templates/boarding-pass-thumb.jpg',
      previewUrl: '/preview/boarding-pass',
      minPackage: 'gold',
      isActive: true,
      configJson: {
        primaryColor: '#0055a4',
        secondaryColor: '#f0f4f8',
        fontFamily: 'monospace',
        darkMode: false,
        sections: ['hero', 'couple', 'details', 'gallery', 'wishes', 'rsvp']
      },
      createdAt: now
    }
  ] as Template[],

  packages: [
    {
      id: 'pkg-silver',
      name: 'Basic',
      slug: 'silver',
      price: 'Rp 799.000',
      priceNumeric: 799000,
      description: 'Website undangan siap pakai dengan fungsi inti untuk acara intimate.',
      features: [
        'Undangan web',
        'Link per tamu',
        'RSVP online',
        'Ucapan/guestbook',
        'Pilihan template Basic',
        'Musik pilihan Occasio'
      ],
      maxGuests: 500,
      maxRevisions: 2,
      durationMonths: 3,
      includesTablet: false,
      includesCrew: 0,
      includesLiveGallery: false,
      includesPhotoBooth: false,
      includesQrCheckin: false,
      sortOrder: 1,
      isActive: true
    },
    {
      id: 'pkg-gold',
      name: 'Premium',
      slug: 'gold',
      price: 'Rp 1.490.000',
      priceNumeric: 1490000,
      description: 'Dashboard klien, pengelolaan tamu, dan QR check-in dalam satu workspace.',
      features: [
        'Semua fitur Basic',
        'Semua template Basic dan Premium',
        'QR check-in',
        '1 tablet check-in',
        '1 kru pendamping',
        'Galeri foto langsung',
        'Amplop digital',
        'Pilihan musik premium'
      ],
      maxGuests: 1000,
      maxRevisions: 5,
      durationMonths: 6,
      includesTablet: true,
      includesCrew: 1,
      includesLiveGallery: true,
      includesPhotoBooth: false,
      includesQrCheckin: true,
      sortOrder: 2,
      isActive: true
    },
    {
      id: 'pkg-platinum',
      name: 'Signature',
      slug: 'platinum',
      price: 'Rp 2.990.000',
      priceNumeric: 2990000,
      description: 'Pendampingan lengkap untuk undangan premium dan operasional hari acara.',
      features: [
        'Semua fitur Premium',
        'Arah visual khusus',
        '2 tablet check-in',
        '2 kru pendamping',
        'Photo booth tamu',
        'Dekorasi meja tamu',
        'Musik pilihan klien'
      ],
      maxGuests: 2000,
      maxRevisions: 999,
      durationMonths: 12,
      includesTablet: true,
      includesCrew: 2,
      includesLiveGallery: true,
      includesPhotoBooth: true,
      includesQrCheckin: true,
      sortOrder: 3,
      isActive: true
    }
  ] as Package[],

  events: [
    {
      id: 'evt-1',
      ownerId: 'usr-1',
      clientId: 'usr-client-1',
      slug: 'sheila-yoga',
      coupleName: 'Sheila & Yoga',
      templateId: 'tpl-1',
      packageId: 'pkg-gold',
      packageTier: 'gold',
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
      venue: 'The Ritz-Carlton Jakarta',
      status: 'active',
      isPublished: true,
      publishedAt: now,
      expiresAt: new Date(Date.now() + 210 * 24 * 60 * 60 * 1000).toISOString(), // +6 months
      createdAt: now,
      guestCount: 250,
      rsvpYes: 180,
      rsvpNo: 15,
      wishCount: 86,
      checkInCount: 0,
      lastActivity: now
    },
    {
      id: 'evt-2',
      ownerId: 'usr-1',
      clientId: null,
      slug: 'andi-rina',
      coupleName: 'Andi & Rina',
      templateId: 'tpl-2',
      packageId: 'pkg-silver',
      packageTier: 'silver',
      eventDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Ayana Midplaza',
      status: 'draft',
      isPublished: false,
      publishedAt: null,
      expiresAt: null,
      createdAt: now,
      guestCount: 0,
      rsvpYes: 0,
      rsvpNo: 0,
      wishCount: 0,
      checkInCount: 0,
      lastActivity: now
    },
    {
      id: 'evt-3',
      ownerId: 'usr-1',
      clientId: null,
      slug: 'nadia-fajar',
      coupleName: 'Nadia & Fajar',
      templateId: 'tpl-4',
      packageId: 'pkg-platinum',
      packageTier: 'platinum',
      eventDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Past event
      venue: 'Plataran Dharmawangsa',
      status: 'completed',
      isPublished: true,
      publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
      guestCount: 400,
      rsvpYes: 350,
      rsvpNo: 30,
      wishCount: 150,
      checkInCount: 345,
      lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ] as WeddingEvent[],

  eventContents: [
    {
      eventId: 'evt-1',
      greeting: 'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan acara pernikahan putra-putri kami.',
      brideName: 'Sheila',
      bridePhotoUrl: '/demo/sheila.jpg',
      brideParent: 'Bapak Budi & Ibu Ani',
      groomName: 'Yoga',
      groomPhotoUrl: '/demo/yoga.jpg',
      groomParent: 'Bapak Santoso & Ibu Ratna',
      akadTime: '08:00 WIB',
      akadVenue: 'The Ritz-Carlton Jakarta, Grand Ballroom',
      resepsiTime: '11:00 - 14:00 WIB',
      resepsiVenue: 'The Ritz-Carlton Jakarta, Grand Ballroom',
      loveStory: [
        { title: 'Pertama Bertemu', description: 'Bertemu di acara kampus tahun 2018.' },
        { title: 'Lamaran', description: 'Yoga melamar Sheila pada liburan keluarga di Bali tahun 2023.' }
      ],
      bankAccounts: [
        { bank: 'BCA', accountNumber: '1234567890', accountName: 'Sheila' }
      ],
      musicUrl: 'https://www.bensound.com/bensound-music/bensound-romantic.mp3',
      customCss: '',
      updatedAt: now
    }
  ] as EventContent[],

  guests: [
    {
      id: 'gst-1',
      eventId: 'evt-1',
      name: 'Budi Santoso',
      phone: '081234567890',
      paxLimit: 2,
      rsvpStatus: 'attending',
      paxConfirmed: 2,
      qrCode: 'QR-gst-1',
      checkedInAt: null,
      createdAt: now
    },
    {
      id: 'gst-2',
      eventId: 'evt-1',
      name: 'Ani Yudhoyono',
      phone: '081298765432',
      paxLimit: 1,
      rsvpStatus: 'pending',
      paxConfirmed: 0,
      qrCode: 'QR-gst-2',
      checkedInAt: null,
      createdAt: now
    }
  ] as Guest[],

  wishes: [
    {
      id: 'wsh-1',
      eventId: 'evt-1',
      guestName: 'Budi Santoso',
      message: 'Selamat menempuh hidup baru! Semoga samawa.',
      isVisible: true,
      createdAt: now
    }
  ] as Wish[],

  media: [] as EventMedia[],

  profiles: [
    {
      id: 'usr-1',
      fullName: 'Occasio Owner',
      email: 'owner@occasio.app',
      role: 'owner',
      createdAt: now
    },
    {
      id: 'usr-client-1',
      fullName: 'Client Test',
      email: 'client@occasio.app',
      role: 'client',
      createdAt: now
    }
  ] as UserProfile[]
};
