"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const PHRASES = [
  "探索中央大學的精彩生活",
  "體驗一週校園生活模擬",
  "瀏覽完整課程資料",
  "互動式 3D 地圖",
];

export default function HomePage() {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const targetOffset = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth lerp mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetOffset.current = {
        x: (e.clientX - innerWidth / 2) / (innerWidth / 2),
        y: (e.clientY - innerHeight / 2) / (innerHeight / 2),
      };
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      setMouseOffset((prev) => ({
        x: lerp(prev.x, targetOffset.current.x, 0.07),
        y: lerp(prev.y, targetOffset.current.y, 0.07),
      }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Typewriter cycling logic
  useEffect(() => {
    const currentTarget = PHRASES[phraseIndex];
    let timer: NodeJS.Timeout;
    if (isDeleting) {
      if (displayedText.length > 0) {
        timer = setTimeout(
          () => setDisplayedText(currentTarget.slice(0, displayedText.length - 1)),
          40
        );
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
        }, 300);
      }
    } else {
      if (displayedText.length < currentTarget.length) {
        timer = setTimeout(
          () => setDisplayedText(currentTarget.slice(0, displayedText.length + 1)),
          100
        );
      } else {
        timer = setTimeout(() => setIsDeleting(true), 2400);
      }
    }
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, phraseIndex]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden select-none"
      style={{ background: "linear-gradient(145deg, #faf8ff 0%, #f3f0ff 40%, #fdf0fb 70%, #faf8ff 100%)" }}
    >
      {/* ── Layer 1: Vivid Aurora Blobs（淺色底需要更高飽和度的光暈） ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Violet — top-left */}
        <div
          className="absolute -top-[18%] -left-[8%] w-[640px] h-[640px] rounded-full will-change-transform animate-fluid-1"
          style={{
            background: "radial-gradient(circle, rgba(167,139,250,0.55) 0%, rgba(139,92,246,0.30) 40%, transparent 70%)",
            filter: "blur(72px)",
          }}
        />
        {/* Rose / Fuchsia — top-right */}
        <div
          className="absolute -top-[10%] -right-[8%] w-[560px] h-[560px] rounded-full will-change-transform animate-fluid-2"
          style={{
            background: "radial-gradient(circle, rgba(232,121,249,0.42) 0%, rgba(192,38,211,0.20) 45%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Indigo / Blue — bottom-left */}
        <div
          className="absolute -bottom-[20%] -left-[5%] w-[600px] h-[560px] rounded-full will-change-transform animate-fluid-3"
          style={{
            background: "radial-gradient(circle, rgba(129,140,248,0.40) 0%, rgba(99,102,241,0.18) 50%, transparent 72%)",
            filter: "blur(85px)",
          }}
        />
        {/* Soft lavender — bottom-right */}
        <div
          className="absolute bottom-[-8%] right-[-4%] w-[440px] h-[440px] rounded-full will-change-transform animate-fluid-2"
          style={{
            background: "radial-gradient(circle, rgba(196,181,253,0.38) 0%, transparent 68%)",
            filter: "blur(70px)",
            animationDelay: "-12s",
          }}
        />
      </div>

      {/* ── Layer 2: Cursor glow ── */}
      {cursorPos && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: `radial-gradient(500px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(167,139,250,0.14), rgba(192,38,211,0.05), transparent 65%)`,
          }}
        />
      )}

      {/* ── Layer 3: Dot grid with radial vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          maskImage: "radial-gradient(ellipse 88% 82% at 50% 48%, black 25%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 88% 82% at 50% 48%, black 25%, transparent 100%)",
        }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1.1" fill="rgba(109,40,217,0.14)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* ── Layer 4: Hero content ── */}
      <div
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.85s ease, transform 0.85s ease",
        }}
      >
        {/* Eyebrow badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-8 font-medium"
          style={{
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.18)",
            color: "rgba(109,40,217,0.75)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          國立中央大學
        </div>

        {/* Title — parallax + gentle float, deep purple-to-stone gradient */}
        <div
          className="animate-title-float will-change-transform"
          style={{
            transform: `translate3d(${mouseOffset.x * 20}px, ${mouseOffset.y * 14}px, 0)`,
          }}
        >
          <h1
            className="text-6xl sm:text-7xl md:text-8xl font-semibold tracking-tight leading-none pb-2"
            style={{
              background: "linear-gradient(135deg, #1e1035 0%, #4c1d95 35%, #6d28d9 60%, #374151 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            NCU Explorer
          </h1>
        </div>

        {/* Typewriter subtitle */}
        <div className="h-9 sm:h-11 flex items-center justify-center mt-6 mb-12">
          <p className="text-lg sm:text-xl font-normal text-stone-600 tracking-wide flex items-center">
            <span>{displayedText}</span>
            <span
              className="inline-block w-[2px] h-[1.1em] bg-violet-500 ml-1 align-middle cursor-blink"
              aria-hidden="true"
            />
          </p>
        </div>

        {/* Primary CTA — purple gradient pill with glow */}
        <Link
          href="/simulator"
          className="group relative inline-flex items-center justify-center px-11 py-3.5 rounded-full text-white font-medium text-base sm:text-lg cursor-pointer overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)",
            boxShadow: "0 4px 24px rgba(109,40,217,0.25), 0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          {/* Hover sheen */}
          <span className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/8 to-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
          {/* Hover bottom glow */}
          <span
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-xl"
            style={{ background: "rgba(109,40,217,0.5)" }}
          />
          <span className="relative z-10 tracking-wide">開始模擬</span>
        </Link>

        {/* Secondary link */}
        <Link
          href="/explore"
          className="mt-5 font-normal text-sm sm:text-base tracking-wide transition-colors duration-300 py-1 cursor-pointer"
          style={{ color: "rgba(109,40,217,0.5)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(109,40,217,0.85)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(109,40,217,0.5)")}
        >
          瀏覽中央大學相關資料 →
        </Link>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 w-full py-5 px-6 text-xs text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto">
        <span>© 2026 國立中央大學 NCU Explorer</span>
        <div className="flex items-center gap-5">
          <Link href="/explore" className="hover:text-stone-600 transition-colors">相關資料</Link>
          <Link href="/simulator" className="hover:text-stone-600 transition-colors">生活模擬</Link>
          <Link href="/admin/dashboard" className="hover:text-stone-600 transition-colors">管理後台</Link>
        </div>
      </footer>
    </div>
  );
}
