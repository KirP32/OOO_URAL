export const product = {
  goodsID: 'meyle-1',
  brand: 'MEYLE',
  number: '7160500039S',
  name: 'Комплект рычагов задней подвески',
  count: 23,
  price: 999999,
  warehouses: [
    { id: 'warehouse-1', code: 'МС2', price: 12533.62, stock: 20 },
    { id: 'warehouse-2', code: 'СПБ', price: 12890, stock: 3 },
  ],
  analogues: [
    { goodsID: 'mapco-1', brand: 'Mapco', number: '53612/1', name: 'Комплект рычагов с болтами', count: 19, price: 999999, warehouses: [{ id: 'warehouse-3', code: 'ПТ4', price: 8680.2, stock: 19 }] },
    { goodsID: 'meyle-2', brand: 'MEYLE', number: '7160500039/SK', name: 'Рычаги задней подвески', count: 0, price: 999999, warehouses: [] },
  ],
};

export const emptyProduct = { brand: '', number: '', goodsID: '00000000-0000-0000-0000-000000000000', name: '', count: 0, price: 0, warehouses: [] };

export function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(payload) };
}

export function deferred() {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
}
