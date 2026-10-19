import { AlertCircle, RotateCcw } from 'lucide-react';

export function Loader({ children }) {
  return (
    <div className="request-state" role="status">
      <span className="spinner-border" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={22} aria-hidden="true" />
      <div><strong>Не удалось выполнить запрос</strong><p>{message}</p></div>
      <button type="button" className="btn btn-retry" onClick={onRetry}><RotateCcw size={15} aria-hidden="true" /> Повторить</button>
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state" role="status">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
