import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { QrCode, Smartphone, CreditCard, Utensils, BellRing, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function Home() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-16 pb-16"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] bg-orange-950 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://storage.googleapis.com/aistudio-user-content-prod-eu-west2/project-157180437280/f7868010-09a5-4889-8086-1e634ed19047/tacos.jpg"
            alt="Tacos Background"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-950 to-orange-900/80 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-32 text-center md:py-48">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
          >
            Modern Dijital Restoran Deneyimi
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg text-orange-100 sm:text-xl"
          >
            QR menü ve dijital sipariş ile hızlı, modern ve temassız restoran deneyimi.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row justify-center"
          >
            <Link to="/menu">
              <Button size="lg" className="w-full sm:w-auto text-base h-14 px-12 bg-orange-500 hover:bg-orange-400 text-white border-none">
                Menüyü Gör
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Sistem Özellikleri</h2>
          <p className="mt-4 text-lg text-slate-600">Restoranınızı geleceğe taşıyacak modern çözümler.</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur hover:shadow-md transition-all duration-300">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <QrCode className="h-6 w-6" />
              </div>
              <CardTitle>QR Menü</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Müşterileriniz masalarındaki QR kodu okutarak güncel menünüze anında ulaşsın.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 backdrop-blur hover:shadow-md transition-all duration-300">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Smartphone className="h-6 w-6" />
              </div>
              <CardTitle>Dijital Sipariş</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Garson beklemeden, doğrudan telefondan sipariş verin. Siparişler anında mutfağa düşsün.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 backdrop-blur hover:shadow-md transition-all duration-300">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <CardTitle>Hızlı Ödeme</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Hesap isteme derdine son. Masadan kalkmadan dijital olarak hesabınızı ödeyin.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-[2rem] bg-orange-50 px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Nasıl Çalışır?</h2>
          <p className="mt-4 text-lg text-slate-600">Sadece 3 basit adımda kusursuz deneyim.</p>
        </div>
        
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-orange-200" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border-4 border-orange-50 text-orange-600 text-3xl font-bold">
                1
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">QR Kodu Tara</h3>
              <p className="mt-2 text-slate-600">Masadaki QR kodu telefonunuzun kamerasıyla okutun.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border-4 border-orange-50 text-orange-600 text-3xl font-bold">
                2
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Menüden Sipariş Ver</h3>
              <p className="mt-2 text-slate-600">Dijital menüden ürünleri seçip sepetinize ekleyin.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border-4 border-orange-50 text-orange-600 text-3xl font-bold">
                3
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Siparişin Masaya Gelsin</h3>
              <p className="mt-2 text-slate-600">Siparişiniz anında mutfağa iletilir ve masanıza servis edilir.</p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
