"use client";
import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MovieRow from '@/components/movie-ui/MovieRow';
import { Star, Play, Plus, ChevronLeft, ExternalLink, X, Check, PauseCircle, PlayCircle, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieStore } from '@/store/feature/movie';
import { useAuthStore } from '@/store/feature/auth';
import { useRouter } from 'next/navigation';

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentMovie: movie, myList, loading: storeLoading, getMovie, toggleMyList, clearCurrentMovie, recordMovieView } = useMovieStore();
  const user = useAuthStore((state) => state.user);
  const isSubscribed = !!user?.subscription?.isActive;

  const isInMyList = movie ? myList.includes(movie.id) : false;

  const [imgSrc, setImgSrc] = useState('');
  const [prevMovieId, setPrevMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPaused, setIsPaused] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('movie_isPaused') === 'true';
    return false;
  });
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('movie_isMuted') === 'true';
    return false;
  });

  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const controlVideo = (command: 'playVideo' | 'pauseVideo') => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        '*'
      );
    }
  };

  const controlVolume = (command: 'mute' | 'unMute') => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        '*'
      );
    }
  };

  const togglePlayPause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    localStorage.setItem('movie_isPaused', String(newPaused));
    if (!isPreviewMode) {
      setIsPreviewMode(true);
    } else {
      if (newPaused) controlVideo('pauseVideo');
      else controlVideo('playVideo');
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('movie_isMuted', String(newMuted));
    if (!isPreviewMode) {
      setIsPreviewMode(true);
    } else {
      if (newMuted) controlVolume('mute');
      else controlVolume('unMute');
    }
  };

  const [latchedSrc, setLatchedSrc] = useState<string | null>(null);
  const [latchedPreviewMode, setLatchedPreviewMode] = useState<boolean>(false);

  // Sync image source when movie changes
  if (movie && movie.id !== prevMovieId) {
    setPrevMovieId(movie.id);
    setImgSrc(movie.image || '');
    if (isPreviewMode) setIsPreviewMode(false);
  }

  const currentComputedSrc = movie?.trailerId ? `https://www.youtube.com/embed/${movie.trailerId}?autoplay=${isPaused ? '0' : '1'}&mute=${isMuted ? '1' : '0'}&loop=1&playlist=${movie.trailerId}&controls=0&showinfo=0&rel=0&enablejsapi=1&modestbranding=1&iv_load_policy=3` : '';

  if (isPreviewMode !== latchedPreviewMode) {
    setLatchedPreviewMode(isPreviewMode);
    setLatchedSrc(isPreviewMode ? currentComputedSrc : null);
  }

  const iframeSrc = isPreviewMode ? latchedSrc || currentComputedSrc : currentComputedSrc;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      getMovie(id);
      recordMovieView(id); // Track view for trending
    }
    return () => {
      clearCurrentMovie();
    };
  }, [id, getMovie, recordMovieView, clearCurrentMovie]);

  useEffect(() => {
    if (!movie?.trailerId || isModalOpen) return;

    const timer = setTimeout(() => {
      if (!isModalOpen) {
        setIsPreviewMode(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, movie?.trailerId, isModalOpen]);

  useEffect(() => {
    if (isModalOpen && isPreviewMode) {
      controlVideo('pauseVideo');
    }
  }, [isModalOpen, isPreviewMode]);

  if (storeLoading || !movie) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-brand-dark text-white">
      <Navbar />

      <div className="relative w-full h-[85vh] md:h-screen bg-black overflow-hidden">
        <AnimatePresence mode="wait">
          {isPreviewMode && movie.trailerId ? (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-full h-full relative z-0 overflow-hidden">
                <iframe
                  ref={iframeRef}
                  width="100%"
                  height="100%"
                  src={iframeSrc || undefined}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full object-cover opacity-60 scale-[1.35] translate-y-[4%]"
                ></iframe>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="w-full h-full relative"
            >
              <img
                src={imgSrc || undefined}
                alt={movie.title}
                className="w-full h-full object-cover opacity-50 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 bg-linear-to-t from-brand-dark via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-12 lg:p-20 xl:p-28 space-y-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-5 text-sm font-medium cursor-pointer">
              <ChevronLeft size={16} /> Kembali
            </Link>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-white/80 mb-6 leading-tight drop-shadow-2xl">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm mb-7 text-white/80 font-medium">
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Star size={16} fill="currentColor" />
                <span className="font-semibold text-white/80">{movie.rating ?? 0}/5</span>
              </div>
              <span className="opacity-30">|</span>
              <span>{movie.year}</span>
              <span className="opacity-30">|</span>
              <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                {movie.category}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isSubscribed ? (
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    if (isPreviewMode) {
                      setIsPaused(true);
                    }
                  }}
                  className="px-5 md:px-6 py-2 md:py-2.5 bg-white/90 text-black/80 rounded-full font-semibold hover:bg-white transition-all active:scale-95 flex items-center gap-2 text-xs md:text-sm shadow-xl cursor-pointer"
                >
                  <Play size={18} fill="black" /> Nonton Sekarang
                </button>
              ) : (
                <button
                  onClick={() => router.push('/subscribe')}
                  className="px-5 md:px-6 py-2 md:py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-semibold transition-all active:scale-95 flex items-center gap-2 text-xs md:text-sm shadow-xl shadow-purple-900/20 cursor-pointer"
                >
                  <Play size={18} fill="white" /> Langganan untuk Menonton
                </button>
              )}

              <button
                onClick={() => movie && toggleMyList(movie.id)}
                className={`px-5 md:px-6 py-2 md:py-2.5 rounded-full font-semibold transition-all active:scale-95 flex items-center gap-2 text-xs md:text-sm border backdrop-blur-3xl cursor-pointer ${
                  isInMyList
                    ? 'bg-purple-600/10 border-white/20 text-white shadow-lg shadow-purple-900/20'
                    : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                }`}
              >
                {isInMyList ? <Check size={16} /> : <Plus size={16} />}
                {isInMyList ? 'Daftar Saya' : 'Daftar'}
              </button>
            </div>
          </motion.div>
        </div>

        {movie.trailerId && (
          <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 lg:bottom-20 lg:right-20 xl:bottom-28 xl:right-28 z-20 flex gap-3">
            <button
              onClick={toggleMute}
              className="p-2 md:p-2.5 bg-white/10 backdrop-blur-2xl hover:bg-white/20 border border-white/10 rounded-full text-white/80 transition-all active:scale-90 cursor-pointer"
              title={isMuted ? "Aktifkan Suara" : "Bisukan"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={togglePlayPause}
              className="p-2 md:p-2.5 bg-white/10 backdrop-blur-2xl hover:bg-white/20 border border-white/10 rounded-full text-white/80 transition-all active:scale-90 cursor-pointer"
              title={isPaused ? "Putar Video" : "Jeda Video"}
            >
              {isPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
            </button>
          </div>
        )}
      </div>

      <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20 xl:px-28 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-20">
          <div className="md:col-span-2 space-y-8">
            <section className="mb-12">
              <h2 className="text-lg md:text-xl font-semibold mb-6 border-l-4 border-purple-600 pl-4 text-white/80 tracking-tight">
                Deskripsi
              </h2>
              <p className="text-white/60 text-xs md:text-sm font-medium leading-relaxed max-w-2xl pl-5 mt-2">
                {movie.fullDescription || movie.description || "Tidak ada deskripsi tersedia untuk movie ini."}
              </p>
            </section>

            {(movie.imdbLink || movie.tomatoLink) && (
              <section className="pt-8">
                <h2 className="text-lg md:text-xl font-semibold mb-6 border-l-4 border-purple-600 pl-4 text-white/80 tracking-tight">
                  Ranting
                </h2>
                <div className="flex flex-wrap gap-3 pl-5">
                  {movie.imdbLink && (
                    <a
                      href={movie.imdbLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 md:px-6 py-2 md:py-2.5 bg-white/10 backdrop-blur-3xl hover:bg-white/20 text-white/80 border border-white/20 rounded-full font-semibold flex items-center justify-center gap-2 transition-all text-xs md:text-sm active:scale-95 cursor-pointer"
                    >
                      IMDb <ExternalLink size={14} />
                    </a>
                  )}
                  {movie.tomatoLink && (
                    <a
                      href={movie.tomatoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 md:px-6 py-2 md:py-2.5 bg-white/10 backdrop-blur-3xl hover:bg-white/20 text-white/80 border border-white/20 rounded-full font-semibold flex items-center justify-center gap-2 transition-all text-xs md:text-sm active:scale-95 cursor-pointer"
                    >
                      Rotten Tomatoes <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-lg md:text-xl font-semibold mb-6 border-l-4 border-purple-600 pl-4 text-white/80 tracking-tight">
              Poster
            </h2>
            <div className="pl-5">
              <div className="relative aspect-2/3 max-w-[280px] md:max-w-[320px] rounded-3xl overflow-hidden apple-shadow group mx-auto md:mx-0">
                <img
                  src={imgSrc || undefined}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setImgSrc(`https://picsum.photos/seed/${movie.title.replace(/\s/g, '')}/500/750`)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Related Movies Section */}
        {movie.related && movie.related.length > 0 && (
          <div className="border-t border-white/5 pt-16">
            <MovieRow title="Movie Terkait" movies={movie.related} />
          </div>
        )}
      </div>

      <Footer />

      {/* Video Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center px-2">
                <h2 className="text-white text-xl md:text-3xl font-semibold">
                  {movie.title}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 text-white rounded-full cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="relative w-full aspect-video bg-black rounded-2xl md:rounded-3xl overflow-hidden border border-white/10">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${movie.trailerId}?autoplay=1`}
                  title={movie.title}
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default MovieDetailPage;