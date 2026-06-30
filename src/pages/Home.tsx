import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { QrCode, MapPin, Clock, Music, Sparkles, Coffee, Heart, Play, Compass, Flame } from 'lucide-react';
import { motion } from 'motion/react';

export function Home() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-20 pb-24 relative text-[#f5f2eb]"
    >
      {/* Ambient background glows */}
      <div className="absolute top-[5%] left-[10%] w-96 h-96 rounded-full bg-[#dcae61]/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] right-[5%] w-[30rem] h-[30rem] rounded-full bg-amber-950/15 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[5%] w-[25rem] h-[25rem] rounded-full bg-[#dcae61]/3 blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#181613] via-[#0f0e0c] to-[#0c0b09] border border-amber-950/15 shadow-2xl">
        {/* Top down coffee view with ambient dark overlay */}
        <div className="absolute inset-0 opacity-45 mix-blend-lighten">
          <img
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1600"
            alt="Flux Zone Coffee Experience"
            className="h-full w-full object-cover scale-105 transition-transform duration-10000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0b] via-[#0e0d0b]/80 to-transparent" />
        </div>
        
        {/* Ambient grids and lighting */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(220,174,97,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(220,174,97,0.015)_1px,transparent_1px)] bg-[size:5rem_5rem]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-24 text-center md:py-36 max-w-5xl mx-auto">
          {/* Tagline */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dcae61]/10 border border-[#dcae61]/20 text-[#dcae61] text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#dcae61] animate-pulse" />
            FEEL THE FREQUENCY
          </motion.div>

          {/* Slogan */}
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-6xl md:text-7.5xl font-black tracking-tight leading-none text-white font-sans"
          >
            Kahve ile ritmin <br/>
            <span className="bg-clip-text bg-gradient-to-r from-[#dcae61] via-[#f3d9ab] to-amber-500 drop-shadow-[0_2px_15px_rgba(220,174,97,0.15)]">
              buluştuğu nokta
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-sm sm:text-base md:text-lg text-neutral-400 font-medium leading-relaxed"
          >
            Her şey akışta. Enerji, müzik ve tat aynı frekansta birleşiyor. Sen sadece akışta kal.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto"
          >
            <Link to="/menu" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm h-13 px-8 button-3d-primary rounded-full tracking-wider">
                Menüyü İncele ↗
              </Button>
            </Link>
            <a href="#about" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm h-13 px-8 button-3d-secondary rounded-full tracking-wider">
                Bizi Keşfet
              </Button>
            </a>
          </motion.div>

          {/* Quick info badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-14 flex flex-wrap justify-center gap-6 text-xs font-bold text-neutral-400 tracking-wider uppercase border-t border-amber-950/10 pt-8 w-full"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#dcae61]" />
              İncesu - Atakum / Samsun
            </span>
            <span className="hidden sm:inline text-neutral-600">•</span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#dcae61]" />
              Her Gün 10:00 – 24:00
            </span>
          </motion.div>
        </div>
      </section>

      {/* Rhythmic Scrolling Banner / Marquee */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-amber-950/20 via-[#12110e]/40 to-amber-950/20 border-y border-amber-950/10 py-5 -mx-4 sm:-mx-8">
        <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite] gap-12 text-sm sm:text-base font-black tracking-widest text-[#dcae61] uppercase">
          <span>Feel the Frequency</span>
          <span className="text-amber-700">✹</span>
          <span>Akışta Kal</span>
          <span className="text-amber-700">✹</span>
          <span className="text-white">FLUX ZONE</span>
          <span className="text-amber-700">✹</span>
          <span>Kahve • Müzik • Ritim</span>
          <span className="text-amber-700">✹</span>
          <span>Feel the Frequency</span>
          <span className="text-amber-700">✹</span>
          <span>Akışta Kal</span>
          <span className="text-amber-700">✹</span>
          <span className="text-white">FLUX ZONE</span>
          <span className="text-amber-700">✹</span>
          <span>Kahve • Müzik • Ritim</span>
        </div>
      </div>

      {/* About Section - Bento Style */}
      <section id="about" className="mx-auto max-w-6xl w-full grid md:grid-cols-2 gap-10 items-center scroll-mt-24">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#dcae61] uppercase">
            <span>✹</span> Hoş Geldiniz
          </div>
          <h2 className="text-3xl sm:text-4.5xl font-black tracking-tight leading-tight text-white">
            Kahve deneyiminin <br/>öncü merkezi
          </h2>
          <div className="h-1 w-20 bg-[#dcae61] rounded" />
          
          <div className="text-sm sm:text-base text-neutral-400 space-y-4 font-medium leading-relaxed">
            <p>
              FLUX; kahveyle enerjiyi, müzikle ruhu birleştiren yeni nesil bir yaşam alanıdır. Özenle seçilmiş kahve çekirdeklerinden ustalıkla hazırlanan içeceklerimiz, her yudumda mükemmelliği yaşatır. Aradığınız kaliteyi, modern yaşam tarzının dinamizmiyle buluşturuyoruz.
            </p>
            <p className="border-l-2 border-[#dcae61]/30 pl-4 italic text-neutral-300">
              Burada kahve içmek bir ritüel değil, bir akış halidir. Her detay sizi kendi "flow" alanınıza davet eder, günün her anını özel kılar.
            </p>
          </div>
          
          <div className="pt-2">
            <Link to="/menu">
              <Button className="button-3d-secondary rounded-full px-6 h-11 text-xs uppercase tracking-widest font-bold">
                Deneyimi Keşfet ➔
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Top down visual representation matching the mug in screenshot */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden aspect-square border border-amber-950/20 shadow-2xl group"
        >
          <img 
            src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800"
            alt="Artisan Latte Top View" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-[#dcae61] animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase text-white">Akışın Frekansı</span>
          </div>
        </motion.div>
      </section>

      {/* Rhythms & Flow Pillars - FLUX - Akışın Frekansı */}
      <section className="space-y-12 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold tracking-widest text-[#dcae61] uppercase">✹ Deneyim</span>
          <h2 className="text-3xl sm:text-4.5xl font-black text-white">FLUX — Akışın Frekansı</h2>
          <p className="text-neutral-400 max-w-md mx-auto text-sm sm:text-base font-medium">
            Her şey basit bir fikirle başladı: Kahvenin enerjisiyle müziğin ritmi buluştuğunda bir akış alanı oluşur.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card className="card-3d border-none flex flex-col justify-between p-6 h-64 hover:border-[#dcae61]/35 hover:translate-y-[-4px] transition-all duration-300">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#dcae61]">01 — RİTİM</span>
              <h3 className="text-lg font-bold text-white mt-3 mb-2">Enerji & Müzik</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Barın doğal taş dokusu, bohem-modern tasarım, loş ışıklar ve house ritimlerle birleşen atmosfer. Mekanın frekansı, günün ritmini ayarlar.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Acoustic / House</span>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="card-3d border-none flex flex-col justify-between p-6 h-64 hover:border-[#dcae61]/35 hover:translate-y-[-4px] transition-all duration-300">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#dcae61]">02 — ÖZ</span>
              <h3 className="text-lg font-bold text-white mt-3 mb-2">Ritüel Değil, Akış</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                FLUX; değişim, enerji ve hareket demektir. Modern hayatın en doğal yansıması olarak, her bardağımızda akışın özünü hissettiririz.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Specialty Beans</span>
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="card-3d border-none flex flex-col justify-between p-6 h-64 hover:border-[#dcae61]/35 hover:translate-y-[-4px] transition-all duration-300">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#dcae61]">03 — AN</span>
              <h3 className="text-lg font-bold text-white mt-3 mb-2">Her An "Flow"</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Sabah kahvesini yudumlarken duyduğun huzurdan, gece müziğinin içinde hissettiğin enerjiye kadar. Her an, kusursuz akış.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Seamless Moment</span>
            </div>
          </Card>

          {/* Card 4 */}
          <Card className="card-3d border-none flex flex-col justify-between p-6 h-64 hover:border-[#dcae61]/35 hover:translate-y-[-4px] transition-all duration-300">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#dcae61]">04 — ALAN</span>
              <h3 className="text-lg font-bold text-white mt-3 mb-2">Frekans & Enerji</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Burası sadece bir kafe değil; bir frekans, bir enerji alanı, bir yaşam biçimi. İlham veren topluluğun buluşma noktası.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Atakum Samsun</span>
            </div>
          </Card>

          {/* Card 5 */}
          <Card className="card-3d border-none flex flex-col justify-between p-6 h-64 hover:border-[#dcae61]/35 hover:translate-y-[-4px] transition-all duration-300">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#dcae61]">05 — HAREKET</span>
              <h3 className="text-lg font-bold text-white mt-3 mb-2">Kahve Seni Başlatır</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Kahve seni başlatır, müzik seni akıtır. Sen sadece akışta kal. Gözlerini kapat, frekansı hisset ve ritmi yakala.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Start the Wave</span>
            </div>
          </Card>

          {/* Card 6 */}
          <Card className="card-3d border-none flex flex-col justify-between p-6 h-64 hover:border-[#dcae61]/35 hover:translate-y-[-4px] transition-all duration-300">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#dcae61]">06 — BAĞLANTI</span>
              <h3 className="text-lg font-bold text-white mt-3 mb-2">Feel the Frequency</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Frekansı hisset, akışta kal. FLUX'ta her an doğru frekandasın. Geri kalan her şey kendiliğinden akar.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="text-[9px] font-bold tracking-wider text-neutral-500 uppercase">Universal Wave</span>
            </div>
          </Card>
        </div>
      </section>

      {/* QR Code Scan Experience matching Mockup */}
      <section className="rounded-[2.5rem] bg-gradient-to-br from-[#12110f] to-[#1a1815] border border-amber-950/10 p-8 sm:p-14 shadow-2xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#dcae61]/5 blur-3xl pointer-events-none" />
        
        <div className="grid md:grid-cols-5 gap-10 items-center relative z-10 max-w-5xl mx-auto">
          <div className="md:col-span-3 space-y-6">
            <span className="text-xs font-bold tracking-widest text-[#dcae61] uppercase">✹ DİJİTAL MENÜ</span>
            <h2 className="text-3xl sm:text-4.5xl font-black text-white leading-tight">
              Frekansını seç,<br/>sıradakini akıt
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-medium">
              QR kodu okut ya da dokun — güncel kahve, soğuk içecek ve atıştırmalık menümüze anında göz at. Menümüz mevsime ve akışa göre tazelenir.
            </p>
            <div className="pt-2">
              <Link to="/menu">
                <Button className="button-3d-primary rounded-full px-8 h-13 tracking-wider text-xs uppercase font-bold">
                  Dijital Menüyü Aç ↗
                </Button>
              </Link>
            </div>
          </div>

          {/* Premium QR Graphic from image mockup */}
          <div className="md:col-span-2 flex justify-center">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-white p-6 rounded-3xl border border-neutral-200/50 shadow-2xl flex flex-col items-center gap-4 w-64 text-slate-900"
            >
              <div className="relative">
                <QrCode className="h-44 w-44 text-slate-900 stroke-[1.5]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
                    <span className="text-[#dcae61] text-lg font-black">▲</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">MENÜ İÇİN OKUT</span>
                <p className="text-xs font-bold text-slate-600 mt-1">Masadaki Akışa Katıl</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer Contact Details Banner matching lower part of screenshot */}
      <section className="mx-auto max-w-5xl w-full border-t border-amber-950/10 pt-12">
        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-3 bg-[#12110e]/40 p-6 rounded-2xl border border-amber-950/5">
            <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase block">ADRES</span>
            <p className="text-sm font-bold text-white">İncesu Yalı Mah. 6081 Sok. No:9</p>
            <p className="text-xs text-neutral-400">Atakum / Samsun</p>
          </div>

          <div className="space-y-3 bg-[#12110e]/40 p-6 rounded-2xl border border-amber-950/5">
            <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase block">ÇALIŞMA SAATLERİ</span>
            <p className="text-sm font-bold text-white">Her gün 10:00 – 24:00</p>
            <p className="text-xs text-neutral-400">Sabah kahvesinden gece akışına kadar.</p>
          </div>

          <div className="space-y-3 bg-[#12110e]/40 p-6 rounded-2xl border border-amber-950/5">
            <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase block">İLETİŞİM</span>
            <p className="text-sm font-bold text-[#dcae61] hover:underline cursor-pointer">@fluxzone.coffee ↗</p>
            <p className="text-xs text-neutral-400">İletişim ve iş birlikleri için.</p>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </motion.div>
  );
}
