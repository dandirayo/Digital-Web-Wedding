"use client";

import { useEffect, useRef } from "react";

/**
 * Efek muncul saat scroll untuk elemen bertanda data-reveal (angka = urutan stagger).
 *
 * Aman untuk undangan: elemen yang sudah terlihat saat dimuat tidak pernah disembunyikan, kelas
 * `reveal-ready` baru ditambahkan lewat JS setelah mount (tanpa JS konten tetap tampil penuh),
 * dan pengguna dengan "kurangi gerakan" tidak mendapat efek apa pun. Memakai IntersectionObserver,
 * bukan listener scroll, sehingga tidak membebani HP.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        // Elemen yang terlewati (loncat scroll, anchor) dan kini berada di atas layar ikut ditampilkan.
        if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });

    const viewport = window.innerHeight;
    for (const element of Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))) {
      if (element.getBoundingClientRect().top < viewport * 0.92) {
        // Sudah terlihat saat dimuat: biarkan tampil, jangan menyembunyikannya lalu memunculkan lagi.
        if (element.classList.contains("reveal-ready")) element.classList.add("is-visible");
        continue;
      }
      element.style.setProperty("--i", element.dataset.reveal || "0");
      element.classList.add("reveal-ready");
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return ref;
}
