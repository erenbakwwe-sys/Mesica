/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { Order } from './pages/Order';
import { Payment } from './pages/Payment';
import { Admin } from './pages/Admin';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <CartProvider>
      <Router>
        <Toaster position="top-center" richColors duration={2000} />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="menu" element={<Menu />} />
            <Route path="order" element={<Order />} />
            <Route path="payment" element={<Payment />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </Router>
    </CartProvider>
  );
}
