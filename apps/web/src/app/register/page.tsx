"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuthStore } from "../../store/feature/auth";
import connectApi from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Eye, EyeOff, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser, googleLogin } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isRoleOpen, setIsRoleOpen] = React.useState(false);
  const [clientIds, setClientIds] = React.useState<{ google: string; microsoft: string }>({ google: '', microsoft: '' });
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Fetch OAuth config
    connectApi.get('/config').then((res) => {
      setClientIds({
        google: res.data.data.googleClientId,
        microsoft: res.data.data.microsoftClientId
      });
    }).catch(() => {});

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoogleOAuth = async () => {
    const clientId = clientIds.google || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const redirectUri = encodeURIComponent(window.location.origin + '/register');
    const nonce = Math.random().toString(36).substring(2);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20profile%20email&nonce=${nonce}`;
    
    const popup = window.open(authUrl, 'Google Login', 'width=500,height=700,top=100,left=100');

    const timer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(timer);
          return;
        }
        const url = popup.location.href;
        if (url.includes('id_token=')) {
          const hash = popup.location.hash;
          const params = new URLSearchParams(hash.substring(1));
          const idToken = params.get('id_token');
          if (idToken) {
             googleLogin(idToken, true)
              .then((result: any) => {
                if (result?.success || !result?.error) {
                  toast.success('Akun Google berhasil dibuat dan login!');
                  router.push(['admin', 'superadmin'].includes(result?.data?.user?.role) ? '/dashboard' : '/');
                }
              })
              .catch((err: any) => {
                const errorMsg = err?.response?.data?.message || '';
                if (errorMsg.includes('sudah terdaftar')) {
                  toast.error(errorMsg);
                  setTimeout(() => {
                    router.push('/login');
                  }, 1500);
                } else {
                  toast.error(errorMsg || 'Gagal mendaftar dengan Google.');
                }
              });
          }
          popup.close();
          clearInterval(timer);
        }
      } catch (e) {
        // Cross-origin access error is normal until it redirects back
      }
    }, 500);
  };


  const formik = useFormik({
    initialValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "user",
      referralCode: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Email tidak valid").required("Email wajib diisi"),
      username: Yup.string().required("Username wajib diisi"),
      password: Yup.string()
        .min(6, "Minimal 6 karakter")
        .required("Kata sandi wajib diisi"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Kata sandi tidak cocok")
        .required("Konfirmasi kata sandi wajib diisi"),
    }),
    onSubmit: async (values) => {
      try {
        const response = await registerUser({
          fullName: values.username,
          username: values.username,
          email: values.email,
          password: values.password,
          role: values.role,
          referralCode: values.referralCode
        });
        
        if (response.success) {
          toast.success("Registrasi berhasil! Silakan cek email/login.");
          router.push("/login");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Gagal mendaftar");
      }
    },
  });

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-dark p-6 sm:p-8 md:p-12 rounded-3xl md:rounded-[3rem] apple-shadow space-y-6 md:space-y-8 z-10"
      >
        {/* Logo */}
        <div className="text-center space-y-4 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-3xl md:text-4xl font-semibold tracking-tighter text-white/90 mb-4 transition-transform hover:scale-105"
          >
            <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-600/20">
              <Play className="fill-white" size={28} />
            </div>
            CHILL
          </Link>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-semibold text-white/90 tracking-tight">
              Daftar
            </h2>
            <p className="text-gray-400/70 text-sm leading-relaxed mx-auto">
              Mulai pengalaman menonton terbaikmu
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 ml-1 mb-1">
              Email
            </div>
            <input
              type="email"
              name="email"
              placeholder="Masukkan email"
              className="w-full px-4 py-3 md:px-5 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all placeholder:text-gray-600"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-400/90 text-xs ml-1">
                {formik.errors.email as string}
              </div>
            )}
          </div>

          {/* Username */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 ml-1 mb-1">
              Username
            </div>
            <input
              type="text"
              name="username"
              placeholder="Masukkan username"
              className="w-full px-4 py-3 md:px-5 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all placeholder:text-gray-600"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
            />
            {formik.touched.username && formik.errors.username && (
              <div className="text-red-400/90 text-xs ml-1">
                {formik.errors.username as string}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 ml-1 mb-1">
              Kata Sandi
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Masukkan kata sandi"
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all placeholder:text-gray-600"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className="text-red-400/90 text-xs ml-1">
                {formik.errors.password as string}
              </div>
            )}
          </div>
       
          {/* Confirm Password */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 ml-1 mb-1">
              Konfirmasi Kata Sandi
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Masukkan kata sandi"
              className="w-full px-4 py-3 md:px-5 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all placeholder:text-gray-600"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.confirmPassword}
            />
            {formik.touched.confirmPassword &&
              formik.errors.confirmPassword && (
                <div className="text-red-400/90 text-xs ml-1">
                  {formik.errors.confirmPassword as string}
                </div>
              )}
          </div>

          {/* Referral Code */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 ml-1 mb-1">
              Kode Referral (Opsional)
            </div>
            <input
              type="text"
              name="referralCode"
              placeholder="Masukkan kode referral"
              className="w-full px-4 py-3 md:px-5 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all placeholder:text-gray-600"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.referralCode}
            />
          </div>

          {/* Role */}
          <div className="space-y-3">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400/80 ml-1 mb-1">
              Peran (Role)
            </div>
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setIsRoleOpen(!isRoleOpen)}
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 focus:ring-2 focus:ring-purple-600/50 transition-all cursor-pointer flex items-center justify-between group"
              >
                <span className="text-sm font-medium">
                  {formik.values.role === 'admin' ? 'Admin' : 'User Biasa'}
                </span>
                <ChevronDown 
                  size={18} 
                  className={`text-gray-500 transition-transform duration-300 ${isRoleOpen ? 'rotate-180' : ''}`} 
                />
              </div>

              <AnimatePresence>
                {isRoleOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute z-50 w-full mt-2 py-2 bg-[#1a1c23]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    {[
                      { label: 'User Biasa', value: 'user' },
                      { label: 'Admin', value: 'admin' }
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => {
                          formik.setFieldValue('role', opt.value);
                          setIsRoleOpen(false);
                        }}
                        className={`px-5 py-3 text-sm cursor-pointer transition-colors ${
                          formik.values.role === opt.value 
                            ? 'bg-purple-600/20 text-purple-400' 
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition active:scale-[0.98] text-xs md:text-sm shadow-lg shadow-purple-600/20"
          >
            Daftar
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brand-dark px-3 text-gray-400/50">Atau</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleOAuth}
              className="w-full py-2 md:py-2.5 glass hover:bg-white/10 text-white font-semibold rounded-full transition flex items-center justify-center gap-3 active:scale-[0.98] text-xs md:text-sm"
            >
              <Image
                src="https://www.google.com/favicon.ico"
                width={18}
                height={18}
                alt="Google"
              />
              Daftar dengan Google
            </button>
          </div>

          {/* Login link */}
          <div className="text-center text-xs text-gray-400 mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-white font-semibold hover:underline">
              Masuk
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
