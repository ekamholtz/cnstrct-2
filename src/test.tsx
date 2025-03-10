import React from 'react';
import ReactDOM from 'react-dom/client';

const TestApp = () => {
  return (
    <div>
      <h1>Test App is Working</h1>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);
