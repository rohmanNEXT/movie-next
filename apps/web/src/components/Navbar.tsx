import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/feature/auth";
import { useMovieStore } from "@/store/feature/movie";
import { Play, LogOut, Search, X, Menu, LayoutDashboard } from "lucide-react";
import { LuUser } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import type { Movie } from "@/store/feature/movie";

const Navbar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { movies: allMoviesFromStore, myList, fetchWishlist } = useMovieStore();
  const router = useRouter();
  const pathname = usePathname();
  const handleLogout = () => logout();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("rilis-baru");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem("user-avatar");
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.avatar) {
      setAvatar(user.avatar);
      localStorage.setItem("user-avatar", user.avatar);
    }
  }, [user?.avatar]);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user && mounted) {
      fetchWishlist();
    }
  }, [user, mounted, fetchWishlist]);

  // Debounce search
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      requestAnimationFrame(() => {
        setSearchResults([]);
        setIsSearching(false);
      });
      return;
    }

    requestAnimationFrame(() => setIsSearching(true));
    const delay = setTimeout(() => {
      const filtered = allMoviesFromStore.filter((movie: Movie) =>
        movie.title.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 12));
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(delay);
  }, [searchTerm, allMoviesFromStore]);

  const scrollToSection = (id: string, menu?: string) => {
    if (pathname !== "/") {
      router.replace("/");
      setIsMobileMenuOpen(false);
      return;
    }
    
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
    setActiveMenu(menu || id);
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        {/* Isolated Background Layer to prevent Nested Backdrop-Filter Bug */}
        <div className={`absolute inset-0 pointer-events-none transition-[background,backdrop-filter,box-shadow,opacity] duration-300 ease-out ${
          isScrolled
            ? "bg-[#020617]/10 backdrop-blur-2xl shadow-black/20"
            : "bg-transparent"
        }`} />
        {/* WRAPPER */}
        <div
          className={`relative z-10 w-full flex items-center justify-between transition-all duration-300
  ${
    isScrolled
      ? "px-6 md:px-12 lg:px-20 xl:px-28 py-2.5"
      : "px-6 md:px-12 lg:px-20 xl:px-28 py-4 md:py-5"
  }`}
        >
          {/* LEFT */}
          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden pr-0 text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 text-lg md:text-2xl font-semibold text-white cursor-pointer"
            >
              <div className="bg-purple-500/70 p-1 md:p-1.5 rounded-lg cursor-pointer">
                <Play className="fill-white md:w-5 md:h-5" size={16} />
              </div>
              CHILL
            </Link>

            <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-gray-300">
              <button
                onClick={() => scrollToSection("rilis-baru")}
                className="hover:text-white cursor-pointer"
              >
                Rilis Baru
              </button>

              {mounted && user && myList.length > 0 && (
                <button
                  onClick={() => scrollToSection("daftar-saya")}
                  className="hover:text-white cursor-pointer"
                >
                  Daftar Saya
                </button>
              )}
              {mounted && user && (user.role === 'admin' || user.role === 'superadmin') && (
                <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-white text-purple-400 cursor-pointer">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 md:gap-4">
            {mounted && (!user || !user.subscription?.isActive) && (
              <Link
                href="/subscribe"
                className="hidden sm:flex px-4 py-2 bg-purple-500/80 hover:bg-purple-600 text-white/80 rounded-full text-xs md:text-sm font-semibold cursor-pointer"
              >
                Langganan
              </Link>
            )}

            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-300 hover:text-white cursor-pointer"
            >
              <Search size={18} className="md:w-5 md:h-5" />
            </button>

            {mounted && user ? (
              <div className="relative" ref={accountRef}>
                <button 
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="flex items-center gap-2 md:gap-3 p-1 rounded-full hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-600/80 shadow-lg shadow-purple-600/20 flex items-center justify-center text-white font-semibold text-[10px] md:text-xs overflow-hidden border border-white/10">
                    {avatar ? (
                      <img 
                        src={avatar.startsWith('http') ? avatar : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '') + avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <LuUser size={16} />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isAccountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-56 glass-dark bg-brand-dark/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden py-2"
                    >
                      <div className="px-5 py-3 border-b border-white/10">
                        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Username</p>
                        <p className="text-sm font-semibold truncate text-white/80 mt-1">{mounted ? user?.username : ''}</p>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        <Link 
                          href="/dashboard/profile" 
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        >
                          👤 Profil Saya
                        </Link>

                        
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-purple-300 hover:text-purple-200 hover:bg-purple-200/10 rounded-xl font-medium transition-all cursor-pointer"
                        >
                          <LogOut size={16} /> Keluar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : mounted ? (
              <div className="flex items-center gap-2 md:gap-4">
                <Link
                  href="/login"
                  className="text-xs md:text-sm text-gray-300 hover:text-white"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-white/10 backdrop-blur-2xl hover:bg-white/20 text-white rounded-full text-xs md:text-sm border border-white/10 transition-all"
                >
                  Daftar
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "transform, opacity" }}
              className="fixed top-0 left-0 h-full w-[260px] z-50 md:hidden
  bg-[#020617]/90 backdrop-blur-2xl border-r border-white/10
  shadow-2xl px-6 py-8"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-white font-semibold"
                >
                  <div className="bg-purple-500/70 p-1 rounded-lg">
                    <Play size={14} className="fill-white" />
                  </div>
                  CHILL
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* MENU */}
              <div className="flex flex-col gap-6 text-white mt-8">
                <button
                  onClick={() => scrollToSection("rilis-baru", "rilis-baru")}
                  className={`text-left text-lg font-semibold ${
                    activeMenu === "rilis-baru"
                      ? "text-purple-400"
                      : "hover:text-purple-400"
                  }`}
                >
                  Rilis Baru
                </button>



                {mounted && user && myList.length > 0 && (
                  <button
                    onClick={() => scrollToSection("daftar-saya", "daftar")}
                    className={`text-left text-lg font-semibold ${
                      activeMenu === "daftar"
                        ? "text-purple-400"
                        : "hover:text-purple-400"
                    }`}
                  >
                    Daftar Saya
                  </button>
                )}

                {mounted && user && (user.role === 'admin' || user.role === 'superadmin') && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-left text-lg font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-2"
                  >
                    <LayoutDashboard size={20} /> Dashboard
                  </Link>
                )}

                {mounted && (!user || !user.subscription?.isActive) && (
                  <div className="border-t border-white/10 pt-6 mt-2">
                    <Link
                      href="/subscribe"
                      className="block w-full text-center px-4 py-3
      bg-purple-500/90 hover:bg-purple-600
      text-white/80 rounded-full text-sm font-semibold
      transition-all duration-300
      shadow-lg shadow-purple-500/20 border border-white/10"
                    >
                      Langganan
                    </Link>
                  </div>
                )}


                {mounted && user && (
                   <button
                   onClick={handleLogout}
                   className="text-left text-lg font-semibold text-red-400 hover:text-red-300 flex items-center gap-2"
                 >
                   <LogOut size={18} /> Keluar
                 </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SEARCH MODAL */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-100 flex items-start justify-center pt-24 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-2xl"
              onClick={() => setIsSearchOpen(false)}
            />

            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="relative w-full max-w-2xl glass-dark rounded-3xl overflow-hidden apple-shadow p-6"
            >
              <div className="flex items-center gap-4">
                <Search className="text-gray-400 cursor-pointer" size={18} />
                <input
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value.trim()) {
                      setIsSearching(true);
                    } else {
                      setIsSearching(false);
                      setSearchResults([]);
                    }
                  }}
                  placeholder="Cari movie, series, atau genre..."
                  className="w-full bg-transparent border-none outline-none text-white text-base placeholder:text-gray-500"
                />
                {/* {isSearching && (
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                )} */}
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-8">
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">
                      Hasil Pencarian
                    </h4>
                    <div className="grid gap-2 max-h-[45vh] md:max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                      {searchResults.map((movie) => (
                        <Link
                          key={movie.id}
                          href={`/movie/${movie.id}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-2xl transition-all group cursor-pointer"
                        >
                          <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5">
                            {movie.image ? (
                              <Image
                                src={movie.image}
                                alt={movie.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px]">N/A</div>
                            )}
                          </div>
                          <div className="grow">
                            <h5 className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                              {movie.title}
                            </h5>
                            {movie.genre && (
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <span className="text-purple-400">{movie.genre.name}</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : searchTerm.trim() ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">
                      Tidak ada hasil ditemukan untuk &quot;{searchTerm}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                      Pencarian Populer
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Duty After School",
                        "Squid Game",
                        "Stranger Things",
                        "The Batman",
                        "Anime",
                      ].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSearchTerm(tag);
                            setIsSearching(true);
                          }}
                          className="px-4 py-2 glass hover:bg-white/10 text-white text-sm rounded-xl transition-all cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
