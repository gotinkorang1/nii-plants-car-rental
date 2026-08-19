"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { marketingImages } from "@/lib/content/marketing-images";
import type { MarketingImage } from "@/lib/content/marketing-images";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLIDES: { image: MarketingImage; objectPosition: string }[] = [
  { image: marketingImages.keys, objectPosition: "center 20%" },
  { image: marketingImages.chauffeur, objectPosition: "center 40%" },
  { image: marketingImages.driving, objectPosition: "center center" },
  { image: marketingImages.airport, objectPosition: "center 30%" },
];

const INTERVAL_MS = 6000;

const trustMarks = [
  { title: "Accra since 2007", detail: "Ghanaian-owned" },
  { title: "GTA awards", detail: "2022 & 2024" },
  { title: "Kotoka pickup", detail: "Until 23:00" },
] as const;

export function HeroCarousel({
  headline,
  subheadline,
}: {
  headline?: string;
  subheadline?: string;
}) {
  const [current, setCurrent] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setTextVisible(false);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
      setTextVisible(true);
    }, 600);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(advance, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance]);

  return (
    <section
      className="relative isolate -mt-16 overflow-hidden"
      aria-label="Hero"
    >
      {/* Background images with crossfade */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.image.src}
          aria-hidden
          className={cn(
            "absolute inset-0 transition-opacity duration-[1200ms] ease-in-out",
            index === current ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={slide.image.src}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className={cn(
              "object-cover",
              index === current && "animate-hero-ken-burns",
            )}
            style={{ objectPosition: slide.objectPosition }}
          />
        </div>
      ))}

      {/* Copper top accent */}
      <div
        className="absolute inset-x-0 top-0 z-10 h-[3px] bg-accent"
        aria-hidden
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,26,24,0.88)_0%,rgba(36,88,68,0.52)_50%,rgba(24,26,24,0.32)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/40 to-transparent" />

      {/* Ambient glows */}
      <div
        className="absolute top-20 right-[10%] h-56 w-56 rounded-full bg-accent/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="absolute bottom-24 left-[5%] h-40 w-64 rounded-full bg-primary/[0.10] blur-3xl"
        aria-hidden
      />

      {/* Content */}
      <div className="relative mx-auto flex min-h-[34rem] max-w-6xl flex-col justify-end px-4 pb-12 pt-28 sm:min-h-[38rem] sm:px-6 sm:pb-16 sm:pt-32 lg:min-h-[42rem] lg:pt-36">
        <div className="max-w-2xl space-y-5 sm:space-y-6">
          {/* Eyebrow */}
          <p
            className={cn(
              "flex items-center gap-2.5 text-sm font-medium tracking-[0.16em] text-accent uppercase transition-all duration-700",
              textVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0",
            )}
          >
            <span className="h-px w-8 bg-accent" aria-hidden />
            Car rental in Accra since 2007
          </p>

          {/* Headline */}
          <h1
            className={cn(
              "font-heading text-4xl leading-[1.08] tracking-tight text-white transition-all duration-700 delay-100 sm:text-5xl lg:text-6xl",
              textVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            {headline || "Rent a car in Accra — self-drive or chauffeur"}
          </h1>

          {/* Subheadline */}
          <p
            className={cn(
              "max-w-xl text-base leading-relaxed text-white/80 transition-all duration-700 delay-200 sm:text-lg",
              textVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            {subheadline ||
              "Sedans, SUVs, 4x4s and vans from Plantsville, Dansoman. Kotoka pickup by arrangement. GTA car-rental awards in 2022 and 2024."}
          </p>

          {/* CTAs */}
          <div
            className={cn(
              "flex flex-col gap-2.5 pt-1 transition-all duration-700 delay-300 sm:flex-row",
              textVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            <Button
              asChild
              size="lg"
              className="h-12 px-6 text-base shadow-lg shadow-primary/20"
            >
              <Link href="/book">Book a Vehicle</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base border-white/30 bg-white/10 text-white shadow-lg shadow-black/10 backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              <Link href="/fleet">View the fleet</Link>
            </Button>
          </div>
        </div>

        {/* Trust marks + slide indicators */}
        <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:items-end sm:justify-between">
          <ul
            className={cn(
              "flex flex-wrap gap-3 transition-all duration-700 delay-[400ms]",
              textVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0",
            )}
          >
            {trustMarks.map((mark) => (
              <li
                key={mark.title}
                className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm shadow-sm backdrop-blur-lg"
              >
                <span className="font-medium text-white">{mark.title}</span>
                <span className="ml-1.5 text-white/60">{mark.detail}</span>
              </li>
            ))}
          </ul>

          {/* Slide indicator dots */}
          <div className="flex gap-2" role="tablist" aria-label="Hero slides">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === current}
                aria-label={`Slide ${index + 1}`}
                className={cn(
                  "relative h-1.5 overflow-hidden rounded-full transition-all duration-500",
                  index === current
                    ? "w-8 bg-white/30"
                    : "w-1.5 bg-white/25 hover:bg-white/40",
                )}
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setTextVisible(false);
                  setTimeout(() => {
                    setCurrent(index);
                    setTextVisible(true);
                  }, 600);
                  timerRef.current = setInterval(advance, INTERVAL_MS);
                }}
              >
                {index === current && (
                  <span
                    className="absolute inset-y-0 left-0 bg-accent animate-hero-progress"
                    style={{ animationDuration: `${INTERVAL_MS}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
