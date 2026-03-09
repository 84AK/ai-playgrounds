"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageCarouselProps {
    images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return null; // Return nothing if no images are provided
    }

    const nextImage = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    const goToImage = (index: number) => {
        setCurrentIndex(index);
    };

    // Helper to safely convert Google Drive URLs into embeddable direct links
    const convertGoogleDriveUrl = (url: string) => {
        const trimmed = url.trim();
        // Match drive.google.com/uc?id=... or drive.google.com/file/d/.../view
        const ucMatch = trimmed.match(/drive\.google\.com\/uc\?.*?id=([^&/]+)/);
        const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);

        const id = (ucMatch && ucMatch[1]) || (fileMatch && fileMatch[1]);
        if (id) {
            return `https://lh3.googleusercontent.com/d/${id}`;
        }
        return trimmed;
    };

    return (
        <div className="relative group w-full rounded-[24px] overflow-hidden border border-white/8 bg-[#0a1122] shadow-[0_12px_40px_rgba(0,0,0,0.18)] aspect-video my-8">
            {/* The Images */}
            <div className="relative w-full h-full flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {images.map((src, index) => (
                    <div key={index} className="relative w-full h-full shrink-0 flex items-center justify-center">
                        {/* Use object-contain or object-cover based on design preference. Defaulting to object-contain for full image visibility */}
                        <img
                            src={convertGoogleDriveUrl(src)}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-contain"
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Buttons (shown on hover) */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60 focus:outline-none"
                        aria-label="이전 이미지"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60 focus:outline-none"
                        aria-label="다음 이미지"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>

                    {/* Pagination Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToImage(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? "bg-white w-4"
                                    : "bg-white/40 hover:bg-white/60"
                                    }`}
                                aria-label={`${index + 1}번 이미지로 이동`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
