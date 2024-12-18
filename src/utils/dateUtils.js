import { parse } from 'date-fns';

export const parseDate = (dateString: string): Date => {
  // Try parsing as DD/MM/YYYY first

  console.log();
  
  let parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
  
  // If parsing fails (invalid date), try MM/DD/YYYY
  if (isNaN(parsedDate.getTime())) {
    parsedDate = parse(dateString, 'MM/dd/yyyy', new Date());
  }
  
  return parsedDate;
};

