import React, { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    if (!sumAmount[product.id]) {
      sumAmount[product.id] = 0;
    }
    sumAmount[product.id] = sumAmount[product.id] += product.amount || 0;

    return sumAmount;
  }, {} as CartItemsAmount);

  useEffect(() => {
    async function loadProducts() {
      const productsList = await api.get('/products');
      setProducts(productsList.data);
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  return (
    <ProductList>
      {products.map((p) => {
        return (
          <li key={p.id}>
            <img src={p.image} alt={p.title} />
            <strong>{p.title}</strong>
            <span>{formatPrice(p.price)}</span>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(p.id)}
            >
              <div data-testid="cart-product-quantity">
                <MdAddShoppingCart size={16} color="#FFF" />
                {cartItemsAmount[p.id] || 0}
              </div>

              <span>ADICIONAR AO CARRINHO</span>
            </button>
          </li>
        );
      })}
    </ProductList>
  );
};

export default Home;
