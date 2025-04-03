import { parse } from 'date-fns';

export const parseDate = (dateString) => {
  // Try parsing as DD/MM/YYYY first  
  let parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
  
  // If parsing fails (invalid date), try MM/DD/YYYY
  if (isNaN(parsedDate.getTime())) {
    parsedDate = parse(dateString, 'MM/dd/yyyy', new Date());
  }
  
  return parsedDate;
};

export const getDateOnly = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};