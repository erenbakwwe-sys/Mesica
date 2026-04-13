import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { QrCode, Smartphone, CreditCard, MapPin, Phone, Clock } from 'lucide-react';
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
      <section className="relative overflow-hidden rounded-[2rem] bg-blue-950 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://picsum.photos/seed/seafoodrestaurant/1920/1080"
            alt="Seafood Background"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-blue-900/80 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-32 text-center md:py-48">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
          >
            İzmir Deniz Restaurant
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg text-blue-100 sm:text-xl"
          >
            Balık, kalamar, karides, ahtapot, sardalya ve çorba servis edilen mütevazı deniz ürünleri restoranı.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row justify-center"
          >
            <Link to="/menu">
              <Button size="lg" className="w-full sm:w-auto text-base h-14 px-12 bg-blue-500 hover:bg-blue-400 text-white border-none">
                Menüyü Gör
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Info Section */}
      <section className="mx-auto max-w-5xl w-full">
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <MapPin className="h-6 w-6" />
              </div>
              <CardTitle>Adres</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base text-slate-600">
                İzmir Palas Oteli, Kültür, Atatürk Cd. No: 188/B Zemin Kat, 35220 Konak/İzmir
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 backdrop-blur hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Phone className="h-6 w-6" />
              </div>
              <CardTitle>İletişim</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base text-slate-600">
                (0232) 464 44 99<br/>
                denizrestaurant.com.tr
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 backdrop-blur hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <CardTitle>Çalışma Saatleri</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base text-slate-600">
                Hergün Açık<br/>
                Kapanış saati: 23:30
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-[2rem] bg-blue-50 px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Dijital Sipariş</h2>
          <p className="mt-4 text-lg text-slate-600">Sadece 3 basit adımda kusursuz deneyim.</p>
        </div>
        
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-blue-200" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border-4 border-blue-50 text-blue-600 text-3xl font-bold">
                1
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">QR Kodu Tara</h3>
              <p className="mt-2 text-slate-600">Masadaki QR kodu telefonunuzun kamerasıyla okutun.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border-4 border-blue-50 text-blue-600 text-3xl font-bold">
                2
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">Menüden Sipariş Ver</h3>
              <p className="mt-2 text-slate-600">Dijital menüden deniz ürünlerini seçip sepetinize ekleyin.</p>
            </div>
            
            <div className="relative flex flex-col items-center text-center">
              <div className="z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border-4 border-blue-50 text-blue-600 text-3xl font-bold">
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
