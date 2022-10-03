import React, { useState } from 'react';

import { Clock } from './components/Clock'
import { AppContext } from './components/AppContext';
import './App.css';


function App() {
  const [showPG13, setShowPG13] = useState(false);

  return (
    <AppContext.Provider value={{showPG13}}>
    <div className="App">
      <header className="App-header">
        What time is it?
      </header>
      <Clock />
      <br />
      <button onClick={() => setShowPG13(!showPG13)}>
        {showPG13 ? <span>hide PG-13 quotes</span> : <span>show PG-13 quotes</span>}
      </button>
    </div>
    </AppContext.Provider>
  );
}

export default App;
