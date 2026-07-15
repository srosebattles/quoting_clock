import { useEffect, useState } from "react";
import quoting_clock_quotes from './litclock_for_editing.csv';

export const useCSVBlob = () => {
    const [data, setData] = useState('');

    useEffect(() => {
        let cancelled = false;

        fetch(quoting_clock_quotes)
            .then(response => response.text())
            .then(responseText => {
                if (!cancelled) {
                    setData(responseText);
                }
            })
            .catch(error => console.error('Failed to load quotes:', error));

        return () => { cancelled = true; };
    }, []);

    return data;
}

export const getValueFromCSVRow = (row: string, desiredVal: number) => {
    const values = row.split('|');
    return values[desiredVal]
  }

export const getRandomCSVRow = (rowsArray: string[]) => {
    return rowsArray[Math.floor(Math.random()*rowsArray.length)];
}