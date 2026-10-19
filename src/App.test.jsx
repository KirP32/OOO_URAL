import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { createAppStore } from './store/search';
import { deferred, emptyProduct, product, response } from './test/fixtures';

function renderApp() {
  const store = createAppStore();
  const user = userEvent.setup();
  render(<Provider store={store}><App /></Provider>);
  return { store, user };
}

async function connect(user) {
  await user.type(screen.getByLabelText('API-ключ покупателя'), 'test-key');
  await user.click(screen.getByRole('button', { name: 'Использовать ключ' }));
}

async function search(user, number = '7160500039S') {
  await user.type(screen.getByRole('textbox', { name: 'Артикул запчасти' }), number);
  await user.click(screen.getByRole('button', { name: 'Найти' }));
}

describe('Two-stage parts search', () => {
  it.each(['click', 'enter'])('guides the user to the key without searching via %s', async (method) => {
    const fetch = vi.fn().mockResolvedValue(response({ goods: [product] }));
    vi.stubGlobal('fetch', fetch);
    const { user } = renderApp();
    await user.type(screen.getByRole('textbox', { name: 'Артикул запчасти' }), '123');
    vi.useFakeTimers();
    await act(async () => vi.advanceTimersByTimeAsync(500));
    vi.useRealTimers();
    expect(fetch).not.toHaveBeenCalled();
    if (method === 'click') await user.click(screen.getByRole('button', { name: 'Найти' }));
    else await user.keyboard('{Enter}');
    const keyInput = screen.getByLabelText('API-ключ покупателя');
    expect(keyInput).toHaveFocus();
    expect(keyInput).toHaveAttribute('aria-invalid', 'true');
    expect(keyInput).toHaveAccessibleDescription('Добавьте API-ключ, чтобы начать поиск.');
    expect(screen.getByRole('alert')).toHaveTextContent('Добавьте API-ключ');
    expect(fetch).not.toHaveBeenCalled();
    await connect(user);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Выбрать производителя MEYLE' })).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Отключить' }));
    expect(screen.getByLabelText('API-ключ покупателя')).not.toHaveAttribute('aria-invalid');
  });

  it('requires a personal key and never stores it in browser storage', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const localWrite = vi.spyOn(Storage.prototype, 'setItem');
    const { user } = renderApp();
    await user.type(screen.getByRole('textbox', { name: 'Артикул запчасти' }), '123');
    expect(screen.getByRole('button', { name: 'Найти' })).toBeEnabled();
    expect(fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Очистить артикул' }));
    await connect(user);
    expect(screen.getByRole('heading', { name: 'API-ключ добавлен' })).toBeVisible();
    expect(localWrite).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Отключить' }));
    expect(screen.getByLabelText('API-ключ покупателя')).toHaveValue('');
  });

  it('loads brands then offers, shows per-warehouse values and keeps results when the selected brand is clicked again', async () => {
    const brands = deferred();
    const offers = deferred();
    const fetch = vi.fn().mockReturnValueOnce(brands.promise).mockReturnValueOnce(offers.promise);
    vi.stubGlobal('fetch', fetch);
    const { user } = renderApp();
    await connect(user);
    await search(user);
    expect(screen.getByRole('status')).toHaveTextContent('Ищем производителей');
    await act(async () => brands.resolve(response({ goods: [product] })));
    await user.click(await screen.findByRole('button', { name: 'Выбрать производителя MEYLE' }));
    expect(screen.getByRole('status')).toHaveTextContent('Загружаем предложения');
    expect(fetch.mock.calls[1][0].searchParams.get('number')).toBe('7160500039S');
    expect(fetch.mock.calls[1][0].searchParams.get('brand')).toBe('MEYLE');
    expect(fetch.mock.calls[1][0].searchParams.get('analogues')).toBe('on');
    await act(async () => offers.resolve(response({ goods: [product] })));
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(5);
    expect(rows[1]).toHaveTextContent(/12\s533,62/);
    expect(rows[1]).toHaveTextContent('20 шт.');
    expect(rows[2]).toHaveTextContent('3 шт.');
    expect(rows[3]).toHaveTextContent('Mapco');
    expect(rows[3]).toHaveTextContent(/8\s680,2/);
    expect(rows[4]).toHaveTextContent('Нет цены');
    expect(rows[4]).toHaveTextContent('Нет в наличии');
    expect(table).not.toHaveTextContent('999');
    await user.click(screen.getByRole('button', { name: 'Выбрать производителя MEYLE' }));
    expect(screen.getByRole('table')).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Очистить артикул' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Артикул запчасти' })).toHaveFocus();
  });

  it('automatically searches after typing stops and cancels the previous debounce', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ goods: [product] })));
    const { user } = renderApp();
    await connect(user);
    const input = screen.getByRole('textbox', { name: 'Артикул запчасти' });
    vi.useFakeTimers();
    fireEvent.change(input, { target: { value: '716' } });
    await act(async () => vi.advanceTimersByTimeAsync(300));
    fireEvent.change(input, { target: { value: '7160500039S' } });
    await act(async () => vi.advanceTimersByTimeAsync(449));
    expect(fetch).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0].searchParams.get('number')).toBe('7160500039S');
    expect(screen.getByRole('button', { name: 'Выбрать производителя MEYLE' })).toBeVisible();
  });

  it('ignores an old response after a new article is entered', async () => {
    const old = deferred();
    const fetch = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce(response({ goods: [{ ...product, brand: 'BOSCH' }] }));
    vi.stubGlobal('fetch', fetch);
    const { user } = renderApp();
    await connect(user);
    await search(user, 'OLD');
    const input = screen.getByRole('textbox', { name: 'Артикул запчасти' });
    await user.clear(input);
    await search(user, 'NEW');
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(await screen.findByRole('button', { name: 'Выбрать производителя BOSCH' })).toBeVisible();
    await act(async () => old.resolve(response({ goods: [product] })));
    expect(screen.queryByRole('button', { name: 'Выбрать производителя MEYLE' })).not.toBeInTheDocument();
  });

  it('ignores old offers when another brand is selected', async () => {
    const oldOffers = deferred();
    const fetch = vi.fn()
      .mockResolvedValueOnce(response({ goods: [product, { ...product, brand: 'BOSCH' }] }))
      .mockReturnValueOnce(oldOffers.promise)
      .mockResolvedValueOnce(response({ goods: [{ ...product, brand: 'BOSCH', analogues: [] }] }));
    vi.stubGlobal('fetch', fetch);
    const { user } = renderApp();
    await connect(user);
    await search(user);
    await user.click(await screen.findByRole('button', { name: 'Выбрать производителя MEYLE' }));
    await user.click(screen.getByRole('button', { name: 'Выбрать производителя BOSCH' }));
    expect(await screen.findByRole('table')).toHaveTextContent('BOSCH');
    await act(async () => oldOffers.resolve(response({ goods: [product] })));
    expect(screen.getByRole('table')).not.toHaveTextContent('MEYLE');
    expect(fetch.mock.calls[1][1].signal.aborted).toBe(true);
  });

  it('shows a meaningful empty result for the documented blank record', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ goods: [emptyProduct] })));
    const { user } = renderApp();
    await connect(user);
    await search(user);
    expect(await screen.findByRole('heading', { name: 'Производители не найдены' })).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('handles a failed brand request and retries successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(response({ goods: [product] })));
    const { user } = renderApp();
    await connect(user);
    await search(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Проверьте интернет');
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('button', { name: 'Выбрать производителя MEYLE' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an offers error, then an empty response after retry', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({ goods: [product] }))
      .mockResolvedValueOnce(response({ error: 'Request quota exceeded!' }))
      .mockResolvedValueOnce(response({ goods: [] })));
    const { user } = renderApp();
    await connect(user);
    await search(user);
    await user.click(await screen.findByRole('button', { name: 'Выбрать производителя MEYLE' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Лимит запросов');
    expect(screen.getByRole('button', { name: 'Выбрать производителя MEYLE' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('heading', { name: 'Предложений пока нет' })).toBeVisible();
  });

  it('clears results and cancels pending requests when the key is removed', async () => {
    const pending = deferred();
    const fetch = vi.fn().mockReturnValue(pending.promise);
    vi.stubGlobal('fetch', fetch);
    const { user } = renderApp();
    await connect(user);
    await search(user);
    await user.click(screen.getByRole('button', { name: 'Отключить' }));
    await act(async () => pending.resolve(response({ goods: [product] })));
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(screen.queryByRole('button', { name: 'Выбрать производителя MEYLE' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Найти' })).toBeEnabled();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
