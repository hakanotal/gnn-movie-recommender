"use client";

interface YearFilterProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
  availableYears: string[];
}

export default function YearFilter({
  selectedYear,
  onYearChange,
  availableYears,
}: YearFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
      <label
        htmlFor="year-filter"
        className="text-white font-medium whitespace-nowrap"
      >
        Filter by Year:
      </label>
      <select
        id="year-filter"
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        className="w-full sm:w-auto bg-gray-800 text-white rounded-md px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Years</option>
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
