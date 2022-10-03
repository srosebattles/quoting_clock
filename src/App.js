import './App.css';
import { useState } from 'react';
import { Clock } from './components/Clock'
import { CsvGetter } from './components/CsvGetter';

function App() {
  const [csvBlob, setCsvBlob] = useState(CsvGetter());
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
