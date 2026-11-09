import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-drift absolute -top-24 -left-24 h-96 w-96 rounded-full bg-violet-200/60 blur-3xl" />
        <div className="animate-drift-slow absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-purple-200/50 blur-3xl" />
      </div>

      <main className="relative flex flex-col items-center text-center">
        <Image
          src="/favicon.svg"
          alt="NCU Explorer logo"
          width={112}
          height={112}
          priority
          className="animate-rise h-20 w-20 drop-shadow-lg"
        />
        <h1 className="animate-rise delay-1 mt-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
          <span className="gradient-text">NCU Explorer</span>
        </h1>
        <p className="animate-rise delay-2 mt-4 text-base text-stone-600 sm:text-lg">國立中央大學 · 智慧校園平台</p>

        <div className="animate-rise delay-3 mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/simulator"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-9 py-4 text-base font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700"
          >
            開始模擬
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-9 py-4 text-base font-semibold text-violet-700 transition hover:border-violet-400 hover:bg-violet-50"
          >
            <Info className="h-4 w-4" />
            查看中大資訊
          </Link>
        </div>
      </main>
    </div>
  );
}
