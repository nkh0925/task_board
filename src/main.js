import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import { Provider } from 'mobx-react';
import taskStore from './stores/TaskStore';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider taskStore={taskStore}>
    <App />
  </Provider>
);
