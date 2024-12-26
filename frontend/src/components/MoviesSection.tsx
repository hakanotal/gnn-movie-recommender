"use client";

import { useEffect, useState, useCallback } from "react";
import MovieCard from "./MovieCard";
import Pagination from "./Pagination";
import YearFilter from "./YearFilter";
import MovieSelectionCart from "./MovieSelectionCart";
import SearchBox from "./SearchBox";
import Spinner from "./Spinner";

interface Movie {
  id: number;
  title: string;
  year: string;
  genres: string;
  imdb_id?: string;
  tmdb_id?: number;
}

interface MovieResponse {
  movies: Movie[];
  total: number;
  pages: number;
}

interface SelectedMovie {
  id: number;
  title: string;
}

export default function MoviesSection() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedYear, setSelectedYear] = useState("");
  const ITEMS_PER_PAGE = 16;
  const [selectedMovies, setSelectedMovies] = useState<SelectedMovie[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // You might want to fetch this from the backend or hardcode a range
  const availableYears = Array.from({ length: 2018 - 1902 + 1 }, (_, i) =>
    (1902 + i).toString()
  ).reverse();

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const yearParam = selectedYear ? `&year=${selectedYear}` : "";
      const searchParam = searchTerm
        ? `&search=${encodeURIComponent(searchTerm)}`
        : "";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/movies?skip=${skip}&limit=${ITEMS_PER_PAGE}${yearParam}${searchParam}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }
      const data: MovieResponse = await response.json();
      setMovies(data.movies);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch movies");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedYear, searchTerm]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setCurrentPage(1);
      fetchMovies();
    },
    [fetchMovies]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setCurrentPage(1); // Reset to first page when changing year
  };

  const handleMovieSelect = (movie: { id: number; title: string }) => {
    if (selectedMovies.length < 5) {
      setSelectedMovies([...selectedMovies, movie]);
    }
  };

  const handleMovieDeselect = (movieId: number) => {
    setSelectedMovies(selectedMovies.filter((m) => m.id !== movieId));
  };

  const handleClearSelection = () => {
    setSelectedMovies([]);
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-8">
        <div className="w-full p-4 bg-gray-800/50 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <YearFilter
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
              availableYears={availableYears}
            />
            <SearchBox searchTerm={searchTerm} onSearch={handleSearch} />
          </div>
          <div className="flex justify-center w-full pt-4 bg-gray-800/50 rounded-lg">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  isSelected={selectedMovies.some((m) => m.id === movie.id)}
                  onSelect={() => handleMovieSelect(movie)}
                  onDeselect={() => handleMovieDeselect(movie.id)}
                  disabled={selectedMovies.length >= 5}
                />
              ))}
            </div>

            <div className="flex justify-center w-full p-4 bg-gray-800/50 rounded-lg">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:block w-80 sticky top-8 self-start">
        <MovieSelectionCart
          selectedMovies={selectedMovies}
          onRemoveMovie={handleMovieDeselect}
          onClearAll={handleClearSelection}
        />
      </div>
    </div>
  );
}
