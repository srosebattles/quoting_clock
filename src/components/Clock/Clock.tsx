import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../AppContext';
import { useCSVBlob, getRandomCSVRow, getValueFromCSVRow } from './csv_helpers';

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightTimePhrase = (quote: string, timePhrase: string) =>
  quote.replace(new RegExp(escapeRegExp(timePhrase), "gi"), (match) => `<strong>${match}</strong>`);

export const Clock = () => {
  const csvBlob = useCSVBlob();
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [currentTimeQuote, setCurrentTimeQuote] = useState<string | null>(null);
  const {showPG13} = useContext(AppContext);

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
      <>
      <blockquote dangerouslySetInnerHTML={{ __html: highlightTimePhrase(getValueFromCSVRow(currentTimeQuote, 2), getValueFromCSVRow(currentTimeQuote, 1)) }} />
      <p className='quoteAttribution'>
        —<cite>{getValueFromCSVRow(currentTimeQuote, 3)}</cite> by {getValueFromCSVRow(currentTimeQuote, 4)}
      </p>
      </>
      :
      <p>
      The time is <time dateTime={currentTime}>{currentTime}</time>, there's no quote to display at the moment.
      </p>
}
    </div>
  );
}