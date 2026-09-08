"use client";
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MovieRow from '@/components/movie-ui/MovieRow';
import Footer from '@/components/Footer';
import { useMovieStore } from '@/store/feature/movie';
import type { Movie } from '@/store/feature/movie';

const LandingPage: React.FC = () => {
  const { movies, myList, trending, getData, getTrending } = useMovieStore();
  const myMovies = movies.filter((m: Movie) => myList.includes(m.id));

  useEffect(() => {
    if (movies.length === 0) {
      getData();
    }
    getTrending();
  }, [movies.length, getData, getTrending]);

  // if (loading || movies.length === 0) return null;

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-brand-dark flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
  //     </div>
  //   );
  // }

  // if (movies.length === 0) {
  //   return (
  //     <div className="min-h-screen bg-brand-dark flex items-center justify-center">
  //       <div className="text-white/30 text-xs uppercase tracking-widest font-semibold">Gagal memuat film atau data kosong.</div>
  //     </div>
  //   );
  // }

  const heroMovies = movies.filter((m: Movie) => m.author?.role === 'superadmin').slice(0, 6);
  const regularMovies = movies.filter((m: Movie) => m.author?.role !== 'superadmin');

  return (
    <main className="min-h-screen bg-brand-dark">
      <Navbar />
      <Hero
        movies={heroMovies.length > 0 ? heroMovies : regularMovies.slice(0, 6)}
      />

      <div className="relative mt-24 md:mt-32 z-10 space-y-6 md:space-y-10">
        {/* Fallback Row - exclude superadmin movies */}
        <MovieRow title="Series Populer" movies={regularMovies.slice(0, 10)} />

        <div id="rilis-baru" className="scroll-mt-24">
          <MovieRow title="Rilis Baru" movies={regularMovies.filter((m: Movie) => m.isNewEpisode).slice(0, 8)} />
        </div>

        {myMovies.length > 0 && (
          <div id="daftar-saya" className="scroll-mt-24">
            <MovieRow title="Daftar Saya" movies={myMovies} />
          </div>
        )}

        {trending.length > 0 ? (
          <MovieRow title="Trending Sekarang 🔥" movies={trending.filter((m: Movie) => m.author?.role !== 'superadmin')} />
        ) : (
          <MovieRow title="Trending Sekarang" movies={regularMovies.slice(2, 10)} />
        )}
      </div>

      <Footer />
    </main>
  );
};

export default LandingPage;
