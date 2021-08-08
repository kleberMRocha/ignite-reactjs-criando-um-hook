import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const clone: Product[] = JSON.parse(JSON.stringify(cart));
      let productInCart = clone.find((p) => p.id === productId);

      if (productInCart) {
        updateProductAmount({ productId, amount: productInCart.amount + 1 });
        return;
      }

      const response = await api.get(`products/${productId}`);

      const product: Product = {
        ...response.data,
        amount: 1,
      };

      const updatedCart = JSON.stringify(cart);
      localStorage.setItem(
        '@RocketShoes:cart',
        JSON.stringify([...JSON.parse(updatedCart), product])
      );
      setCart([...JSON.parse(updatedCart), product]);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex((p) => p.id === productId);
      if (productIndex < 0) throw new Error('Erro na remoção do produto');

      const updatedCart = [...cart];
      updatedCart.splice(productIndex, 1);

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) return;
      const clone: Product[] = JSON.parse(JSON.stringify(cart));
      let productInCart = clone.find((p) => p.id === productId);

      if (productInCart && productInCart?.amount <= 0) return;
      const { data: stockProduct } = await api.get(`/stock/${productId}`);

      if (
        stockProduct?.amount === productInCart?.amount &&
        amount > 0 &&
        stockProduct &&
        amount > stockProduct?.amount
      ) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productInCart) {
        const newCart = clone.map((p) => {
          p.id === productId
            ? (p.amount = amount)
            : (p.amount = Number(p.amount));

          return p;
        });
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCart]));
        setCart([...newCart]);
        return;
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
