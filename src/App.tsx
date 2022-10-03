import './App.css';
import { useState } from 'react';
import { Clock } from './components/Clock'
import { CsvGetter } from './components/CsvGetter';
import React from 'react';

function App() {
  const csv = CsvGetter();
  
  return (
    <div className="App">
      <header className="App-header">
        What time is it?
      </header>
      <Clock csvBlob={csv} />
    </div>
  );
}

export default App;
