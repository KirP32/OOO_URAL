import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowDown, ArrowRight, Check, ChevronRight, CircleHelp, ExternalLink, KeyRound, ScanLine, Search, X } from 'lucide-react';
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

  function clearSearch() {
    dispatch(setNumber(''));
    articleInput.current?.focus();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Перейти к поиску</a>
      <aside className="sidebar">
        <a className="wordmark" href="#main" aria-label="Деталь — к поиску"><span className="logo-mark"><ScanLine size={23} strokeWidth={2.5} aria-hidden="true" /></span>деталь<span className="logo-dot">.</span></a>
        <div className="sidebar-label">КАТАЛОГ ЗАПЧАСТЕЙ</div>
        <div className="sidebar-active"><Search size={18} aria-hidden="true" /> Поиск по артикулу<ChevronRight size={16} aria-hidden="true" /></div>
        <div className="workflow">
          <p className="sidebar-label">ДВА ШАГА К РЕЗУЛЬТАТУ</p>
          <div className={`workflow-step ${selectedBrand ? 'done' : 'active'}`}><span className="step-index">{selectedBrand ? <Check size={14} aria-hidden="true" /> : '01'}</span><div><strong>Артикул и бренд</strong><p>Найдите производителя</p></div></div>
          <div className="step-connector" />
          <div className={`workflow-step ${selectedBrand ? 'active' : ''}`}><span className="step-index">02</span><div><strong>Предложения</strong><p>Сравните цены и остатки</p></div></div>
        </div>
        <div className="sidebar-bottom"><div className="sidebar-help"><CircleHelp size={21} aria-hidden="true" /><h2>Всё начинается<br />с номера детали</h2><p>Артикул можно найти на упаковке или на самой запчасти.</p></div><div className="data-provider"><span className="provider-dot" /><div><span>Источник данных</span><strong>Favorit Parts</strong></div><ExternalLink size={14} aria-hidden="true" /></div></div>
      </aside>
      <div className="main-layout">
        <header className="topbar"><div className="breadcrumb-label">Каталог <ChevronRight size={13} aria-hidden="true" /> <span>Поиск запчастей</span></div><a href="https://lk.favorit-parts.ru/static/wsprice.pdf" target="_blank" rel="noreferrer">Документация API <ExternalLink size={14} aria-hidden="true" /></a></header>
        <main id="main" className="main-content">
          <div className="page-heading"><div><div className="eyebrow page-eyebrow">ТОЧНЫЙ ПОИСК. ПОНЯТНЫЙ ВЫБОР.</div><h1>Нужная деталь.<br /><span>Всё по делу.</span></h1><p>Один артикул — производители, аналоги<br className="desktop-break" /> и предложения по складам.</p></div><div className="heading-badge"><ScanLine size={25} aria-hidden="true" /><span>Поиск<br />по артикулу</span></div></div>
          <ApiKeyForm />
          <section className="search-panel" aria-labelledby="search-title">
            <div className="search-panel-heading"><h2 id="search-title">Какую деталь ищем?</h2><span className="search-step">01 / 02</span></div>
            <form onSubmit={(event) => { event.preventDefault(); searchBrands(); }}>
              <label htmlFor="part-number" className="form-label">Артикул запчасти</label>
              <div className="search-control"><div className="article-input-wrap"><Search size={21} aria-hidden="true" /><input ref={articleInput} id="part-number" className="form-control" placeholder="Например, 7160500039S" value={number} onChange={(event) => dispatch(setNumber(event.target.value))} spellCheck={false} autoComplete="off" aria-describedby="search-hint" />{number && <button className="icon-button" type="button" aria-label="Очистить артикул" onClick={clearSearch}><X size={18} aria-hidden="true" /></button>}</div><button className="btn btn-search" type="submit" disabled={!apiKey || !number.trim()}>Найти <ArrowRight size={18} aria-hidden="true" /></button></div>
              <p id="search-hint" className="search-hint">{apiKey ? <><span className="hint-dot" /> Поиск начнётся автоматически после ввода артикула.</> : <><KeyRound size={13} aria-hidden="true" /> Сначала добавьте API-ключ в блоке выше.</>}</p>
            </form>
          </section>
          <BrandList onRetry={searchBrands} />
          <OffersTable onRetry={searchOffers} />
          {brands.status === 'idle' && <div className="welcome-state"><div className="welcome-graphic"><span /><ScanLine size={37} strokeWidth={1.2} aria-hidden="true" /></div><h2>Начните с артикула</h2><p>Найдём доступных производителей.<br />Выберите бренд, чтобы увидеть цены и аналоги.</p><div className="welcome-flow"><span>Артикул</span><ArrowRight size={13} aria-hidden="true" /><span>Бренд</span><ArrowRight size={13} aria-hidden="true" /><span>Предложения</span></div></div>}
          {brands.status === 'success' && brands.items.length > 0 && !selectedBrand && <div className="selection-hint"><ArrowDown size={18} aria-hidden="true" /> Выберите производителя, чтобы загрузить предложения и аналоги</div>}
          <footer className="page-footer"><span>Деталь · поиск автозапчастей</span><span>Данные предоставлены Favorit Parts</span></footer>
        </main>
      </div>
    </div>
  );
}
