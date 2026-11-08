import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function InfoPageShell({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
  wide = false,
}: {
  icon: ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`mx-auto flex min-h-screen w-full flex-col gap-8 px-4 py-6 sm:px-6 md:py-10 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
      <Link
        href="/explore"
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:border-violet-300 hover:text-violet-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        回到中大資訊
      </Link>

      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
          <p className="mt-1.5 text-sm text-stone-600">{subtitle}</p>
        </div>
      </header>

      {children}
    </div>
  );
}
