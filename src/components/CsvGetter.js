import { useState } from "react";
import quoting_clock_quotes from '../srb_litclock_annotated.csv';

export const CsvGetter = (timeStamp) => {
    const [data, setData ] = useState();
    const getCsv = () => fetch(quoting_clock_quotes)
    .then( response => response.text() )
    .then( responseText => {
        setData( responseText );
    })
    getCsv();
    console.log(data);
}