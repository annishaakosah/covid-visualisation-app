import moment, { Moment } from 'moment';

export type Row = {
  [key in Column]: string;
};

type Column = 'Province/State' | 'Country/Region' | 'Lat' | 'Long' | string;

export const FIRST_DATE = '1/22/2020';
export const FIRST_DATE_WHO = '1/21/2020';

export const momentToFormat = (m: Moment): string => m.format('M/D/YYYY');

export const momentToFormatLong = (m: Moment) => m.format('M/D/YYYY');

export const getDatesFromDataRow = (data: Row | undefined) => {
  if (!data) {
    return null;
  }
  const firstDateM = moment(FIRST_DATE);
  const nowM = moment();
  const days = nowM.diff(firstDateM, 'days');
  const dates: Moment[] = [];
  for (let i = 0; i < days + 1; i = i + 1) {
    const newDate = moment(FIRST_DATE).add(i, 'days');
    if (momentToFormat(newDate) in data) {
      dates.push(newDate);
    }
  }
  return dates;
};

export const getDatesFromDataRowWho = (data: Row | undefined) => {
  if (!data) {
    return null;
  }
  const firstDateM = moment(FIRST_DATE_WHO);
  const nowM = moment();
  const days = nowM.diff(firstDateM, 'days');
  const dates: Moment[] = [];
  for (let i = 0; i < days + 1; i = i + 1) {
    const newDate = moment(FIRST_DATE_WHO).add(i, 'days');
    // console.log(momentToFormatWho(newDate), data);
    if (momentToFormatLong(newDate) in data) {
      dates.push(newDate);
    }
  }
  return dates;
};
