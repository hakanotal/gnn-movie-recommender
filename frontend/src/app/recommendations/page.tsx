"use client";

import MoviePoster from "@/components/MoviePoster";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";

interface Movie {
  id: number;
  title: string;
}

interface RecommendationResult {
  movieId: number;
  score: number;
}

interface RecommendedMovie extends Movie {
  score: number;
}

export default function RecommendationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedMovie[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async (movieId: number) => {
      const response = await fetch(`http://localhost:8000/movies/${movieId}`);
      if (!response.ok) throw new Error(`Failed to fetch movie ${movieId}`);
      return response.json();
    };

    const getRecommendations = async () => {
      setLoading(true);
      try {
        const movieIds =
          searchParams.get("movies")?.split(",").map(Number) || [];
        if (movieIds.length === 0) throw new Error("No movies selected");

        // Fetch movie details for selected movies
        const moviesData = await Promise.all(movieIds.map(fetchMovieDetails));
        setSelectedMovies(moviesData);

        // Get recommendations
        const recsResponse = await fetch("http://localhost:8000/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ known_movies: movieIds, top_k: 5 }),
        });

        if (!recsResponse.ok) throw new Error("Failed to get recommendations");
        const recsData = await recsResponse.json();

        // Fetch details for recommended movies
        const recommendedMoviesData = await Promise.all(
          recsData.recommendations.map(
            async (rec: { movieId: number; score: any }) => {
              const movieDetails = await fetchMovieDetails(rec.movieId);
              return {
                ...movieDetails,
                score: rec.score,
              };
            }
          )
        );

        setRecommendations(recommendedMoviesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    getRecommendations();
  }, [searchParams]);

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Movie Selection
          </button>
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-6">Recommended Movies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {recommendations.map((movie) => (
              <MoviePoster
                key={movie.id}
                id={movie.id}
                title={movie.title}
                score={movie.score}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Movies You Selected</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {selectedMovies.map((movie) => (
              <MoviePoster key={movie.id} id={movie.id} title={movie.title} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
