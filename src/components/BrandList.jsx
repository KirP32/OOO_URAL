import { ArrowUpRight, Check, Factory } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBrand } from '../store/search';
import { EmptyState, ErrorState, Loader } from './RequestState';

export default function BrandList({ onRetry }) {
  const dispatch = useDispatch();
  const { brands, selectedBrand, number } = useSelector((state) => state.search);
  if (brands.status === 'idle') return null;

  return (
    <section className="results-section" aria-labelledby="brands-title" aria-busy={brands.status === 'loading'}>
      <div className="section-heading"><div><span className="eyebrow">ШАГ 01</span><h2 id="brands-title">Выберите производителя {brands.status === 'success' && <span className="count-badge">{brands.items.length}</span>}</h2></div><Factory size={22} aria-hidden="true" /></div>
      {brands.status === 'loading' && <Loader>Ищем производителей…</Loader>}
      {brands.status === 'error' && <ErrorState message={brands.error} onRetry={onRetry} />}
      {brands.status === 'success' && (brands.items.length ? (
        <div className="brand-grid">
          {brands.items.map((brand) => (
            <button type="button" key={brand.name} className={`brand-card ${selectedBrand === brand.name ? 'selected' : ''}`} aria-pressed={selectedBrand === brand.name} aria-label={`Выбрать производителя ${brand.name}`} onClick={() => dispatch(selectBrand(brand.name))}>
              <span className="brand-card-top"><strong>{brand.name}</strong>{selectedBrand === brand.name ? <Check size={20} aria-hidden="true" /> : <ArrowUpRight size={19} aria-hidden="true" />}</span>
              <span className="brand-description">{brand.description}</span>
              <span className="brand-number">{number.trim()}</span>
            </button>
          ))}
        </div>
      ) : <EmptyState title="Производители не найдены">Проверьте артикул «{number.trim()}» или попробуйте другой номер детали.</EmptyState>)}
    </section>
  );
}
