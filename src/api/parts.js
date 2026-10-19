const API_URL = 'https://api.favorit-parts.ru/hs/hsprice/';

const errorMessages = [
  ['Empty key!', 'Введите API-ключ покупателя.'],
  ['Invalid key client!', 'API-ключ не принят. Проверьте его в личном кабинете Favorit Parts.'],
  ['Invalid access key', 'API-ключ не принят. Проверьте его в личном кабинете Favorit Parts.'],
  ['Empty number goods!', 'Введите артикул детали.'],
  ['Request quota exceeded!', 'Лимит запросов исчерпан. Повторите поиск позже.'],
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function numericValue(value) {
  if (typeof value !== 'number' && !hasText(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function isProduct(value) {
  return isRecord(value) && hasText(value.brand) && hasText(value.number);
}

function parseGoods(payload) {
  if (!isRecord(payload)) throw new Error('Сервис вернул ответ в неожиданном формате.');
  if (payload.error) {
    const message = typeof payload.error === 'string' ? payload.error : '';
    const matches = errorMessages.filter(([code]) => message.includes(code));
    throw new Error(matches.length ? matches.map(([, text]) => text).join(' ') : 'Сервис сообщил об ошибке. Повторите запрос позже.');
  }
  if (!Array.isArray(payload.goods)) throw new Error('Сервис вернул ответ в неожиданном формате.');
  return payload.goods.filter(isProduct);
}

export async function requestGoods({ key, number, brand, signal, timeoutMs = 20000 }) {
  if (!key.trim()) throw new Error('Введите API-ключ покупателя.');
  if (!number.trim()) throw new Error('Введите артикул детали.');
  if (signal?.aborted) throw new DOMException('Запрос отменён', 'AbortError');

  const url = new URL(API_URL);
  url.search = new URLSearchParams({ key: key.trim(), number: number.trim() }).toString();
  if (brand) {
    url.searchParams.set('brand', brand);
    url.searchParams.set('analogues', 'on');
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
    });
    const text = await response.text();
    if (!text.trim()) {
      throw new Error(response.ok ? 'Сервис вернул пустой ответ. Повторите запрос.' : `Сервис недоступен (HTTP ${response.status}). Повторите запрос позже.`);
    }
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(response.ok ? 'Не удалось прочитать ответ сервиса.' : `Сервис недоступен (HTTP ${response.status}). Повторите запрос позже.`);
    }
    if (isRecord(payload) && payload.error) parseGoods(payload);
    if (!response.ok) throw new Error(`Сервис недоступен (HTTP ${response.status}). Повторите запрос позже.`);
    return parseGoods(payload);
  } catch (error) {
    if (timedOut) throw new Error('Сервис не ответил за 20 секунд. Попробуйте ещё раз.');
    if (signal?.aborted) throw new DOMException('Запрос отменён', 'AbortError');
    if (error instanceof TypeError) throw new Error('Не удалось связаться с Favorit Parts. Проверьте интернет или доступность сервиса.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export function extractBrands(goods) {
  const brands = new Map();
  goods.forEach((product) => {
    const name = product.brand.trim();
    const identity = name.toLocaleUpperCase('en-US');
    if (!brands.has(identity)) brands.set(identity, { name, description: product.name || 'Автозапчасть' });
  });
  return [...brands.values()];
}

export function extractOffers(goods) {
  const products = new Map();
  const add = (product, analogue) => {
    if (!isProduct(product)) return;
    const identity = `${product.goodsID || ''}|${product.brand.trim().toUpperCase()}|${product.number.trim().toUpperCase()}`;
    if (!products.has(identity)) products.set(identity, { ...product, identity, analogue });
  };
  goods.forEach((product) => add(product, false));
  goods.forEach((product) => {
    if (Array.isArray(product.analogues)) product.analogues.forEach((analogue) => add(analogue, true));
  });

  return [...products.values()].flatMap((product) => {
    const warehouses = Array.isArray(product.warehouses) ? product.warehouses.filter(isRecord) : [];
    const base = {
      brand: product.brand,
      number: product.number,
      name: hasText(product.name) ? product.name : 'Название не указано',
      analogue: product.analogue,
    };
    if (!warehouses.length) {
      return [{ ...base, id: product.identity, warehouse: 'Склады не указаны', price: null, stock: numericValue(product.count) }];
    }
    return warehouses.map((warehouse, index) => ({
      ...base,
      id: `${product.identity}|${warehouse.id || index}|${index}`,
      warehouse: warehouse.code || warehouse.id || 'Склад без названия',
      price: numericValue(warehouse.price),
      stock: numericValue(warehouse.stock),
    }));
  });
}
