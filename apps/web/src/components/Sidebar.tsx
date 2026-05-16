'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/feature/auth';
import { 
  LuUser, 
  LuLogOut, 
  LuChevronLeft, 
  LuMenu,
  LuShieldCheck,
  LuLayoutDashboard,
  LuPlay,
  LuWallet
} from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';

let globalMounted = false;

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(globalMounted);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    globalMounted = true;
    setMounted(true);
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

  const menuItems = [
    { name: 'Profile', icon: LuUser, path: '/dashboard/profile' },
    ...(user?.role === 'admin' || user?.role === 'superadmin' ? [
      { name: 'Kelola Movie', icon: LuPlay, path: '/dashboard/kelola-movie' }
    ] : []),
    { name: 'Saldo', icon: LuWallet, path: '/dashboard/saldo' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isPro = user?.subscription?.isActive;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-dark/50 backdrop-blur-2xl border-r border-white/5">
      {/* Header / Brand */}
      <div className="p-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-purple-500/70 p-1.5 rounded-lg transition-transform group-hover:scale-105">
            <LuPlay className="fill-white w-5 h-5" size={16} />
          </div>
          <span className="text-2xl font-semibold text-white tracking-tight">CHILL</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-4 mb-6">
        <div className="p-3 rounded-2xl bg-white/3 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-semibold overflow-hidden shadow-lg">
            {avatar ? (
              <img 
                src={avatar.startsWith('http') ? avatar : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '') + avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <LuUser size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-md font-semibold text-white truncate leading-none mb-2 ${mounted ? '' : 'invisible'}`}>
              {mounted ? user?.username : 'Placeholder'}
            </p>
            <p className={`text-xs font-light text-white/30 truncate mb-2 ${mounted ? '' : 'invisible'}`}>
              {mounted ? user?.email : 'placeholder@mail.com'}
            </p>
            <div className={`flex items-center gap-1.5 ${mounted ? '' : 'invisible'}`}>
               {isPro ? (
                 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-md text-[8px] font-black uppercase tracking-widest border border-purple-500/20">
                   <LuShieldCheck size={7} /> Pro
                 </span>
               ) : (
                 <span className="inline-flex items-center px-2 py-0.5 bg-white/5 text-white/30 rounded-md text-[9px] font-black uppercase tracking-widest border border-white/5">
                   Free
                 </span>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all group ${
                isActive 
                  ? 'bg-purple-600 text-white shadow-[0_10px_20px_rgba(147,51,234,0.15)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={14} className={isActive ? 'text-white' : 'text-white/20 group-hover:text-white transition-colors'} />
              <span className="text-xs font-semibold tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl text-purple-300/50 hover:text-purple-200 hover:bg-purple-200/10 transition-all group cursor-pointer"
        >
          <LuLogOut size={18} className="text-purple-300/20 group-hover:text-purple-200 transition-colors" />
          <span className="text-xs font-semibold tracking-wide">Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-6 left-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-600/20 active:scale-95 transition-transform"
        >
          {isOpen ? <LuChevronLeft size={24} /> : <LuMenu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
          <div
            className="fixed top-0 left-0 bottom-0 w-72 z-50 lg:hidden"
          >
            {sidebarContent}
          </div>
        </>
      )}

      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 w-72 z-40">
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
