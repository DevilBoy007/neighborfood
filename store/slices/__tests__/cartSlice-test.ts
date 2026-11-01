import cartReducer, {
  addToCart,
  clearCart,
  removeFromCart,
  selectItemCount,
  selectTotalSubtotal,
  updateItemQuantity,
} from '@/store/slices/cartSlice';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const shop = {
  shopId: 'shop1',
  shopName: 'Farm',
  allowPickup: true,
  localDelivery: false,
};

const apples = { ...shop, itemId: 'apples', name: 'Apples', price: 2.5, quantity: 2 };
const eggs = { ...shop, itemId: 'eggs', name: 'Eggs', price: 4, quantity: 1 };

const reduce = (...actions: Parameters<typeof cartReducer>[1][]) =>
  actions.reduce(cartReducer, cartReducer(undefined, { type: 'init' }));

describe('cartSlice', () => {
  it('groups items by shop and merges repeat adds', () => {
    const state = reduce(addToCart(apples), addToCart(eggs), addToCart(apples));

    expect(state.shopCarts).toHaveLength(1);
    expect(state.shopCarts[0].items.find((i) => i.itemId === 'apples')?.quantity).toBe(4);
    expect(state.shopCarts[0].subtotal).toBe(14);
    expect(selectTotalSubtotal({ cart: state })).toBe(14);
    expect(selectItemCount({ cart: state })).toBe(5);
  });

  it('drops a shop when its last item is removed', () => {
    const state = reduce(addToCart(apples), removeFromCart({ shopId: 'shop1', itemId: 'apples' }));
    expect(state.shopCarts).toEqual([]);
  });

  it('removes an item when its quantity reaches zero', () => {
    const state = reduce(
      addToCart(apples),
      addToCart(eggs),
      updateItemQuantity({ shopId: 'shop1', itemId: 'eggs', quantity: 0 })
    );
    expect(state.shopCarts[0].items.map((i) => i.itemId)).toEqual(['apples']);
    expect(state.shopCarts[0].subtotal).toBe(5);
  });

  it('empties everything on clearCart (used at sign-out)', () => {
    const state = reduce(addToCart(apples), clearCart());
    expect(state.shopCarts).toEqual([]);
  });
});
