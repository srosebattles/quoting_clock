import { useState, useEffect } from 'react';

export const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [currentTimeQuote, setCurrentTimeQuote] = useState('string');

  useEffect(() => {
    const updateTime = () => {
      const updatedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      if (updatedTime !== currentTime){
        setCurrentTime(updatedTime);
      }
    }

    const timer = setInterval(updateTime, 1000);

    return function cleanup() {
      clearInterval(timer);
    };
  }, [currentTime]);

  useEffect(() => {
    setCurrentTimeQuote(currentTime);
    console.log('updated');
  }, [currentTime]);

  return (
    <>
    <span>
      {currentTime}
      <br/>
      {currentTimeQuote}
    </span>
    </>
  );
}