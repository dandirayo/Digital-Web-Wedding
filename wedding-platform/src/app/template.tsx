// Dipasang ulang pada setiap navigasi: transisi halaman halus (hanya opacity, lihat .anim-page di globals.css).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-page flex min-h-full flex-1 flex-col">{children}</div>;
}
