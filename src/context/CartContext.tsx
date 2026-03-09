import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from '../data/menu';
import { playSound } from '../lib/sounds';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp, 
  setDoc,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus = 'Yeni' | 'Hazırlanıyor' | 'Hazır' | 'Teslim Edildi';
export type PaymentMethod = 'Nakit' | 'Kart';

export interface WaiterCall {
  id: string;
  table: string;
  time: Date;
  resolved: boolean;
}

export interface Order {
  id: string;
  table: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  paymentMethod: PaymentMethod;
  note?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface CartContextType {
  menuItems: MenuItem[];
  addMenuItem: (item: MenuItem) => void;
  removeMenuItem: (itemId: string) => void;
  cart: CartItem[];
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  total: number;
  orders: Order[];
  placeOrder: (table: string, paymentMethod: PaymentMethod, note?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  callWaiter: (table: string) => void;
  waiterCalls: WaiterCall[];
  resolveWaiterCall: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Sync Menu
  useEffect(() => {
    const q = query(collection(db, 'menu'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty && !localStorage.getItem('casa_mexicana_menu_seeded')) {
        localStorage.setItem('casa_mexicana_menu_seeded', 'true');
        // Populate initial menu if empty
        INITIAL_MENU_ITEMS.forEach(async (item) => {
          try {
            await setDoc(doc(db, 'menu', item.id), item);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, 'menu');
          }
        });
      } else {
        localStorage.setItem('casa_mexicana_menu_seeded', 'true');
        const items = snapshot.docs.map(doc => doc.data() as MenuItem);
        setMenuItems(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'menu');
    });
    return () => unsubscribe();
  }, []);

  // Sync Orders
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formatted = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Order;
      });

      setOrders(prev => {
        const newOrders = formatted.filter(fo => !prev.some(po => po.id === fo.id));
        if (newOrders.length > 0 && prev.length > 0) {
          playSound('new_order');
          toast.success(`Yeni sipariş geldi! (${newOrders[0].table})`);
        } else {
          formatted.forEach(fo => {
            const existing = prev.find(po => po.id === fo.id);
            if (existing && existing.status !== fo.status) {
              if (fo.status === 'Hazırlanıyor') {
                playSound('preparing');
                toast.info(`Sipariş hazırlanıyor (${fo.table})`);
              } else if (fo.status === 'Hazır') {
                playSound('ready');
                toast.success(`Sipariş hazır! (${fo.table})`);
              } else if (fo.status === 'Teslim Edildi') {
                playSound('delivered');
                toast(`Sipariş teslim edildi (${fo.table})`);
              }
            }
          });
        }
        return formatted;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsubscribe();
  }, []);

  // Sync Waiter Calls
  useEffect(() => {
    const q = query(collection(db, 'waiter_calls'), orderBy('time', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formatted = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          time: data.time?.toDate() || new Date()
        } as WaiterCall;
      });

      setWaiterCalls(prev => {
        const newCalls = formatted.filter(fc => !fc.resolved && !prev.some(pc => pc.id === fc.id));
        if (newCalls.length > 0 && prev.length > 0) {
          playSound('waiter');
          toast.warning(`Garson çağrıldı: ${newCalls[0].table}`);
        }
        return formatted;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'waiter_calls');
    });
    return () => unsubscribe();
  }, []);

  const addMenuItem = async (item: MenuItem) => {
    try {
      await setDoc(doc(db, 'menu', item.id), item);
      toast.success(`${item.name} menüye eklendi!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'menu');
    }
  };

  const removeMenuItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'menu', itemId));
      setCart((prev) => prev.filter(item => item.id !== itemId));
      toast.success('Ürün menüden başarıyla silindi.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'menu');
    }
  };

  const addToCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const menuItem = menuItems.find((item) => item.id === itemId);
      if (menuItem) {
        return [...prev, { ...menuItem, quantity: 1 }];
      }
      return prev;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== itemId);
    });
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = async (table: string, paymentMethod: PaymentMethod, note?: string) => {
    if (cart.length === 0) return;
    
    const newOrder = {
      table,
      items: [...cart],
      total,
      status: 'Yeni',
      createdAt: serverTimestamp(),
      paymentMethod,
      note: note || '',
    };
    
    try {
      await addDoc(collection(db, 'orders'), newOrder);
      clearCart();
      playSound('new_order');
      toast.success("Siparişiniz mutfağa gönderildi.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      if (status === 'Hazırlanıyor') {
        playSound('preparing');
        toast.info("Sipariş hazırlanıyor");
      } else if (status === 'Hazır') {
        playSound('ready');
        toast.success("Sipariş hazır!");
      } else if (status === 'Teslim Edildi') {
        playSound('delivered');
        toast("Sipariş teslim edildi");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const callWaiter = async (table: string) => {
    const newCall = {
      table,
      time: serverTimestamp(),
      resolved: false
    };
    try {
      await addDoc(collection(db, 'waiter_calls'), newCall);
      playSound('waiter');
      toast.success("Garsona bildirim gönderildi.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'waiter_calls');
    }
  };

  const resolveWaiterCall = async (id: string) => {
    try {
      await updateDoc(doc(db, 'waiter_calls', id), { resolved: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `waiter_calls/${id}`);
    }
  };

  return (
    <CartContext.Provider
      value={{
        menuItems,
        addMenuItem,
        removeMenuItem,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        total,
        orders,
        placeOrder,
        updateOrderStatus,
        callWaiter,
        waiterCalls,
        resolveWaiterCall,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
