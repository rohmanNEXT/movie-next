import Link from "next/link";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

import { LuPlay, LuVolume2, LuVolumeX, LuX } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";

type Movie = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  trailerId: string | null;
  genre?: { name: string } | null;
};

type HeroProps = {
  movies: Movie[];
};

const Hero: React.FC<HeroProps> = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("hero-video-muted");
      return saved === "true";
    }
    return false;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);

  const heroRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ===== vidio control =====
  const controlVideo = useCallback((action: "play" | "pause" | "mute" | "unmute") => {
    if (!iframeRef.current) return;

    const map = {
      play: "playVideo",
      pause: "pauseVideo",
      mute: "mute",
      unmute: "unMute",
    };

    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: map[action],
        args: [],
      }),
      "*"
    );
  }, []);

  // Sync state in render body to prevent cascading renders
  if (isModalOpen && isPreviewMode) {
    setIsPreviewMode(false);
  }

  // Control background video when modal opens
  useEffect(() => {
    if (isModalOpen) {
      controlVideo("pause");
    }
  }, [isModalOpen, controlVideo]);

useEffect(() => {
  const frame = requestAnimationFrame(() => setMounted(true));
  return () => cancelAnimationFrame(frame);
}, []);

  // detect hero 50%
  useEffect(() => {
    const currentHero = heroRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.intersectionRatio >= 0.5);
      },
      { threshold: [0.5] }
    );

    if (currentHero) observer.observe(currentHero);
    return () => {
      if (currentHero) observer.unobserve(currentHero);
    };
  }, []);

  // scroll > 50% → kembali ke image
  useEffect(() => {
    if (!isHeroVisible || isModalOpen) {
      controlVideo("pause");
    }
  }, [isHeroVisible, isModalOpen, controlVideo]);

  // Sync isPreviewMode based on visibility
  if (!isHeroVisible && isPreviewMode) {
    setIsPreviewMode(false);
  }

  // toggle mute
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem("hero-video-muted", String(newMuted));
    controlVideo(newMuted ? "mute" : "unmute");
  };

  const movie = movies[currentIndex];

  const nextSlide = useCallback(() => {
    controlVideo("pause");
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setIsPreviewMode(false);
  }, [movies.length, controlVideo]);

  const prevSlide = useCallback(() => {
    controlVideo("pause");
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setIsPreviewMode(false);
  }, [movies.length, controlVideo]);

  // auto preview
  useEffect(() => {
    if (!isHeroVisible || isDragging || isModalOpen) return;

    const previewTimeout = setTimeout(() => {
      setIsPreviewMode(true);

      setTimeout(() => {
        controlVideo("play");
        controlVideo(isMuted ? "mute" : "unmute");
      }, 500);

      const innerSlideTimeout = setTimeout(() => {
        nextSlide();
      }, 17000);

      return () => clearTimeout(innerSlideTimeout);
    }, 7000);

    return () => {
      clearTimeout(previewTimeout);
    };
  }, [currentIndex, isHeroVisible, isDragging, isMuted, nextSlide, controlVideo, isModalOpen]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
    setIsDragging(false);
    const threshold = 100;
    if (info.offset.x < -threshold) nextSlide();
    else if (info.offset.x > threshold) prevSlide();
  };

  if (!movie) {
    return (
      <div className="relative h-[70vh] sm:h-[80vh] md:h-[90vh] lg:h-[96vh] w-full bg-white/2 flex flex-col items-center justify-center text-white/20 text-sm font-semibold uppercase tracking-widest border-b border-white/5 backdrop-blur-xl">
        <span className="text-3xl mb-3">🎬</span>
        Data Kosong
      </div>
    );
  }

  return (
    <div
      ref={heroRef}
      className="relative h-[70vh] sm:h-[80vh] md:h-[90vh] lg:h-[96vh] w-full overflow-hidden bg-black"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`image-${currentIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          {movie.image ? (
            <Image
              src={movie.image}
              alt={movie.title}
              fill
              className="object-cover pointer-events-none select-none"
            />
          ) : (
            <div className="w-full h-full bg-white/5" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* OVERLAY */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-t from-brand-dark via-brand-dark/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 backdrop-blur-[2px] mask-[linear-gradient(to_top,black,transparent)]" />
      </div>

      {/* TEXT */}
      <div className="absolute bottom-20 md:bottom-28 left-6 md:left-12 lg:left-20 xl:left-28 right-6 md:right-auto max-w-2xl space-y-6 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white/80 mb-5 leading-[1.1] drop-shadow-2xl">
              {movie.title}
            </h1>

            <p className="text-xs md:text-sm text-white/50 line-clamp-2 md:line-clamp-3 mb-6 leading-relaxed max-w-md md:max-w-lg drop-shadow-md font-medium">
              {movie.description || ''}
            </p>

            <div className="flex flex-row items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 md:px-6 py-2 md:py-2.5 bg-white/90 text-black/80 hover:bg-white/90 rounded-full font-semibold flex items-center justify-center gap-2 transition-all text-xs md:text-sm shadow-xl active:scale-95 cursor-pointer"
              >
                <LuPlay size={16} />
                Trailer
              </button>
              <Link
                href={`/movie/${movie.id}`}
                className="px-5 md:px-6 py-2 md:py-2.5 bg-white/10 backdrop-blur-3xl hover:bg-white/20 text-white/80 border border-white/20 rounded-full font-semibold flex items-center justify-center gap-2 transition-all text-xs md:text-sm active:scale-95 cursor-pointer"
              >
                <LuPlay size={16} />
                Tonton
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* DOT */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              controlVideo("pause");
              setCurrentIndex(index);
              setIsPreviewMode(false);
            }}
            className={`w-2.5 h-2.5 transition-all duration-500 rounded-full cursor-pointer ${
              index === currentIndex
                ? "bg-white/80 scale-110"
                : "bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* BUTTON SUARA */}
      <div className="absolute bottom-8 md:bottom-16 right-6 md:right-12 lg:right-20 xl:right-28 z-20">
        <button
          onClick={toggleMute}
          className="p-2 md:p-2.5 bg-white/10 backdrop-blur-2xl hover:bg-white/20 border border-white/10 rounded-full text-white/80 transition-all cursor-pointer"
        >
          {mounted ? isMuted ? <LuVolumeX size={18} /> : <LuVolume2 size={18} /> : <LuVolume2 size={18} />}
        </button>
      </div>

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={movie.title}>
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 flex items-center justify-center">
          {movie.trailerId ? (
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailerId}?autoplay=1`}
              title={movie.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-white/40 text-sm flex flex-col items-center gap-2">
              <span className="text-2xl">🎬</span>
              <span>Trailer tidak tersedia</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Hero;