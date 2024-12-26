"use client";

import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import Image from "next/image";

interface MovieCardProps {
  id: number;
  title: string;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  disabled: boolean;
}

export default function MovieCard({
  id,
  title,
  isSelected,
  onSelect,
  onDeselect,
  disabled,
}: MovieCardProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate font size class based on title length
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
    <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
      <button
        onClick={isSelected ? onDeselect : onSelect}
        disabled={disabled && !isSelected}
        className={`absolute top-2 right-2 z-10 p-1 rounded-full 
          ${
            isSelected
              ? "bg-blue-600 text-white"
              : "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
          }
          ${disabled && !isSelected ? "opacity-50 cursor-not-allowed" : ""}
        `}
        title={
          disabled && !isSelected
            ? "Maximum 5 movies can be selected"
            : isSelected
            ? "Remove from selection"
            : "Add to selection"
        }
      >
        {isSelected ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
      <div className="relative w-full pt-[150%]">
        {" "}
        {/* 2:3 aspect ratio container */}
        {loading ? (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <Spinner className="h-8 w-8" />
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
          title={title} // Shows full title on hover
        >
          {title}
        </h3>
      </div>
    </div>
  );
}
