'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/feature/auth';
import { useRouter } from 'next/navigation';
import connectApi from '@/services/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LuWallet, LuArrowUpRight, LuClock, LuCheck, LuCopy, LuLoader, LuChevronLeft, LuChevronRight } from 'react-icons/lu';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
}

const SaldoPage: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copied, setCopied] = useState(false);

  const amountVal = parseFloat(topupAmount.replace(/[.,]/g, '')) || 0;
  const appFeeVal = 2500;
  const taxFeeVal = Math.round(amountVal * 0.11);
  const totalPaymentVal = amountVal + appFeeVal + taxFeeVal;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        await fetchMe();
        const { data } = await connectApi.get(`/payment/transactions?page=${page}&limit=6`);
        setTransactions(data.data);
        setTotalPages(data.meta.totalPages);
      } catch (err) {
        toast.error('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, router, fetchMe, page]);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = amountVal;
    if (amount < 10000) {
      toast.error('Minimum topup adalah Rp 10.000');
      return;
    }
    
    if (amount > 10000000) {
      toast.error('Maksimum topup adalah Rp 10.000.000');
      return;
    }

    const currentBalance = user?.balance || 0;
    if (currentBalance + amount > 10000000000) {
      toast.error('Maksimum saldo adalah Rp 10.000.000.000');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await connectApi.post('/payment/topup', { amount });
      if (data.success) {
        toast.success('Topup berhasil!');
        setTopupAmount('');
        fetchMe(); // Refresh balance
        // Refresh transactions
        const txRes = await connectApi.get('/payment/transactions');
        setTransactions(txRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses topup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toast.success('Kode referral disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalReferralCommission = user?.commissions?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-brand-dark flex">
      <Sidebar />
      <div className="flex-1 lg:pl-72 min-h-screen flex flex-col">
        <main className="flex-1 px-6 md:px-16 lg:px-20 pt-24 md:pt-28 lg:pt-16 pb-32">
          {loading ? (
            <div className="flex items-center justify-center" style={{ minHeight: '600px' }}>
              <LuLoader className="text-purple-500 animate-spin" size={32} />
            </div>
          ) : (
            <div style={{ minHeight: '600px' }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl w-full mx-auto"
              >
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-400 mb-2">Saldo & Referral</h1>
              <p className="text-gray-600 text-xs">Kelola saldo Anda dan pantau komisi referral.</p>
            </div>

            {/* Grid Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Balance Card */}
              <div className="p-8 rounded-4xl bg-white/3 border border-white/5 space-y-6 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                    <LuWallet size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20">Total Saldo</p>
                    <p className="text-3xl font-semibold text-white">Rp {(user?.balance || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                
                {/* Topup Form */}
                <form onSubmit={handleTopup} className="pt-6 border-t border-white/5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-white/20 ml-1">Jumlah Topup</label>
                    <input 
                      type="text"
                      placeholder="Masukkan jumlah topup (Min. Rp 10.000)"
                      value={topupAmount}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^\d]/g, '');
                        setTopupAmount(clean ? parseInt(clean, 10).toLocaleString('id-ID') : '');
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 placeholder:text-gray-600"
                    />
                  </div>

                  {/* Simulasi Fee */}
                  {amountVal >= 10000 && (
                    <div className="p-4 bg-white/2 rounded-2xl border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between text-white/50">
                        <span>Jumlah Pokok</span>
                        <span>Rp {amountVal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>Biaya Aplikasi</span>
                        <span>Rp {appFeeVal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>Pajak (11%)</span>
                        <span>Rp {taxFeeVal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="border-t border-white/5 pt-2 flex justify-between font-semibold text-white">
                        <span>Total Pembayaran</span>
                        <span>Rp {totalPaymentVal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/20"
                  >
                    {isSubmitting ? <LuLoader size={16} className="animate-spin" /> : <LuArrowUpRight size={16} />}
                    Topup Sekarang
                  </button>

                  <button 
                    type="button"
                    onClick={() => alert('Fitur ini masih dalam perbaikan')}
                    className="w-full px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/5"
                  >
                    Tarik Tunai
                  </button>
                </form>
              </div>

              {/* Referral Card */}
              <div className="p-8 rounded-4xl bg-white/3 border border-white/5 space-y-6 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                      <LuWallet size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20">Komisi Referral</p>
                      <p className="text-3xl font-semibold text-white">Rp {totalReferralCommission.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/2 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20">Kode Referral Anda</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-purple-400">{user?.referralCode || '-'}</p>
                      <button 
                        onClick={copyReferralCode}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Salin Kode"
                      >
                        {copied ? (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <LuCheck size={16} className="text-green-500" />
                          </motion.div>
                        ) : (
                          <LuCopy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/30 leading-relaxed mt-4">
                  Bagikan kode referral Anda ke teman. Dapatkan komisi 10% setiap kali mereka melakukan transaksi valid.
                </p>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white/3 rounded-[3rem] border border-white/5 overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="px-10 py-6 border-b border-white/5">
                <h2 className="text-base font-semibold text-white/80">Riwayat Transaksi</h2>
              </div>
              {/* Jgn lupa w-full untuk hindari bug styling table */}
              <div className="overflow-x-auto md:h-[330px] custom-scrollbar">
                <table className="min-w-[820px] w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-white/5 w-full border-b border-white/5">
                      <th className="w-[100px] px-6 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Tanggal</th>
                      <th className="w-[420px] px-6 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Deskripsi</th>
                      <th className="w-[120px] px-6 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Tipe</th>
                      <th className="w-[120px] px-6 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Jumlah</th>
                      <th className="w-[120px] px-6 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-medium text-xs">
                          Belum ada transaksi.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => {
                        const isIncome = tx.type === 'TOPUP' || tx.type === 'REFERRAL_COMMISSION';
                        return (
                          <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                            <td className="px-6 py-2 text-[11px] text-gray-400">
                              {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 text-xs font-medium text-white/80 truncate" title={tx.description}>
                              {tx.description}
                            </td>
                            <td className="px-6 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                isIncome ? 'bg-green-500/10 text-green-400 border-green-500/10' : 'bg-red-500/10 text-red-400 border-red-500/10'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className={`px-6 py-2 font-semibold text-xs truncate ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                              {isIncome ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-2">
                              <span className="inline-flex items-center gap-1 text-[11px] text-green-400 font-medium">
                                <LuCheck size={12} /> {tx.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-4 mt-2 px-6 py-4 border-t border-white/5">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || totalPages === 0}
                  className="w-10 h-10 flex items-center justify-center text-white bg-white/5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10 cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <LuChevronLeft size={16} />
                </button>
                
                <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full flex items-center justify-center gap-2 text-sm font-semibold">
                  <span className="text-white font-bold">{totalPages === 0 ? 0 : page}</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-400">{totalPages}</span>
                </div>

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages || totalPages === 0}
                  className="w-10 h-10 flex items-center justify-center text-white bg-white/5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/10 cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <LuChevronRight size={16} />
                </button>
              </div>
            </div>
              </motion.div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default SaldoPage;
