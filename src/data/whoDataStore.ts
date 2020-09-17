import { csv } from 'd3-request';
import { computed, observable } from 'mobx';
import { Moment } from 'moment';
import { createContext, useContext } from 'react';
import { DataService } from './DataService';

// import confirmedGlobalCsvUrl from '../data/confirmed_global.csv';
// import deathsGlobalCsvUrl from '../data/deaths_global.csv';
// import { DataType } from '../pages/Map';
import { getDatesFromDataRowWho, momentToFormatLong } from '../utils/getDatesFromDataRow';
import continentArray from './continentsArray.json';
import { namesMap, swapName } from './utils';

const USE_LOCAL_DATA = true;
const confirmedGlobalCsvUrl = DataService.dataCSV;
export type DataType = 'dead' | 'confirmed';


function isNumber(n: any) {
  return !isNaN(parseFloat(n)) && !isNaN(n - 0);
}

function groupByContinent(arr: any[]) {
  let reducer = (grouped: any, item: any) => {
    let country = item[COUNTRY_KEY];
    if (Object.keys(namesMap).includes(country)) {
      country = swapName(country.replace('*', ''));
    }
    let group_value = continentArray.find((v) => v.country === country.replace('*', ''))?.continent;
    if (!group_value) {
      return grouped;
    }
    if (!grouped[group_value]) {
      grouped[group_value] = {};
    }

    Object.keys(item).forEach((rowKey) => {
      let v = item[rowKey];
      if (!v) {
        return grouped;
      }
      if (!grouped[group_value][rowKey]) {
        grouped[group_value][rowKey] = 0;
      }
      if (v && isNumber(v)) {
        grouped[group_value][rowKey] += parseFloat(v);
      } else {
        if (Object.keys(namesMap).includes(v)) {
          v = swapName(v);
        }
        grouped[group_value][rowKey] = v;
      }
    });

    return grouped;
  };
  return arr.reduce(reducer, {});
}


const COUNTRY_KEY = 'Country/Region';
// const STATE_KEY = 'Province/States';
// const WHO_REGION_KEY = 'WHO region';

export class WhoDataStore {
  @observable public whoCasesData: any | undefined = undefined;
  @observable public whoDeathsData: any | undefined = undefined;

  constructor() {
    if (USE_LOCAL_DATA) {
      csv(confirmedGlobalCsvUrl, (err, data: any) => {
        if (data) {
          this.whoCasesData = groupByContinent(data);
        } else {
          throw new Error(`Data wasn't loaded correctly`);
        }
      });
    }
  }

  public getDataArrayWithTime(dataType: DataType, length?: number) {
    if (!this.ready) {
      return null;
    }
    if (dataType === 'confirmed') {
      return this.casesDataArrayWithTime?.slice(
        0,
        length ? length + 1 : this.casesDataArrayWithTime.length + 1
      );
    }
    if (dataType === 'dead') {
      return this.deathsDataArrayWithTime?.slice(
        0,
        length ? length + 1 : this.deathsDataArrayWithTime.length + 1
      );
    }
    return null;
  }

  @computed get deathsDataArrayWithTime() {
    return this.dates?.map((date: Moment, i: number) => {
      const d: { [key: string]: string | number } = {
        time: date.unix(),
        number: i,
      };
      this.possibleRegions?.forEach((region) => {
        const value = this.whoDeathsData[region][momentToFormatLong(date)];
        d[region] = value;
      });
      return d;
    });
  }

  @computed get casesDataArrayWithTime() {
    return this.dates?.map((date: Moment, i: number) => {
      const d: { [key: string]: string | number } = {
        time: date.unix(),
        number: i,
      };
      this.possibleRegions?.forEach((region) => {
        if (region == 'Asia') {
          console.log(this.possibleRegions);
        }
        const value = this.whoCasesData[region][momentToFormatLong(date)];
        d[region] = value;
      });
      return d;
    });
  }

  @computed get dates() {
    if (this.ready && this.whoCasesData) {
      for (const region of Object.keys(this.whoCasesData)) {
        const row = this.whoCasesData[region];
        const dates = getDatesFromDataRowWho(row);
        if (dates) {
          return dates;
        }
      }
    }
    return undefined;
  }

  @computed get datesConverted() {
    if (this.dates) {
      return this.dates.map(momentToFormatLong);
    }

    return undefined;
  }

  @computed get possibleRegions() {
    if (!this.ready) {
      return undefined;
    }
    return Object.keys(this.whoCasesData);
  }

  @computed get ready() {
    return Boolean(this.whoCasesData);
  }
}

const getStore = () => new WhoDataStore();

let whoDataStore: WhoDataStore | undefined = getStore();
let whoDataStoreContext = createContext(whoDataStore);

export const clearWhoDataStore = () => {
  whoDataStore = getStore();
  whoDataStoreContext = createContext(whoDataStore);
};

const useWhoDataStore = () => useContext(whoDataStoreContext);
export default useWhoDataStore;
