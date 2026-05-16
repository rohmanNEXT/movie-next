'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from '@/components/Navbar';
import { Check, Zap, Shield, Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/feature/auth';
import connectApi from '@/services/api';
import type { Package, ApiResponse } from '@/store/feature/types';



const iconMap: Record<string, React.ReactNode> = {
  Essential: <Shield size={22} />,
  Professional: <Zap size={22} />,
  Ultimate: <Star size={22} />,
};

const colorMap: Record<string, string> = {
  Essential: 'bg-white/5 text-gray-400',
  Professional: 'bg-purple-600/20 text-purple-400',
  Ultimate: 'bg-yellow-500/20 text-yellow-400',
};

// Fallback plans when API is not available
const fallbackPlans: Package[] = [
  { id: 1, name: 'Essential', price: 49000, durationDays: 30, features: 'Kualitas 720p (HD)|Tonton di 2 perangkat|Bebas iklan premium|Download movie offline', isActive: true },
  { id: 2, name: 'Professional', price: 79000, durationDays: 30, features: 'Kualitas 1080p (Full HD)|Tonton di 4 perangkat|Streaming tanpa batas|Spatial audio support|Konten original Chill', isActive: true },
  { id: 3, name: 'Ultimate', price: 119000, durationDays: 30, features: 'Kualitas 4K + HDR10|Tonton di 6 perangkat|Dolby Atmos & Vision|Akses awal movie baru|Kualitas bit-rate tinggi', isActive: true },
];

function formatPrice(price: number): string {
  return `Rp ${Math.round(price / 1000)}k`;
}

function parseFeatures(features: string | null): string[] {
  if (!features) return [];
  return features.split('|').filter(Boolean);
}

const SubscribePage: React.FC = () => {
  const { user, token, fetchMe } = useAuthStore();
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPkg, setLoadingPkg] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await connectApi.get<ApiResponse<Package[]>>('/packages');
        setPackages(data.data.length > 0 ? data.data : fallbackPlans);
      } catch {
        setPackages(fallbackPlans);
      }
    };
    fetchPackages();
  }, []);

  if (mounted && user?.subscription?.isActive) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white">
        <h1 className="text-6xl font-semibold mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-8">Halaman tidak ditemukan</p>
        <Link href="/" className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-full text-sm font-semibold transition-all cursor-pointer">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const handleSubscribe = async (pkg: Package) => {
    if (!user || !token) {
      toast.error('Silakan login terlebih dahulu.');
      router.push('/login');
      return;
    }

    setLoadingPkg(pkg.id);

    try {
      const { data } = await connectApi.post<ApiResponse>('/payment/balance', {
        packageId: pkg.id,
      });

      if (data.success) {
        toast.success('Pembayaran berhasil! Langganan Anda aktif.');
        fetchMe(); // refresh user data with subscription
        router.push('/profile');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal membuat pembayaran.';
      toast.error(msg);
    } finally {
      setLoadingPkg(null);
    }
  };

  const displayPackages = packages.length > 0 ? packages : fallbackPlans;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <Navbar />
      
      <main className="pt-52 pb-48 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-semibold tracking-tight text-white/80 mb-8"
          >
            Smarter <span className="bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Streaming </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-xs md:text-sm font-medium leading-relaxed max-w-lg mx-auto drop-shadow-md"
          >
            Pilih paket sesuai gaya hidup digital Anda, batalkan kapan saja tanpa biaya tambahan.
          </motion.p>


        </div>
        
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {displayPackages.map((pkg, index) => {
            const isPopular = index === 1;
            const features = parseFeatures(pkg.features);
            const icon = iconMap[pkg.name] || <Shield size={22} />;
            const color = colorMap[pkg.name] || 'bg-white/5 text-gray-400';

            return (
              <motion.div
                key={pkg.id}
                whileHover={{ y: -5 }}
                className={`relative flex flex-col p-8 rounded-4xl bg-white/5 backdrop-blur-3xl border ${isPopular ? 'border-purple-500 shadow-2xl shadow-purple-500/10' : 'border-white/10'} transition-all`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-[10px] font-semibold text-white rounded-full uppercase tracking-widest">
                    Best Choice
                  </div>
                )}
                
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-6`}>
                  {icon}
                </div>
                
                <h3 className="text-xl font-semibold text-white/80 mb-1">{pkg.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-3xl font-semibold text-white/80">{formatPrice(pkg.price)}</span>
                  <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">/bulan</span>
                </div>
                
                <ul className="space-y-3.5 mb-10 grow">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-400 text-[13px] leading-snug">
                      <Check size={14} className="text-purple-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => handleSubscribe(pkg)}
                  disabled={loadingPkg === pkg.id}
                  className={`w-full py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${
                    isPopular 
                      ? 'bg-purple-600 hover:bg-purple-500 text-white/80 shadow-xl shadow-purple-900/20' 
                      : 'bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  {loadingPkg === pkg.id ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loadingPkg === pkg.id ? 'Memproses...' : 'Subscribe Now'}
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-32 pt-20 text-center space-y-6">
          <div className="flex items-center justify-center gap-6 opacity-30 grayscale">
            <Shield size={24} /> <Zap size={24} /> <Star size={24} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.3em] mb-2">
              Pembayaran Saldo
            </p>
            <p className="text-[9px] font-medium text-gray-600 max-w-sm mx-auto leading-relaxed">
              Transaksi diproses menggunakan saldo akun Anda. Pastikan saldo mencukupi.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubscribePage;
