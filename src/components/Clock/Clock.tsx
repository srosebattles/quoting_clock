import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../AppContext';
import { useCSVBlob, getRandomCSVRow, getValueFromCSVRow } from './csv_helpers';

export const Clock = () => {
  const csvBlob = useCSVBlob();
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [currentTimeQuote, setCurrentTimeQuote] = useState<string | null>(null);
  const {showPG13} = useContext(AppContext);

  const renderHTML = (rawHTML: string) => React.createElement("div", { dangerouslySetInnerHTML: { __html: rawHTML } });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
     const rows = csvBlob.split('\n');
     const availableTimeRows = rows.filter(row =>
       row.substring(0,5) === currentTime && (showPG13 || getValueFromCSVRow(row, 5) !== 'nsfw')
     );

     if (availableTimeRows.length === 0) {
      setCurrentTimeQuote(null)
     } else {
      setCurrentTimeQuote(getRandomCSVRow(availableTimeRows))
     }
  }, [currentTime, csvBlob, showPG13]);

  return (
    <div className='quoteDiv'>
      {currentTimeQuote ? 
      <span>
      {renderHTML(getValueFromCSVRow(currentTimeQuote, 2).replace(new RegExp(getValueFromCSVRow(currentTimeQuote, 1), "gi"), (match) => `<strong>${match}</strong>`))}
      <br/>
      -{getValueFromCSVRow(currentTimeQuote, 3)} by {getValueFromCSVRow(currentTimeQuote, 4)}
      </span>
      :
      <span>
      The time is {currentTime}, there's no quote to display at the moment.
      </span>
}
    </div>
  );
}