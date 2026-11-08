"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClubExplorerView } from "@/components/clubs/ClubExplorerView";

export default function ClubsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:py-10">
      <Link
        href="/explore"
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:border-violet-300 hover:text-violet-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        回到中大資訊
      </Link>
      <ClubExplorerView isEmbedded={false} />
    </div>
  );
}
