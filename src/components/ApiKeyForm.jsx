import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff } from 'lucide-react';
import { setApiKey } from '../store/search';

export default function ApiKeyForm({ inputRef, keyRequired, onConnect }) {
  const dispatch = useDispatch();
  const hasKey = useSelector((state) => Boolean(state.search.apiKey));
  const [draft, setDraft] = useState('');
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  function connect(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    dispatch(setApiKey(draft));
    onConnect();
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
        <div>
          <h2 id="connection-title">{hasKey ? 'API-ключ добавлен' : 'Подключение к Favorit Parts'}</h2>
          <p>{hasKey ? 'Хранится до закрытия или перезагрузки вкладки.' : 'Для поиска введите свой ключ покупателя из личного кабинета.'}</p>
        </div>
        {hasKey && !editing && <div className="connection-actions"><button className="btn btn-link" onClick={() => setEditing(true)}>Сменить ключ</button><button className="btn btn-link text-secondary" onClick={disconnect}>Отключить</button></div>}
      </div>
      {(!hasKey || editing) && (
        <form onSubmit={connect} className="connection-form">
          <label className="form-label" htmlFor="api-key">API-ключ покупателя</label>
          <div className="key-input-wrap">
            <input ref={inputRef} aria-invalid={keyRequired || undefined} aria-describedby={keyRequired ? 'api-key-error' : undefined} id="api-key" className="form-control" type={visible ? 'text' : 'password'} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="Ваш API-ключ" value={draft} onChange={(event) => setDraft(event.target.value)} required />
            <button type="button" className="icon-button" aria-label={visible ? 'Скрыть API-ключ' : 'Показать API-ключ'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
          </div>
          {keyRequired && <p id="api-key-error" className="key-error" role="alert">Добавьте API-ключ, чтобы начать поиск.</p>}
          <button className="btn btn-connect" type="submit" disabled={!draft.trim()}>{hasKey ? 'Сохранить ключ' : 'Использовать ключ'}</button>
          {hasKey && <button type="button" className="btn btn-link" onClick={() => { setEditing(false); setDraft(''); setVisible(false); }}>Отмена</button>}
        </form>
      )}
    </section>
  );
}
