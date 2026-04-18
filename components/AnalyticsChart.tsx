"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setData(d);
      })
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4 bg-[#FFFBF1] border border-[#E8DAC0] p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFCB88]/20 flex items-center justify-center text-[#A56A00]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          </div>
          <div>
            <span className="text-[#3A2E22] font-bold text-base block leading-none mb-1">Trafik Analizi</span>
            <span className="text-xs text-[#6B5C4A]/60 font-medium">Ziyaretçi ve sayfa görüntülenme istatistikleri</span>
          </div>
        </div>
        <div className="flex bg-[#FFFDF5] border border-[#E8DAC0] rounded-xl p-1 shadow-sm">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${days === d ? 'bg-[#EFCB88] text-[#3A2E22]' : 'text-[#6B5C4A] hover:bg-[#E8DAC0]/30'}`}
            >
              Son {d} Gün
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#A56A00]">
           <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#FFFBF1] border border-[#E8DAC0] p-6 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              </div>
              <h3 className="text-[#6B5C4A] font-bold text-xs uppercase tracking-widest mb-2 relative z-10">Toplam Görüntülenme</h3>
              <p className="text-4xl font-extrabold text-[#3A2E22] relative z-10">{data.totalViews.toLocaleString('tr-TR')}</p>
              <p className="text-[#6B5C4A]/60 text-xs mt-2 font-medium">Bu dönemde okunan toplam yazı ve sayfa sayısı</p>
            </div>
            <div className="bg-[#FFFBF1] border border-[#E8DAC0] p-6 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
              </div>
              <h3 className="text-[#6B5C4A] font-bold text-xs uppercase tracking-widest mb-2 relative z-10">Tekil Ziyaretçi</h3>
              <p className="text-4xl font-extrabold text-[#3A2E22] relative z-10">{data.uniqueVisitors.toLocaleString('tr-TR')}</p>
              <p className="text-[#6B5C4A]/60 text-xs mt-2 font-medium">Cihaz/Tarayıcı bazında filtrelenmiş net kişi sayısı</p>
            </div>
          </div>

          <div className="bg-[#FFFBF1] border border-[#E8DAC0] p-6 rounded-2xl shadow-sm">
            <h3 className="text-[#3A2E22] font-bold text-base mb-6">Görüntülenme Grafiği</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A56A00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#A56A00" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTekil" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F8F4E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F8F4E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DAC0" vertical={false} />
                  <XAxis dataKey="date" stroke="#6B5C4A" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#6B5C4A" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFBF1', borderColor: '#E8DAC0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#3A2E22', fontWeight: 'bold' }}
                    labelStyle={{ color: '#6B5C4A', marginBottom: '4px' }}
                  />
                  <Area type="monotone" name="Görüntülenme" dataKey="görüntülenme" stroke="#A56A00" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" name="Tekil Ziyaretçi" dataKey="tekil" stroke="#4F8F4E" strokeWidth={2} fillOpacity={1} fill="url(#colorTekil)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {data.topPosts && data.topPosts.length > 0 && (
            <div className="bg-[#FFFBF1] border border-[#E8DAC0] p-6 rounded-2xl shadow-sm">
              <h3 className="text-[#3A2E22] font-bold text-base mb-6 flex items-center gap-2">
                En Çok Okunan Yazılar
              </h3>
              <div className="space-y-4">
                {data.topPosts.map((post: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-[#FFFDF5] rounded-xl border border-[#E8DAC0]/50 hover:border-[#EFCB88] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#EFCB88]/30 flex items-center justify-center font-bold text-[#A56A00] flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#3A2E22] text-sm truncate">{post.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#4F8F4E]/10 text-[#4F8F4E] rounded-lg font-bold text-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                      {post.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 text-red-500">Veriler yüklenemedi.</div>
      )}
    </div>
  );
}
