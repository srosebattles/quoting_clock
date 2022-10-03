import React from 'react';
import { useState, useEffect } from 'react';
import { CsvGetter } from './CsvGetter';

export const Clock = () => {
  const csvBlob = CsvGetter();
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [currentTimeQuote, setCurrentTimeQuote] = useState<string | null>('string');

  const getValueFromCSVRow = (row: string, desiredVal: number) => {
    const values = row.split('|');
    return values[desiredVal]
  }

  const getRandomCSVRow = (rowsArray: string[]) => {
    return rowsArray[Math.floor(Math.random()*rowsArray.length)];
  }

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
     const availableTimeRows = rows.filter(row => row.substring(0,5) === currentTime)
     console.log(availableTimeRows);
     if (availableTimeRows.length === 0) {
      setCurrentTimeQuote(null)
     } else if (availableTimeRows.length === 1) {
      setCurrentTimeQuote(availableTimeRows[0])
     } else {
      setCurrentTimeQuote(getRandomCSVRow(availableTimeRows))
     }
  }, [currentTime, csvBlob]);

  return (
    <span>
      {currentTimeQuote ? 
      <span>
      {getValueFromCSVRow(currentTimeQuote, 2)}
      <br/>
      -{getValueFromCSVRow(currentTimeQuote, 3)} by {getValueFromCSVRow(currentTimeQuote, 4)}
      </span>
      :
      <span>
      {currentTime}
      </span>
}
    </span>
  );
}