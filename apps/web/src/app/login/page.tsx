"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuthStore } from "@/store/feature/auth";
import connectApi from "@/services/api";
import { Play, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Declare Google GIS callback type
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (el: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, googleLogin } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [clientIds, setClientIds] = React.useState<{ google: string; microsoft: string }>({ google: '', microsoft: '' });
  // Load Config
  React.useEffect(() => {
    connectApi.get('/config').then((res) => {
      const { googleClientId, microsoftClientId } = res.data.data;
      setClientIds({ google: googleClientId, microsoft: microsoftClientId });
    }).catch(() => toast.error('Gagal memuat konfigurasi server.'));
  }, []);

  const handleGoogleOAuth = async () => {
    const clientId = clientIds.google || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const redirectUri = encodeURIComponent(window.location.origin + '/login');
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
            googleLogin(idToken, false)
              .then((result: any) => {
                if (result?.success || !result?.error) {
                  toast.success('Login Google berhasil!');
                  router.push(['admin', 'superadmin'].includes(result?.data?.user?.role) ? '/dashboard' : '/');
                }
              })
              .catch((err: any) => {
                const errorMsg = err?.response?.data?.message || '';
                if (errorMsg.includes('belum terdaftar')) {
                  toast.error(errorMsg);
                  setTimeout(() => {
                    router.push('/register');
                  }, 1500);
                } else {
                  toast.error(errorMsg || 'Gagal login dengan Google.');
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

  const handleGoogleResponse = async (response: any) => {
    // Unused, keeping it as fallback
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Format email tidak valid").required("Email wajib diisi"),
      password: Yup.string()
        .min(6, "Minimal 6 karakter")
        .required("Kata sandi wajib diisi"),
    }),
    onSubmit: async (values: any) => {
      try {
        const response = await loginUser({ email: values.email, password: values.password });
        if (response.success) {
          toast.success(response.message || `Halo ${response.data.user.username}!`);
          if (['admin', 'superadmin'].includes(response.data.user.role)) {
            router.push("/dashboard");
          } else {
            router.push("/");
          }
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Gagal login. Periksa kembali email/password.");
      }
    },
  });

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

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
              Masuk
            </h2>
            <p className="text-gray-400/70 text-sm leading-relaxed mx-auto">
              Selamat datang kembali di Chill
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 ml-1 mb-1">
              Email
            </div>
            <input
              type="email"
              name="email"
              placeholder="Masukkan email"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50 placeholder:text-gray-600"
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

          {/* Password */}
          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 ml-1 mb-1">
              Kata Sandi
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Masukkan kata sandi"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50 placeholder:text-gray-600"
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

          {/* Forgot */}
          <div className="text-right text-xs text-gray-400 -mt-2">
            <Link href="/forgot-password" className="hover:text-white">
              Lupa kata sandi?
            </Link>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition active:scale-[0.98] text-xs md:text-sm shadow-lg shadow-purple-600/20"
          >
            Masuk
          </button>

          {/* Register */}
          <div className="text-center text-xs text-gray-400">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-white font-semibold hover:underline"
            >
              Daftar
            </Link>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brand-dark px-3 text-gray-500">Atau</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleOAuth}
              className="w-full py-2 md:py-2.5 glass hover:bg-white/10 text-white font-semibold rounded-full transition flex items-center justify-center gap-3 active:scale-[0.98] text-xs md:text-sm"
            >
              <Image
                src="https://www.google.com/favicon.ico"
                width={20}
                height={20}
                alt="Google"
              />
              Masuk dengan Google
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

