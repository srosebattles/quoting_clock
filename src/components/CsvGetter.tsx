import { useState } from "react";
//@ts-ignore
import quoting_clock_quotes from '../srb_litclock_annotated.csv';

export const CsvGetter = () => {
    const [data, setData] = useState('');

    const getCsv = () => fetch(quoting_clock_quotes)
    .then( response => response.text() )
    .then( responseText => setData(responseText));

    console.log(data);

    getCsv();

    return data;
}