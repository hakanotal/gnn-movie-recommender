"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface MoviePosterProps {
  id: number;
  title: string;
  score?: number;
}

export default function MoviePoster({ id, title, score }: MoviePosterProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getTitleClass = (title: string) => {
    if (title.length > 30) return "text-xs";
    if (title.length > 20) return "text-sm";
    return "text-base";
  };

  useEffect(() => {
    const fetchPoster = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/movies/${id}/poster`
        );
        if (response.ok) {
          const blob = await response.blob();
          if (posterUrl) {
            URL.revokeObjectURL(posterUrl);
          }
          const url = URL.createObjectURL(blob);
          setPosterUrl(url);
        }
      } catch (err) {
        console.error(`Failed to fetch poster for movie ${id}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchPoster();

    return () => {
      if (posterUrl) {
        URL.revokeObjectURL(posterUrl);
      }
    };
  }, [id]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      {score !== undefined && (
        <div className="absolute top-2 right-2 z-10 bg-black/80 text-white px-2 py-1 rounded-full text-sm font-bold">
          {Math.round(score * 100)}%
        </div>
      )}
      <div className="relative w-full pt-[150%]">
        {loading ? (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400">Loading...</span>
          </div>
        ) : posterUrl ? (
          <Image
            src={posterUrl}
            alt={`${title} poster`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400">No poster available</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3
          className={`font-semibold text-white truncate ${getTitleClass(
            title
          )}`}
          title={title}
        >
          {title}
        </h3>
      </div>
    </div>
  );
}
