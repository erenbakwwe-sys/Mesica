import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock, User } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin credentials
    const credentials = [
      { username: 'admin1', password: 'chef123' },
      { username: 'manager', password: 'tau123' },
      { username: 'kitchen', password: 'kitchen123' },
      { username: 'staff', password: 'staff123' }
    ];

    const isValid = credentials.some(
      cred => cred.username === username && cred.password === password
    );

    if (isValid) {
      setError('');
      if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(() => {
          onLogin();
        });
      } else {
        onLogin();
      }
    } else {
      setError('Kullanıcı adı veya şifre yanlış.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-[60vh] items-center justify-center"
    >
      <Card className="w-full max-w-md card-3d border-none shadow-2xl overflow-hidden">
        <CardHeader className="space-y-1 text-center pt-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dcae61]/10 border border-[#dcae61]/10 shadow-inner">
            <Lock className="h-6 w-6 text-[#dcae61]" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-white">Admin Girişi</CardTitle>
          <CardDescription className="text-neutral-400 font-medium text-xs sm:text-sm">
            Flux Zone Coffee yönetim paneline giriş yapın
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 px-6 pb-6">
            {error && (
              <div className="rounded-xl bg-red-950/20 border border-red-900/30 p-3 text-xs sm:text-sm text-red-400 font-semibold">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Kullanıcı Adı</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                <Input 
                  id="username" 
                  placeholder="admin1" 
                  className="pl-10 h-11 bg-neutral-950/50 border-amber-950/20 text-white rounded-xl focus:border-[#dcae61] focus:ring-1 focus:ring-[#dcae61]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 h-11 bg-neutral-950/50 border-amber-950/20 text-white rounded-xl focus:border-[#dcae61] focus:ring-1 focus:ring-[#dcae61]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-6 pb-8">
            <Button type="submit" className="w-full button-3d-primary rounded-full h-12 text-xs uppercase font-bold tracking-widest">
              Giriş Yap
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
