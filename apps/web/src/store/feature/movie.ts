import { create } from 'zustand';
import type { Movie, Genre, MovieState, ApiResponse } from './types';
import connectApi from '@/services/api';
import { useAuthStore } from './auth';

// Re-export types for components
export type { Movie, Genre, MovieState };

// Helper for localStorage
const getStoredMyList = (): number[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('chill_myList');
  return saved ? JSON.parse(saved) : [];
};

interface MovieStore extends MovieState {
  meta: { total: number; page: number; limit: number; totalPages: number } | null;
  getData: (params?: { genre?: string; sort?: string; search?: string; authorId?: number; page?: number; limit?: number; year?: number | string }) => Promise<void>;
  addMovie: (movieData: { title: string; description?: string; image?: string; genreId?: number }) => Promise<ApiResponse<Movie>>;
  editMovie: (id: number, movieData: Partial<Movie>) => Promise<ApiResponse<Movie>>;
  deleteMovie: (id: number) => Promise<void>;
  getGenres: () => Promise<void>;
  fetchWishlist: () => Promise<void>;
  toggleMyList: (movieId: number) => Promise<void>;
  getMovie: (id: string | number) => Promise<void>;
  clearCurrentMovie: () => void;
  recordMovieView: (id: string | number) => Promise<void>;
  getTrending: () => Promise<void>;
}

export const useMovieStore = create<MovieStore>((set, get) => ({
  movies: [],
  genres: [],
  myList: getStoredMyList(),
  trending: [],
  currentMovie: null,
  loading: false,
  error: null,
  meta: null,
  
  getData: async (params) => {
    set({ loading: true, error: null });
    try {
      const { data } = await connectApi.get<ApiResponse<Movie[]>>('/movies', { params });
      set({ movies: data.data, meta: (data as any).meta, loading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ error: msg, loading: false });
    }
  },
  
  addMovie: async (movieData) => {
    try {
      const { data } = await connectApi.post<ApiResponse<Movie>>('/movie', movieData);
      set((state) => ({ movies: [data.data, ...state.movies] }));
      return data;
    } catch (err) {
      console.error('Add movie error:', err);
      throw err;
    }
  },
  
  editMovie: async (id, movieData) => {
    try {
      const { data } = await connectApi.patch<ApiResponse<Movie>>(`/movie/${id}`, movieData);
      set((state) => ({
        movies: state.movies.map((m) => m.id === id ? data.data : m),
      }));
      return data;
    } catch (err) {
      console.error('Edit movie error:', err);
      throw err;
    }
  },
  
  deleteMovie: async (id) => {
    try {
      await connectApi.delete(`/movie/${id}`);
      set((state) => ({
        movies: state.movies.filter((m) => m.id !== id),
      }));
    } catch (err) {
      console.error('Delete movie error:', err);
      throw err;
    }
  },
  
  getGenres: async () => {
    try {
      const { data } = await connectApi.get<ApiResponse<Genre[]>>('/genres');
      set({ genres: data.data });
    } catch (err) {
      console.error('Fetch genres error:', err);
    }
  },
  
  fetchWishlist: async () => {
    try {
      const { data } = await connectApi.get<ApiResponse<any[]>>('/wishlist');
      const movieIds = data.data.map((item) => item.movieId);
      set({ myList: movieIds });
      if (typeof window !== 'undefined') localStorage.setItem('chill_myList', JSON.stringify(movieIds));
    } catch (err) {
      console.error('Fetch wishlist error:', err);
    }
  },
  
  toggleMyList: async (movieId) => {
    const { myList } = get();
    const exists = myList.includes(movieId);
    const newList = exists ? myList.filter(id => id !== movieId) : [...myList, movieId];
    
    // Optimistic update
    set({ myList: newList });
    if (typeof window !== 'undefined') localStorage.setItem('chill_myList', JSON.stringify(newList));
    
    // Sync with DB if logged in
    const token = useAuthStore.getState().token;
    if (token) {
      try {
        if (exists) {
          await connectApi.delete(`/wishlist/${movieId}`);
        } else {
          await connectApi.post(`/wishlist`, { movieId });
        }
      } catch (err) {
        console.error('Failed to sync wishlist to db:', err);
        // Revert
        set({ myList });
        if (typeof window !== 'undefined') localStorage.setItem('chill_myList', JSON.stringify(myList));
      }
    }
  },
  
  getMovie: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await connectApi.get<ApiResponse<Movie & { related: Movie[] }>>(`/movie/${id}`);
      set({ currentMovie: data.data, loading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ error: msg, loading: false });
    }
  },
  
  clearCurrentMovie: () => set({ currentMovie: null }),
  
  recordMovieView: async (id) => {
    try {
      await connectApi.post(`/movie/${id}/view`);
    } catch (err) {
      console.error('Record view error:', err);
    }
  },
  
  getTrending: async () => {
    try {
      const { data } = await connectApi.get<ApiResponse<Movie[]>>('/movies/trending');
      set({ trending: data.data });
    } catch (err) {
      console.error('Fetch trending error:', err);
    }
  },
}));
