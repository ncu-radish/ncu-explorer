"use client";

import { CourseExplorerView } from "@/components/courses/CourseExplorerView";

export default function CoursesPage() {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6 bg-[#FAF8F5] min-h-screen">
      <CourseExplorerView isEmbedded={false} />
    </div>
  );
}
