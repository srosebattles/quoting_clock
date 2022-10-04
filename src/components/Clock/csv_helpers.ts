import { useState } from "react";
import quoting_clock_quotes from './srb_litclock_annotated.csv';

export const GetCSVBlob = () => {
    const [data, setData] = useState('');

    const getCsv = () => fetch(quoting_clock_quotes)
    .then( response => response.text() )
    .then( responseText => setData(responseText));

    getCsv();

    return data;
}

export const getValueFromCSVRow = (row: string, desiredVal: number) => {
    const values = row.split('|');
    return values[desiredVal]
  }

export const getRandomCSVRow = (rowsArray: string[]) => {
    return rowsArray[Math.floor(Math.random()*rowsArray.length)];
}