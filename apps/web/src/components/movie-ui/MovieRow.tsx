'use client';

import React from 'react';
import MovieCard from './MovieCard';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import type { Movie } from '@/store/feature/movie';

type MovieRowProps = {
  title: string;
  movies: Movie[];
  isWide?: boolean;
}

const MovieRow: React.FC<MovieRowProps> = ({ title, movies, isWide }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [dragMoved, setDragMoved] = React.useState(false);
  const [hasScrolled, setHasScrolled] = React.useState(false);
  const [isAtEnd, setIsAtEnd] = React.useState(false);

  const handleScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setHasScrolled(scrollLeft > 20);
      setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 20);
    }
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.clientX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging && dragMoved) {
      // If we were dragging and moved, prevent the click event from bubbling up
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const x = e.clientX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast
    
    if (Math.abs(x - startX) > 5) {
      setDragMoved(true);
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.touches[0].clientX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const x = e.touches[0].clientX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    
    if (Math.abs(x - startX) > 5) {
      setDragMoved(true);
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 py-4 md:py-6">
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-20 xl:px-28">
        <h2 className="text-lg md:text-xl font-semibold text-white/80 tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-1.5 md:p-2 bg-white/10 backdrop-blur-2xl rounded-full text-white hover:bg-white/20 border border-white/10 transition-all active:scale-90 cursor-pointer"
          >
            <LuChevronLeft size={16} className="md:w-4 md:h-4" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-1.5 md:p-2 bg-white/10 backdrop-blur-2xl rounded-full text-white hover:bg-white/20 border border-white/10 transition-all active:scale-90 cursor-pointer"
          >
            <LuChevronRight size={16} className="md:w-4 md:h-4" />
          </button>
        </div>
      </div>
      
      <div className="relative group/row px-6 md:px-12 lg:px-20 xl:px-28 overflow-hidden">
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          className={`flex gap-5 md:gap-6 overflow-x-auto no-scrollbar pb-6 ${
            isDragging ? 'cursor-grabbing select-none scroll-auto' : 'cursor-grab scroll-smooth'
          }`}
          style={{
            maskImage: `linear-gradient(to right, ${hasScrolled ? 'transparent' : 'black'}, black 10%, black 90%, ${isAtEnd ? 'black' : 'transparent'})`,
            WebkitMaskImage: `linear-gradient(to right, ${hasScrolled ? 'transparent' : 'black'}, black 10%, black 90%, ${isAtEnd ? 'black' : 'transparent'})`
          }}
        >
          {movies.length === 0 ? (
            <div 
              className={`${isWide ? "w-[260px] md:w-[320px] h-[180px] md:h-[220px]" : "w-[150px] md:w-[190px] h-[250px] md:h-[350px]"} bg-white/3 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/20 text-xs font-semibold uppercase tracking-widest backdrop-blur-xl shrink-0`}
            >
              <span className="text-xl mb-2">🎬</span>
              Data Kosong
            </div>
          ) : (
            movies.map((movie) => (
              <div 
                key={movie.id} 
                className={`${isWide ? "w-[260px] md:w-[320px]" : "w-[150px] md:w-[190px]"} shrink-0`}
                onDragStart={(e) => e.preventDefault()}
              >
                <div className={isDragging && dragMoved ? 'pointer-events-none' : ''}>
                  <MovieCard movie={movie} isWide={isWide} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieRow;
