// === Genre ===
export type Genre = {
  id: number;
  name: string;
};

// === Movie (matches Prisma schema + included genre) ===
export type Movie = {
  id: number;
  title: string;
  description: string | null;
  fullDescription: string | null;
  image: string | null;
  rating: number | null;
  year: number | null;
  category: string | null;
  isNewEpisode: boolean;
  trailerId: string | null;
  imdbLink: string | null;
  tomatoLink: string | null;
  genreId: number | null;
  genre: Genre | null;
  author?: {
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export interface MovieState {
  movies: Movie[];
  genres: Genre[];
  myList: number[];
  trending: Movie[];
  currentMovie: (Movie & { related?: Movie[] }) | null;
  loading: boolean;
  error: string | null;
}

// === User ===
export type User = {
  id: number;
  fullName: string | null;
  username: string;
  email: string;
  role: string;
  avatar: string | null;
  city: string | null;
  country: string | null;
  createdAt?: string;
  subscription?: UserSubscription | null;
  phoneNumber: string | null;
  balance?: number;
  referralCode?: string | null;
  commissions?: any[];
};

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// === Wishlist ===
export type Wishlist = {
  id: number;
  userId: number;
  movieId: number;
  movie: Movie;
};

// === Subscription ===
export type Package = {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  features: string | null;
  isActive: boolean;
};

export type UserSubscription = {
  id: number;
  userId: number;
  packageId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  package: Package;
};

// === Generic Action ===
export interface Action<P = unknown> {
  type: string;
  payload?: P;
}

// === API Response format ===
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}
