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

export type OrderStatus = 'Yeni' | 'Hazırlanıyor' | 'Hazır' | 'Teslim Edildi' | 'Ödendi';
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

export interface Table {
  id: string;
  name: string;
  isOpen: boolean;
  openedAt?: Date | null;
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
  deleteOrder: (orderId: string) => void;
  callWaiter: (table: string) => void;
  waiterCalls: WaiterCall[];
  resolveWaiterCall: (id: string) => void;
  tables: Table[];
  openTable: (id: string) => void;
  closeTable: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

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

  // Sync Tables
  useEffect(() => {
    const q = query(collection(db, 'tables'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existingTableIds = new Set(snapshot.docs.map(doc => doc.id));
      const missingTables = [];
      
      for (let i = 1; i <= 20; i++) {
        if (!existingTableIds.has(i.toString())) {
          missingTables.push(i);
        }
      }

      if (missingTables.length > 0) {
        missingTables.forEach(i => {
          const table: Table = {
            id: i.toString(),
            name: `Masa ${i}`,
            isOpen: false,
            openedAt: null
          };
          setDoc(doc(db, 'tables', i.toString()), table).catch(e => handleFirestoreError(e, OperationType.WRITE, 'tables'));
        });
      }

      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          openedAt: data.openedAt?.toDate() || null
        } as Table;
      });
      items.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setTables(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tables');
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
      
      // If table is not open, open it automatically
      const tableObj = tables.find(t => t.name === table);
      if (tableObj && !tableObj.isOpen) {
        await updateDoc(doc(db, 'tables', tableObj.id), {
          isOpen: true,
          openedAt: serverTimestamp()
        });
      }

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

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast.success("Sipariş silindi");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `orders/${orderId}`);
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

  const openTable = async (id: string) => {
    try {
      await updateDoc(doc(db, 'tables', id), {
        isOpen: true,
        openedAt: serverTimestamp()
      });
      toast.success(`Masa ${id} açıldı.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tables/${id}`);
    }
  };

  const closeTable = async (id: string) => {
    try {
      await updateDoc(doc(db, 'tables', id), {
        isOpen: false,
        openedAt: null
      });
      
      // Mark all active orders for this table as 'Ödendi'
      const tableOrders = orders.filter(o => o.table === `Masa ${id}` && o.status !== 'Ödendi');
      for (const order of tableOrders) {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'Ödendi'
        });
      }
      
      // Resolve all active waiter calls for this table
      const tableCalls = waiterCalls.filter(c => c.table === `Masa ${id}` && !c.resolved);
      for (const call of tableCalls) {
        await updateDoc(doc(db, 'waiter_calls', call.id), {
          resolved: true
        });
      }
      
      toast.success(`Masa ${id} kapatıldı ve hesap kesildi.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tables/${id}`);
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
        deleteOrder,
        callWaiter,
        waiterCalls,
        resolveWaiterCall,
        tables,
        openTable,
        closeTable
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
