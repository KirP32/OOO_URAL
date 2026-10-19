import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import App from './App';
import { createAppStore } from './store/search';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={createAppStore()}>
      <App />
    </Provider>
  </React.StrictMode>,
);
