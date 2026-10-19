import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check, Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react';
import { setApiKey } from '../store/search';

export default function ApiKeyForm() {
  const dispatch = useDispatch();
  const hasKey = useSelector((state) => Boolean(state.search.apiKey));
  const [draft, setDraft] = useState('');
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  function connect(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    dispatch(setApiKey(draft));
    setDraft('');
    setVisible(false);
    setEditing(false);
  }

  function disconnect() {
    dispatch(setApiKey(''));
    setDraft('');
    setVisible(false);
    setEditing(false);
  }

  return (
    <section className={`connection-panel ${hasKey && !editing ? 'is-connected' : ''}`} aria-labelledby="connection-title">
      <div className="connection-heading">
        <span className="connection-icon">{hasKey ? <Check size={19} aria-hidden="true" /> : <KeyRound size={19} aria-hidden="true" />}</span>
        <div>
          <h2 id="connection-title">{hasKey ? 'API-ключ добавлен' : 'Подключите Favorit Parts'}</h2>
          <p>{hasKey ? 'Хранится до закрытия или перезагрузки вкладки.' : 'Для поиска введите свой ключ покупателя из личного кабинета.'}</p>
        </div>
        {hasKey && !editing && <div className="connection-actions"><button className="btn btn-link" onClick={() => setEditing(true)}>Сменить ключ</button><button className="btn btn-link text-secondary" onClick={disconnect}>Отключить</button></div>}
      </div>
      {(!hasKey || editing) && (
        <form onSubmit={connect} className="connection-form">
          <label className="visually-hidden" htmlFor="api-key">API-ключ покупателя</label>
          <div className="key-input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input id="api-key" className="form-control" type={visible ? 'text' : 'password'} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="Ваш API-ключ" value={draft} onChange={(event) => setDraft(event.target.value)} required />
            <button type="button" className="icon-button" aria-label={visible ? 'Скрыть API-ключ' : 'Показать API-ключ'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
          </div>
          <button className="btn btn-connect" type="submit" disabled={!draft.trim()}>{hasKey ? 'Сохранить ключ' : 'Использовать ключ'}</button>
          {hasKey && <button type="button" className="btn btn-link" onClick={() => { setEditing(false); setDraft(''); setVisible(false); }}>Отмена</button>}
          <p className="key-note"><LockKeyhole size={12} aria-hidden="true" /> Хранится только в памяти вкладки. Отправляется напрямую в Favorit Parts.</p>
        </form>
      )}
    </section>
  );
}
