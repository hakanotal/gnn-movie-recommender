export default function Spinner({
  className = "h-32 w-32",
}: {
  className?: string;
}) {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-white ${className}`}
      />
    </div>
  );
}
