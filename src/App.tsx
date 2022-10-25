import React, { useState } from 'react';

import { Clock } from './components/Clock/Clock'
import { AppContext } from './AppContext';
import './App.css';


function App() {
  const [showPG13, setShowPG13] = useState(false);

  return (
    <AppContext.Provider value={{showPG13}}>
      <div className='imgDiv' />
      <Clock />
      <div className='buttonDiv'>
      <button onClick={() => setShowPG13(!showPG13)}>
        {showPG13 ? <span>hide PG-13 quotes</span> : <span>show PG-13 quotes</span>}
      </button>
      </div>
      <div className='attrDiv'>
        Thanks to <a href="https://github.com/JohannesNE/literature-clock/">JohannesNE</a> for creating and maintaining the project that inspired this one; thanks to <a href="https://pixabay.com/photos/fantasy-time-magic-clock-dream-3517206/">KELLEPICS</a> for the image
      </div>
    </AppContext.Provider>
  );
}

export default App;
