"use client";

import { Suspense } from "react";
import RecommendationsContent from "@/components/RecommendationsContent";
import Spinner from "@/components/Spinner";

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
}
