import { useEffect, useState } from "react";
// import quoting_clock_quotes from './srb_litclock_annotated.csv';
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

export const getHowManyAuthors = (array) => { return array.filter((item, index) => array.indexOf(item) === index)}

export const getNumOfTimes = (array) => {
    let found = []
    if (array) {
        for (let i = 0; i < array.length; i++) {
            let keys = array[i]
            found[keys] = ++found[array[i]] || 1
        }
    }
    return found
}

export const countWords = (str) => {
    str = str?.trim();
    const words = str?.match(/\S+/g);
    return words?.length;
  };