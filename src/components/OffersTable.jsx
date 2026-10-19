import { useSelector } from 'react-redux';
import { Layers, Package } from 'lucide-react';
import { EmptyState, ErrorState, Loader } from './RequestState';

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });
const quantity = new Intl.NumberFormat('ru-RU');

export default function OffersTable({ onRetry }) {
  const { offers, selectedBrand } = useSelector((state) => state.search);
  if (!selectedBrand) return null;

  return (
    <section className="results-section offers-section" aria-labelledby="offers-title" aria-busy={offers.status === 'loading'}>
      <div className="section-heading"><div><span className="eyebrow">ШАГ 02</span><h2 id="offers-title">Предложения и аналоги {offers.status === 'success' && <span className="count-badge">{offers.items.length}</span>}</h2></div><Layers size={22} aria-hidden="true" /></div>
      {offers.status === 'loading' && <Loader>Загружаем предложения и аналоги…</Loader>}
      {offers.status === 'error' && <ErrorState message={offers.error} onRetry={onRetry} />}
      {offers.status === 'success' && (offers.items.length ? (
        <>
          <p className="section-caption">Поиск по {selectedBrand}. Каждая строка — предложение отдельного склада.</p>
          <p className="mobile-table-hint">Прокрутите таблицу вправо, чтобы увидеть цены и остатки →</p>
          <div className="table-responsive offers-table-wrap" tabIndex={0} role="region" aria-label="Предложения по складам">
            <table className="table offers-table">
              <caption className="visually-hidden">Автозапчасти и аналоги: производитель, артикул, склад, стоимость и доступный остаток</caption>
              <thead><tr><th scope="col">Деталь / производитель</th><th scope="col">Склад</th><th scope="col" className="text-end">Цена, ₽</th><th scope="col" className="text-end">Остаток</th></tr></thead>
              <tbody>{offers.items.map((offer) => (
                <tr key={offer.id}>
                  <td><div className="product-brand">{offer.brand}<span className={`product-kind ${offer.analogue ? '' : 'original'}`}>{offer.analogue ? 'Аналог' : 'Искомая деталь'}</span></div><div className="product-name">{offer.name}</div><div className="product-number">{offer.number}</div></td>
                  <td><span className="warehouse-name"><Package size={14} aria-hidden="true" />{offer.warehouse}</span></td>
                  <td className="text-end price-cell">{offer.price === null ? <span className="muted-cell">Нет цены</span> : money.format(offer.price)}</td>
                  <td className="text-end"><span className={`stock ${offer.stock > 0 ? 'available' : ''}`}><span className="stock-dot" />{offer.stock === null ? 'Нет данных' : offer.stock === 0 ? 'Нет в наличии' : `${quantity.format(offer.stock)} шт.`}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="table-note">Цены и остатки получены от Favorit Parts. Позиции без наличия также показаны в таблице.</p>
        </>
      ) : <EmptyState title="Предложений пока нет">Для выбранного производителя не найдено товаров и аналогов. Выберите другой бренд или повторите поиск позже.</EmptyState>)}
    </section>
  );
}
