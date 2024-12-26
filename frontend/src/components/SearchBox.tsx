"use client";

interface SearchBoxProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

export default function SearchBox({ searchTerm, onSearch }: SearchBoxProps) {
  return (
    <div className="flex-1 sm:max-w-xs">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search movies..."
          className="w-full bg-gray-800 text-white rounded-md px-3 py-2 pl-9 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}
