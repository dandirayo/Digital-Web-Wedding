/* eslint-disable @next/next/no-img-element */
// Foto undangan berasal dari unggahan owner atau URL https yang tidak dapat diketahui saat build,
// sehingga next/image tidak dapat mengoptimalkannya. Satu pembungkus ini menggantikan <img> mentah di tema.
import type { ImgHTMLAttributes } from "react";

export function MediaImage({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  return <img alt={alt} loading="lazy" decoding="async" {...props} />;
}
