"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";

interface SelectedMovie {
  id: number;
  title: string;
}

interface MovieSelectionCartProps {
  selectedMovies: SelectedMovie[];
  onRemoveMovie: (id: number) => void;
  onClearAll: () => void;
}

export default function MovieSelectionCart({
  selectedMovies,
  onRemoveMovie,
}: MovieSelectionCartProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetRecommendations = () => {
    const movieIds = selectedMovies.map((movie) => movie.id).join(",");
    router.push(`/recommendations?movies=${movieIds}`);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-semibold text-lg">Selected Movies</h2>
        <span className="text-gray-400 text-sm">
          {selectedMovies.length}/5 selected
        </span>
      </div>

      {selectedMovies.length === 0 ? (
        <p className="text-gray-400 text-sm">No movies selected</p>
      ) : (
        <>
          <ul className="space-y-2 mb-6">
            {selectedMovies.map((movie) => (
              <li
                key={movie.id}
                className="flex justify-between items-center bg-gray-700/50 rounded p-2"
              >
                <span className="text-white text-sm truncate mr-2">
                  {movie.title}
                </span>
                <button
                  onClick={() => onRemoveMovie(movie.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={handleGetRecommendations}
            disabled={selectedMovies.length < 5 || isLoading}
            className={`
              relative w-full py-4 px-6 rounded-lg
              bg-gradient-to-r from-blue-600 to-blue-500
              text-white font-semibold text-sm
              transition-all duration-300
              hover:from-blue-500 hover:to-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:from-blue-600 disabled:hover:to-blue-500
              group
              overflow-hidden
              ${selectedMovies.length === 5 ? "animate-pulse-subtle" : ""}
            `}
          >
            {/* Neon glow effect */}
            <div className="absolute inset-0 opacity-50 group-hover:opacity-75 transition-opacity duration-300">
              <div className="absolute inset-0 bg-blue-500 blur-md" />
            </div>

            {/* Button content */}
            <div className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Finding Perfect Movies...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    {selectedMovies.length === 5
                      ? "Discover Your Perfect Movies!"
                      : `Select ${5 - selectedMovies.length} More Movies`}
                  </span>
                </>
              )}
            </div>
          </button>
        </>
      )}
    </div>
  );
}
