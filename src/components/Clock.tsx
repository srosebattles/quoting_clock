import React from 'react';
import { useState, useEffect } from 'react';

export const Clock = (csvBlob) => {
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [availableTimeQuotes, setAvailableTimeQuotes] = useState([]);
  const [currentTimeQuote, setCurrentTimeQuote] = useState<string>('string');

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
    const rows = csvBlob.split('\n');
    // const availableTimeRows = rows.filter(row => row.substring(0,5) === currentTime)
    console.log(csvBlob);
  }, [currentTime]);

  return (
    <span>
      {currentTime}
      <br/>
      {currentTimeQuote}
    </span>
  );
}