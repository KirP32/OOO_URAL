import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X } from 'lucide-react';
import ApiKeyForm from './components/ApiKeyForm';
import BrandList from './components/BrandList';
import OffersTable from './components/OffersTable';
import { fetchBrands, fetchOffers, setNumber } from './store/search';

export default function App() {
  const dispatch = useDispatch();
  const { apiKey, number, selectedBrand, brands } = useSelector((state) => state.search);
  const brandRequest = useRef(null);
  const offerRequest = useRef(null);
  const debounce = useRef(null);
  const articleInput = useRef(null);
  const apiKeyInput = useRef(null);
  const [keyRequired, setKeyRequired] = useState(false);

  const searchBrands = useCallback(() => {
    clearTimeout(debounce.current);
    brandRequest.current?.abort();
    if (apiKey && number.trim()) brandRequest.current = dispatch(fetchBrands(number.trim()));
  }, [apiKey, number, dispatch]);

  const searchOffers = useCallback(() => {
    offerRequest.current?.abort();
    if (apiKey && number.trim() && selectedBrand) offerRequest.current = dispatch(fetchOffers({ number: number.trim(), brand: selectedBrand }));
  }, [apiKey, number, selectedBrand, dispatch]);

  useEffect(() => {
    if (apiKey && number.trim()) debounce.current = setTimeout(searchBrands, 450);
    return () => { clearTimeout(debounce.current); brandRequest.current?.abort(); };
  }, [apiKey, number, searchBrands]);

  useEffect(() => {
    searchOffers();
    return () => offerRequest.current?.abort();
  }, [searchOffers]);

  function submitSearch(event) {
    event.preventDefault();
    if (!apiKey) {
      setKeyRequired(true);
      apiKeyInput.current?.focus({ preventScroll: true });
      apiKeyInput.current?.scrollIntoView?.({ block: 'center' });
      return;
    }
    searchBrands();
  }

  function clearSearch() {
    dispatch(setNumber(''));
    articleInput.current?.focus();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Перейти к поиску</a>
      <header className="site-header">
        <div className="header-content">
          <a className="wordmark" href="#main" aria-label="Деталь — к поиску">ДЕТАЛЬ</a>
          <span className="header-description">Автозапчасти и аналоги</span>
          <a className="connection-link" href="#connection-title">Подключение к Favorit Parts</a>
        </div>
      </header>
      <main id="main" className="main-content">
        <section className="search-panel" aria-labelledby="search-title">
          <h1 id="search-title">Запчасть или артикул</h1>
          <p className="search-description">Введите артикул детали, чтобы найти производителей, цены и аналоги.</p>
          <form onSubmit={submitSearch}>
            <label htmlFor="part-number" className="visually-hidden">Артикул запчасти</label>
            <div className="search-control">
              <div className="article-input-wrap">
                <Search size={24} aria-hidden="true" />
                <input ref={articleInput} id="part-number" className="form-control" placeholder="Например, 01089" value={number} onChange={(event) => dispatch(setNumber(event.target.value))} spellCheck={false} autoComplete="off" aria-describedby="search-hint" />
                {number && <button className="icon-button" type="button" aria-label="Очистить артикул" onClick={clearSearch}><X size={22} aria-hidden="true" /></button>}
              </div>
              <button className="btn btn-search" type="submit" disabled={!number.trim()}>Найти</button>
            </div>
            <p id="search-hint" className="search-hint">{apiKey ? 'Поиск начнётся автоматически после ввода артикула.' : <>Для поиска добавьте свой <a href="#api-key">API-ключ Favorit Parts</a> ниже.</>}</p>
          </form>
        </section>
        <ApiKeyForm inputRef={apiKeyInput} keyRequired={keyRequired && !apiKey} onConnect={() => setKeyRequired(false)} />
        <BrandList onRetry={searchBrands} />
        <OffersTable onRetry={searchOffers} />
        {brands.status === 'success' && brands.items.length > 0 && !selectedBrand && <p className="selection-hint">Выберите производителя, чтобы увидеть предложения и аналоги.</p>}
        <footer className="page-footer">
          <span>Данные предоставлены Favorit Parts</span>
          <a href="https://lk.favorit-parts.ru/static/wsprice.pdf" target="_blank" rel="noreferrer">Документация API</a>
        </footer>
      </main>
    </div>
  );
}
