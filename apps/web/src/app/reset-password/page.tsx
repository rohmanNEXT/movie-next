"use client";
import React from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Play, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/feature/auth';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: Yup.object({
      password: Yup.string().min(6, 'Minimal 6 karakter').required('Password baru wajib diisi'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Password tidak cocok')
        .required('Konfirmasi password wajib diisi'),
    }),
    onSubmit: async (values) => {
      if (!token) {
        toast.error('Token reset tidak ditemukan.');
        return;
      }
      setIsLoading(true);
      try {
        await resetPassword(token, values.password);
        setIsSuccess(true);
        toast.success('Password berhasil direset!');
        setTimeout(() => router.push('/login'), 3000);
      } catch {
        toast.error('Gagal mereset password. Token mungkin sudah kedaluwarsa.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Token Tidak Ditemukan</h1>
          <p className="text-gray-400">Link reset tidak valid atau sudah kedaluwarsa.</p>
          <Link href="/forgot-password" className="text-purple-400 hover:underline">Minta link reset baru</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-dark p-6 sm:p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] apple-shadow space-y-8 z-10"
      >
        <div className="text-center space-y-6 pb-2">
          <Link href="/" className="inline-flex items-center gap-3 text-3xl md:text-4xl font-semibold tracking-tighter text-white/90 transition-transform hover:scale-105">
            <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-600/20">
              <Play className="fill-white" size={28} />
            </div>
            CHILL
          </Link>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-semibold text-white/90 tracking-tight">
              {isSuccess ? 'Berhasil!' : 'Reset Kata Sandi'}
            </h2>
            <p className="text-gray-400/70 text-sm leading-relaxed max-w-[280px] mx-auto">
              {isSuccess ? 'Password Anda telah direset. Mengalihkan ke halaman login...' : 'Buat kata sandi baru untuk akun Anda.'}
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="flex justify-center py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
              <CheckCircle size={48} />
            </div>
          </div>
        ) : (
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 ml-1 flex items-center gap-2">
                <Lock size={14} /> Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} name="password" placeholder="Masukkan password baru"
                  className="w-full px-4 py-3 md:px-5 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all placeholder:text-gray-600"
                  onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.password}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <div className="text-red-400/90 text-xs ml-1">{formik.errors.password}</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 ml-1">Konfirmasi Password</label>
              <input
                type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Ulangi password baru"
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all placeholder:text-gray-600"
                onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.confirmPassword}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className="text-red-400/90 text-xs ml-1">{formik.errors.confirmPassword}</div>
              )}
            </div>

            <button 
              type="submit" disabled={isLoading}
              className="w-full py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-full transition-all active:scale-[0.98] text-xs md:text-sm shadow-lg shadow-purple-600/20"
            >
              {isLoading ? 'Menyimpan...' : 'Reset Password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
