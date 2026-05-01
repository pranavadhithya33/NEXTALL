"use client";

import { useState } from 'react';
import Image from 'next/image';

export function ProductGallery({ images, name }: { images: string[], name: string }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images?.length) {
    return (
      <div className="aspect-square bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
        <span className="text-gray-500">No image available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-white rounded-3xl overflow-hidden border-2 border-white/10 group">
        <Image 
          src={images[activeIdx]} 
          alt={name} 
          fill 
          className="object-contain p-8 group-hover:scale-110 transition-transform duration-500" 
          unoptimized 
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-white ${
                activeIdx === i ? 'border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img} alt={`Thumbnail ${i}`} fill className="object-contain p-2" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
