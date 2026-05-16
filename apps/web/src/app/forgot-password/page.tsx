"use client";
import React from 'react';
import Link from "next/link";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Play, ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/feature/auth';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Email tidak valid').required('Email wajib diisi'),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await forgotPassword(values.email);
        setIsSubmitted(true);
        toast.success('Instruksi reset telah dikirim ke email Anda.');
      } catch {
        toast.error('Gagal mengirim email reset.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-dark p-6 sm:p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] apple-shadow space-y-8 md:space-y-10 z-10"
      >
        <div className="text-center space-y-6 pb-2">
          <Link href="/" className="inline-flex items-center gap-3 text-3xl md:text-4xl font-semibold tracking-tighter text-white/90 mb-4 transition-transform hover:scale-105">
            <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-600/20">
              <Play className="fill-white" size={28} />
            </div>
            CHILL
          </Link>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-semibold text-white/90 tracking-tight">Lupa Kata Sandi</h2>
            <p className="text-gray-400/70 text-sm leading-relaxed max-w-[280px] mx-auto">
              {isSubmitted 
                ? "Kami telah mengirimkan instruksi pemulihan ke email Anda." 
                : "Masukkan email, kami kirim instruksi reset ke inbox."}
            </p>
          </div>
        </div>

        {!isSubmitted ? (
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 ml-1 flex items-center gap-2">
                <Mail size={14} /> Email
              </label>
              <input
                type="email" name="email" placeholder="Masukkan email Anda"
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all placeholder:text-gray-600"
                onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.email}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="text-red-400/90 text-xs ml-1">{formik.errors.email}</div>
              )}
            </div>
            <button 
              type="submit" disabled={isLoading}
              className="w-full py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-full transition-all apple-shadow active:scale-[0.98] text-xs md:text-sm"
            >
              {isLoading ? 'Mengirim...' : 'Kirim Instruksi'}
            </button>
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Masuk
            </Link>
          </form>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-purple-600/20 rounded-full flex items-center justify-center text-purple-500">
                <Mail size={36} />
              </div>
            </div>
            <button 
              onClick={() => setIsSubmitted(false)}
              className="w-full py-2 md:py-2.5 glass hover:bg-white/10 text-white font-semibold rounded-full transition-all text-xs md:text-sm"
            >
              Kirim Ulang Email
            </button>
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Masuk
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}