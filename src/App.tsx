import './App.css';
import { Clock } from './components/Clock'
import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        What time is it?
      </header>
      <Clock />
    </div>
  );
}

export default App;
