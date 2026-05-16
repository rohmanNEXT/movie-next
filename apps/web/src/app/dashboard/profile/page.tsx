'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/feature/auth';
import { useRouter } from 'next/navigation';
import connectApi from '@/services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LuPencil, LuSave, LuCamera, LuMail, LuMapPin, LuGlobe, LuShieldCheck, LuZap, LuUser } from 'react-icons/lu';
import { LuLoader } from 'react-icons/lu';

interface ProfileData {
  fullName: string;
  username: string;
  email: string;
  city: string;
  country: string;
  phoneNumber: string;
  avatar: string | null;
}

const ProfilePage: React.FC = () => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user, token, loading, fetchMe, setUser } = useAuthStore();
  const [AuthLoading, setAuthLoading] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Initialize formData directly from store if user exists
  const [formData, setFormData] = useState<ProfileData>(() => {
    return {
      fullName: user?.fullName || '',
      username: user?.username || '',
      email: user?.email || '',
      city: user?.city || '',
      country: user?.country || '',
      phoneNumber: user?.phoneNumber || '',
      avatar: user?.avatar || null,
    };
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    if (!AuthLoading && !token) {
      router.push('/login');
    }
  }, [token, AuthLoading, router]);

  useEffect(() => {
    // Selalu fetch data terbaru saat mount
    if (token) {
      setAuthLoading(true);
      fetchMe().finally(() => setAuthLoading(false));
    }
  }, [fetchMe, token]);

  // Sync formData saat user di store berubah (misal setelah fetchMe atau update)
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        city: user.city || '',
        country: user.country || '',
        phoneNumber: user.phoneNumber || '',
        avatar: user.avatar || null,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading('Sedang menyimpan profil...');
    try {
      const dataToSend = new FormData();
      // Add all fields from formData state
      Object.keys(formData).forEach(key => {
        const value = (formData as any)[key];
        if (key !== 'avatar' && value !== null && value !== undefined) {
          dataToSend.append(key, value);
        }
      });
      
      if (selectedFile) {
        dataToSend.append('avatar', selectedFile);
      } else if (formData.avatar) {
        dataToSend.append('avatar', formData.avatar);
      }

      const { data } = await connectApi.patch('/profile', dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        toast.success('Profil diperbarui', { id: toastId });
        setIsEditing(false);
        setUser({ ...user, ...data.data });
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      return toast.error('Harap isi semua kolom password');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Password tidak cocok');
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('Password minimal 6 karakter');
    }

    setChangingPassword(true);
    try {
      const { data } = await connectApi.patch('/profile', { password: passwordData.newPassword });
      if (data.success) {
        toast.success('Password berhasil diubah');
        setShowPasswordForm(false);
        setPasswordData({ newPassword: '', confirmPassword: '' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Ukuran file maksimal 2MB');
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const isPro = user?.subscription?.isActive;

  if (!mounted) return null;
  if (!token || !user) return null;

  return (
    <div className="min-h-screen bg-brand-dark flex">
      <Sidebar />
      <div className="flex-1 lg:pl-72 min-h-screen flex flex-col">
        <main className="flex-1 px-6 md:px-16 lg:px-20 pt-24 md:pt-28 lg:pt-16 pb-32">
          {AuthLoading ? (
            <div className="flex items-center justify-center" style={{ minHeight: '600px' }}>
              <LuLoader className="text-purple-500 animate-spin" size={32} />
            </div>
          ) : (
            <div className="max-w-6xl w-full mx-auto">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-400 mb-2">Akun Saya</h1>
              <p className="text-gray-600 text-xs">Kelola informasi profil dan pengaturan akun Anda.</p>
            </div>
            
            <div className="flex gap-3">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-5 md:px-6 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-sm font-semibold border border-white/10 transition-all cursor-pointer flex items-center gap-2"
                >
                  <LuPencil size={14} /> Edit Profil
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-5 md:px-6 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-sm font-semibold border border-white/10 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 md:px-6 py-2 md:py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-xl shadow-purple-600/20"
                  >
                    {saving ? <LuLoader size={16} className="animate-spin" /> : <LuSave size={16} />}
                    Simpan
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 backdrop-blur-2xl">
            {/* Left: Identity Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-8 rounded-4xl bg-white/3 border border-white/5 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-4xl font-semibold overflow-hidden shadow-2xl">
                    {previewUrl || avatar ? (
                      <img 
                        src={previewUrl || (avatar?.startsWith('http') ? avatar : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '') + avatar)} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <LuUser size={48} className="text-white" />
                    )}
                  </div>
                  {isEditing && (
                    <>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 p-3 bg-purple-600/30 backdrop-blur-2xl text-white rounded-full shadow-xl hover:scale-110 transition-transform cursor-pointer border border-white/10"
                      >
                        <LuCamera size={14} />
                      </button>
                    </>
                  )}
                </div>
                
                <p className="text-white text-xl font-medium mb-1">{formData.username}</p>
                <p className="text-white/20 text-xs mt-1 font-medium">{formData.email}</p>
                <div className="mb-6" />

                <div className="w-full pt-6 border-t border-white/5 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/2 rounded-2xl border border-white/5">
                    <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">Plan</span>
                    {isPro ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                        <LuShieldCheck size={10} /> Pro
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-white/5 text-white/40 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5">
                        Free
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Info */}
              <div className="p-6 rounded-3xl bg-yellow-500/5 border border-yellow-500/10">
                 <div className="flex items-center gap-3 text-yellow-500 mb-4">
                    <LuZap size={16} fill="currentColor" />
                    <span className="text-xs font-semibold uppercase tracking-widest">Premium Status</span>
                 </div>
                 <p className="text-xs text-yellow-500/40 leading-relaxed italic">
                   {isPro ? 'Nikmati akses tanpa batas ke semua katalog movie, serial, dan anime Chill.' : 'Upgrade ke Pro untuk menikmati movie tanpa iklan dan kualitas 4K HDR.'}
                 </p>
              </div>
            </div>

            {/* Right: Form Details */}
            <div className="lg:col-span-2 space-y-10">
               <div className="grid md:grid-cols-2 gap-x-8 gap-y-10">
                  {[
                    { label: 'Nama Lengkap', name: 'fullName', placeholder: 'Nama Lengkap Anda' },
                    { label: 'Username', name: 'username', placeholder: 'username'},
                    { label: 'Email Address', name: 'email', placeholder: 'name@email.com', disabledAlways: true },
                    { label: 'Nomor Telepon', name: 'phoneNumber', placeholder: '0812xxxx' },
                    { label: 'Kota', name: 'city', placeholder: 'Contoh: Jakarta' },
                    { label: 'Negara', name: 'country', placeholder: 'Contoh: Indonesia' },
                  ].map((field) => (
                    <div key={field.name} className="space-y-3">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20 ml-1 mb-1">
                        {field.label}
                      </label>
                      <div className="relative group">
                        <input 
                          name={field.name}
                          value={(formData as any)[field.name]}
                          onChange={handleChange}
                          disabled={!isEditing || field.disabledAlways}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                  ))}
               </div>

               <div className="pt-8 border-t border-white/5">
                 <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-full md:flex-1 p-6 rounded-3xl bg-white/2 border border-white/5">
                      <div className="px-1 text-[10px] font-semibold uppercase tracking-widest text-purple-400 mb-3">Ubah Kata Sandi</div>
                      <div className="space-y-5">
                        <div className="space-y-0">
                           <label className="text-[10px] font-semibold uppercase tracking-widest text-white/20 ml-1">Password Baru</label>
                           <input 
                             type="password"
                             placeholder="••••••••"
                             value={passwordData.newPassword}
                             onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 placeholder:text-gray-600"
                           />
                        </div>
                        <div className="space-y-0">
                           <label className="text-[10px] font-semibold uppercase tracking-widest text-white/20 ml-1">Konfirmasi Password</label>
                           <input 
                             type="password"
                             placeholder="••••••••"
                             value={passwordData.confirmPassword}
                             onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full mb-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-600/50 placeholder:text-gray-600"
                           />
                        </div>
                        <button 
                          onClick={handleChangePassword}
                          disabled={changingPassword}
                          className="w-full px-5 md:px-6 py-2 md:py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95"
                        >
                          {changingPassword ? <LuLoader size={14} className="animate-spin" /> : 'Perbarui Kata Sandi'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:flex-1">
                      <div className="p-6 rounded-3xl bg-white/2 border border-white/5">
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 mb-3">Member Since</h4>
                        <div className="space-y-2.5">
                          <p className="text-sm font-semibold text-white/80">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </p>
                          {user?.createdAt && (
                            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                              {(() => {
                                const created = new Date(user.createdAt);
                                const now = new Date();
                                const diffTime = Math.abs(now.getTime() - created.getTime());
                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                const months = Math.floor(diffDays / 30);
                                const days = diffDays % 30;
                                
                                if (months > 0) return `${months} Bulan ${days} Hari`;
                                return `${days} Hari`;
                              })()}
                            </p>
                          )}
                        </div>
                      </div>

                      {user?.subscription?.isActive && (
                        <div className="p-6 rounded-3xl bg-white/2 border border-white/5 mt-4">
                          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 mb-3">Langganan</h4>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-2">Paket</p>
                              <p className="text-sm font-semibold text-white/80">{user.subscription.package?.name || 'Essential'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-2">Tanggal Dibeli</p>
                              <p className="text-sm font-semibold text-white/80">
                                {(user.subscription as any).createdAt ? new Date((user.subscription as any).createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-2">Berhenti Pada</p>
                              <p className="text-sm font-semibold text-white/80">
                                {user.subscription.endDate ? new Date(user.subscription.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}


                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </main>
    <Footer />
  </div>
</div>
  );
};

export default ProfilePage;
