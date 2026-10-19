import { describe, expect, it, vi } from 'vitest';
import { extractBrands, extractOffers, requestGoods } from './parts';
import { emptyProduct, product, response } from '../test/fixtures';

describe('Favorit Parts API', () => {
  it('encodes special characters and requests analogues only with a brand', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ goods: [product] }));
    vi.stubGlobal('fetch', fetch);
    await requestGoods({ key: 'test-key', number: ' A#&/12 ' });
    const first = fetch.mock.calls[0][0];
    expect(first.origin).toBe('https://api.favorit-parts.ru');
    expect(first.searchParams.get('number')).toBe('A#&/12');
    expect(first.searchParams.has('brand')).toBe(false);
    expect(first.searchParams.has('analogues')).toBe(false);
    await requestGoods({ key: 'test-key', number: 'A#&/12', brand: 'MANN & FILTER' });
    const second = fetch.mock.calls[1][0];
    expect(second.searchParams.get('brand')).toBe('MANN & FILTER');
    expect(second.searchParams.get('analogues')).toBe('on');
  });

  it('treats the documented blank product as an empty search', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ goods: [emptyProduct] })));
    expect(await requestGoods({ key: 'test-key', number: 'missing' })).toEqual([]);
  });

  it('deduplicates manufacturers without changing the returned brand for the next request', () => {
    expect(extractBrands([product, { ...product, brand: 'meyle' }])).toEqual([{ name: 'MEYLE', description: product.name }]);
  });

  it('uses warehouse prices and stock, includes analogues and zero-stock products', () => {
    const offers = extractOffers([product]);
    expect(offers).toHaveLength(4);
    expect(offers.map(({ price, stock }) => ({ price, stock }))).toEqual([
      { price: 12533.62, stock: 20 },
      { price: 12890, stock: 3 },
      { price: 8680.2, stock: 19 },
      { price: null, stock: 0 },
    ]);
    expect(offers.map((offer) => offer.analogue)).toEqual([false, false, true, true]);
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(4);
  });

  it('does not turn missing prices or stock into zero', () => {
    const offers = extractOffers([{ ...product, analogues: [], warehouses: [{ id: 'unknown', price: '', stock: null }] }]);
    expect(offers[0]).toMatchObject({ price: null, stock: null });
  });

  it('preserves offers for distinct goods IDs with the same brand and article', () => {
    const offers = extractOffers([{ ...product, analogues: [] }, { ...product, goodsID: 'another-product', analogues: [] }]);
    expect(offers).toHaveLength(4);
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(4);
  });

  it.each([
    [response({ error: 'Invalid key client!' }, 403), /API-ключ не принят/],
    [response({ error: 'Invalid access key' }, 403), /API-ключ не принят/],
    [response({ error: 'Request quota exceeded!' }), /Лимит запросов/],
    [response({ error: 'Empty key! Empty number goods!' }), /Введите API-ключ.*Введите артикул/],
    [response({}, 503), /HTTP 503/],
    [response({ unexpected: [] }), /неожиданном формате/],
    [{ ok: true, status: 200, text: async () => '' }, /пустой ответ/],
    [{ ok: true, status: 200, text: async () => '<html>error</html>' }, /прочитать ответ/],
  ])('handles API errors and malformed responses %#', async (result, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(result));
    await expect(requestGoods({ key: 'test-key', number: '7160500039S' })).rejects.toThrow(message);
  });

  it('shows a readable network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(requestGoods({ key: 'test-key', number: '7160500039S' })).rejects.toThrow(/Проверьте интернет/);
  });

  it('aborts a stalled request after the timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    const request = requestGoods({ key: 'test-key', number: '7160500039S' });
    const assertion = expect(request).rejects.toThrow(/не ответил за 20 секунд/);
    await vi.advanceTimersByTimeAsync(20000);
    await assertion;
  });
});
