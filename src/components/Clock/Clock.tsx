import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../AppContext';
import { useCSVBlob, getRandomCSVRow, getValueFromCSVRow, countWords,
 // getNumOfTimes, getHowManyAuthors 
} from './csv_helpers';

export const Clock = () => {
  const csvBlob = useCSVBlob();
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [currentTimeQuote, setCurrentTimeQuote] = useState<string | null>(null);
  const {showPG13} = useContext(AppContext);

  const renderHTML = (rawHTML: string) => React.createElement("div", { dangerouslySetInnerHTML: { __html: rawHTML } });

  useEffect(() => {
    const updateTime = () => {
      const updatedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      if (updatedTime !== currentTime){
        setCurrentTime(updatedTime);
      }
    }

    const timer = setInterval(updateTime, 1000);
  }, [currentTime]);

  useEffect(() => {
     const rows = csvBlob?.split('\n');
     const authors = rows.map((row, _index) => getValueFromCSVRow(row, 2))
     const longQuotes = authors.filter((string) => countWords(string) > 110);
     const quotesWithWordcount = longQuotes.map((quote, _index)=> quote.concat(` ${countWords(quote)}`))
     

     console.log(quotesWithWordcount);
    //  console.log(getNumOfTimes(authors))
    //  console.log(getHowManyAuthors(authors))
     let availableTimeRows = ['']

     if (showPG13) {
      availableTimeRows = rows.filter(row => row.substring(0,5) === currentTime)
     } else {
      availableTimeRows = rows.filter(row => row.substring(0,5) === currentTime && getValueFromCSVRow(row, 5) !== 'nsfw')
     }

     if (availableTimeRows.length === 0) {
      setCurrentTimeQuote(null)
     } else if (availableTimeRows.length === 1) {
      setCurrentTimeQuote(availableTimeRows[0])
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