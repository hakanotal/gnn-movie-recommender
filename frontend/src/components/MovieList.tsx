"use client";

import { useState } from "react";

interface Movie {
  id: number;
  title: string;
  rating: number;
}

export default function MovieList() {
  const [recommendations] = useState<Movie[]>([]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Recommended Movies</h2>
      {recommendations.length === 0 ? (
        <p className="text-gray-500">
          No recommendations yet. Please rate some movies first.
        </p>
      ) : (
        <ul className="space-y-4">
          {recommendations.map((movie) => (
            <li key={movie.id} className="border-b pb-2">
              <h3 className="font-medium">{movie.title}</h3>
              <p className="text-sm text-gray-600">Rating: {movie.rating}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
