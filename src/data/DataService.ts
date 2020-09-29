import {TimeUtils} from './TimeUtils';
import {Point} from 'igniteui-react-core';
import {IgrShapefileRecord} from 'igniteui-react-core';
import geoData from './../data/custom.geoM.json';
import continentMap from './../data/continentsArray.json'

export enum DataType {
    Infections = 'confirmed_global',
    Recoveries = 'recovered_global',
    Deaths = 'deaths_global'
}

export class DataService {
    // Constant variables that hold the URLs from which COVID-19 data are extracted from
    public static COVID_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data';
    public static TIME_SERIES = 'csse_covid_19_time_series';
    public static DAILY_SERIES = 'csse_covid_19_daily_reports';
    public static FILE_BASE = 'time_series_covid19_';
    public static XPLAT_URL = 'https://static.infragistics.com/xplatform/';
    public static FLAGS_URL = DataService.XPLAT_URL + 'images/flags/';
    public static SHAPE_URL = DataService.XPLAT_URL + 'shapes/';

    // Holds the data sets of given Infection, Recoveries and Deaths
    public static dataSets = [DataType.Infections, DataType.Recoveries, DataType.Deaths];
    // Holds the overall data
    public static mapRecords: Map<string, IgrShapefileRecord> = new Map();

    // Data columns to structure data
    public static dataColumns = {
        totalDeaths: "Total Deaths",
        totalInfections: "Total Cases",
        totalRecoveries: "Total Recoveries",
        weeklyDeaths: "Weekly Deaths",
        weeklyInfections: "Weekly Cases",
        weeklyRecoveries: "Weekly Recoveries",
    }

    /**
     * Combines Geojson data with COVID-19 data and returns it.
     * @param allCountries 
     */
    public static aggregateGeoCovidData(allCountries: OutbreakLocation[]) {
        // Gets the Geojson data
        let data = JSON.parse(JSON.stringify(geoData));
        for (const country2 of allCountries) {
            for (const country1 of data.features) {
                if (country1.properties.name === country2.country || country1.properties.sovereignt === country2.country || country1.properties.subunit === country2.country) {
                    country2.continent = country1.properties.continent;
                    country1.properties['totalInfections'] = country2.totalInfections;
                    country1.properties['totalDeaths'] = country2.totalDeaths;
                    country1.properties['totalRecoveries'] = country2.totalRecoveries;
                }
            }
        }
        return data;
    }

    /**
     * Returns the display name for the given data column
     * @param dataColumn 
     * @param usePropStats 
     */
    public static GetDisplayName(dataColumn: string, usePropStats: boolean): string {
        let name: string = this.dataColumns[dataColumn] || "";
        if (usePropStats) {
            name += " / 1M People";
        }
        return name;
    }

    /**
     * Extracts the COVID-19 data report 
     * @param shapes 
     */
    public static async getOutbreakReport(shapes: IgrShapefileRecord[]): Promise<OutbreakReport> {
        let reportSummary = new OutbreakReport();
        let locationsWithDeaths: OutbreakLocation[] = [];
        let locationsWithRecoveries: OutbreakLocation[] = [];
        let locationsWithInfections: OutbreakLocation[] = [];

        let lastCommit: number;
        await this.getLatestCommits().then(data => {
            lastCommit = data;
        });

        // check if we need to fetch or load from storage 3 data sets (deaths, recoveries, infections)
        let loadFromCache = false;
        let lastStorage = parseInt(window.localStorage.getItem('lastStorage'), 10);
        if (lastStorage && lastCommit && lastStorage >= lastCommit) {
            loadFromCache = true;
        }

        // fetching or loading from storage 3 data sets (deaths, recoveries, infections)
        await this.getTimeSeries(DataType.Deaths, loadFromCache).then(data => {
            locationsWithDeaths = data;
            console.log('CDS locationsWithDeaths: ' + data.length + ' history: ' + data[0].history.length);
        });
        await this.getTimeSeries(DataType.Infections, loadFromCache).then(data => {
            locationsWithInfections = data;
        });
        await this.getTimeSeries(DataType.Recoveries, loadFromCache).then(data => {
            locationsWithRecoveries = data;
        });

        if (locationsWithDeaths[0].history.length !== locationsWithInfections[0].history.length ||
            locationsWithDeaths[0].history.length !== locationsWithRecoveries[0].history.length) {
            loadFromCache = false;

            await this.getTimeSeries(DataType.Deaths, loadFromCache).then(data => {
                locationsWithDeaths = data;
            });
            await this.getTimeSeries(DataType.Infections, loadFromCache).then(data => {
                locationsWithInfections = data;
            });
            await this.getTimeSeries(DataType.Recoveries, loadFromCache).then(data => {
                locationsWithRecoveries = data;
            });
        }

        let locations = this.getOutbreakLocations(locationsWithDeaths, locationsWithRecoveries, locationsWithInfections, reportSummary);

        // some countries have several outbreak locations so
        // we are combining multiple locations for most best comparison of countries
        let countries = this.getOutbreakCountries(locations, shapes);

        // sorting countries by total infections in decreasing order
        countries = countries.sort((a, b) => b.totalInfections - a.totalInfections);
        // sorting locations by total infections in decreasing order
        locations = countries.sort((a, b) => b.totalInfections - a.totalInfections);

        lastStorage = new Date().getTime();
        window.localStorage.setItem(`lastStorage`, lastStorage as any);

        reportSummary.locations = locations;
        reportSummary.countries = countries;
        reportSummary.date = TimeUtils.getString(new Date(lastCommit), 'MM dd, yyyy');
        return new Promise<OutbreakReport>((resolve, reject) => {
            resolve(reportSummary);
        });
    }

    public static getOutbreakLocations(
        locationsWithDeaths: OutbreakLocation[],
        locationsWithRecoveries: OutbreakLocation[],
        locationsWithInfections: OutbreakLocation[],
        reportSummary: OutbreakReport): OutbreakLocation[] {
        const mapLocations: Map<string, OutbreakLocation> = new Map();
        // combining outbreak locations with reported infections
        for (const location of locationsWithInfections) {
            if (!mapLocations.has(location.id)) {
                mapLocations.set(location.id, location);
            }
            const last = location.history.length;
            if (mapLocations.get(location.id).history.length === last) {
                mapLocations.get(location.id).totalInfections = location.history[last - 1].cases;
                for (let ii = 0; ii < last; ii++) {
                    mapLocations.get(location.id).history[ii].totalInfections = location.history[ii].cases;
                }
            }
        }

        // combining outbreak locations with reported deaths
        for (const location of locationsWithDeaths) {
            if (!mapLocations.has(location.id)) {
                mapLocations.set(location.id, location);
            }
            const last = location.history.length;
            if (mapLocations.get(location.id).history.length === last) {
                mapLocations.get(location.id).totalDeaths = location.history[last - 1].cases;
                for (let ii = 0; ii < last; ii++) {
                    mapLocations.get(location.id).history[ii].totalDeaths = location.history[ii].cases;
                }
            }
        }
        // combining outbreak locations with reported recoveries
        for (const location of locationsWithRecoveries) {
            if (!mapLocations.has(location.id)) {
                mapLocations.set(location.id, location);
            }
            const last = location.history.length;
            if (mapLocations.get(location.id).history.length === last) {
                mapLocations.get(location.id).totalRecoveries = location.history[last - 1].cases;
                for (let ii = 0; ii < last; ii++) {
                    mapLocations.get(location.id).history[ii].totalRecoveries = location.history[ii].cases;
                }
            } else {
            }
        }

        let locations: OutbreakLocation[] = [];
        for (const location of mapLocations.values()) {
            let origin = 0;
            const last = location.history.length;
            for (let i = 1; i < last; i++) {
                // calculating daily stats by checking changes from previous day in the history
                let previous = location.history[i - 1];
                location.history[i].dailyDeaths = location.history[i].totalDeaths - previous.totalDeaths;
                location.history[i].dailyInfections = location.history[i].totalInfections - previous.totalInfections;
                location.history[i].dailyRecoveries = location.history[i].totalRecoveries - previous.totalRecoveries;

                // calculating weekly stats by summing up previous 7 days in the history
                location.history[i].weeklyInfections = 0;
                location.history[i].weeklyRecoveries = 0;
                location.history[i].weeklyDeaths = 0;
                let week = Math.min(i, 10);
                for (let d = 0; d < week; d++) {
                    location.history[i].weeklyInfections += location.history[i - d].dailyInfections;
                    location.history[i].weeklyRecoveries += location.history[i - d].dailyRecoveries;
                    location.history[i].weeklyDeaths += location.history[i - d].dailyDeaths;
                }

                if (location.history[i].weeklyInfections >= 100 &&
                    location.history[i].totalInfections >= 100 &&
                    origin === 0) {
                    origin = i;
                }

                let isWithinStackedChartData = reportSummary.stackedChartData.find(elem => {
                    return elem.date === location.history[i].date
                });
                if (!isWithinStackedChartData && location.continent.length > 1) {
                    let newItem: StackedChartData = {
                        date: location.history[i].date,
                        northAmerica: 0,
                        southAmerica: 0,
                        asia: 0,
                        europe: 0,
                        oceania: 0,
                        africa: 0
                    };
                    let newDeathItem: StackedChartData = {
                        date: location.history[i].date,
                        northAmerica: 0,
                        southAmerica: 0,
                        asia: 0,
                        europe: 0,
                        oceania: 0,
                        africa: 0
                    };
                    let newDailyItem: StackedChartData = {
                        date: location.history[i].date,
                        northAmerica: 0,
                        southAmerica: 0,
                        asia: 0,
                        europe: 0,
                        oceania: 0,
                        africa: 0
                    };
                    let newDailyDeathItem: StackedChartData = {
                        date: location.history[i].date,
                        northAmerica: 0,
                        southAmerica: 0,
                        asia: 0,
                        europe: 0,
                        oceania: 0,
                        africa: 0
                    };
                    if (location.continent.contains('North America')) {
                        newItem.northAmerica += location.history[i].totalInfections;
                        newDeathItem.northAmerica += location.history[i].totalDeaths;
                        newDailyItem.northAmerica += location.history[i].dailyInfections;
                        newDailyDeathItem.northAmerica += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('South America')) {
                        newItem.southAmerica += location.history[i].totalInfections;
                        newDeathItem.southAmerica += location.history[i].totalDeaths;
                        newDailyItem.northAmerica += location.history[i].dailyInfections;
                        newDailyDeathItem.southAmerica += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('Asia')) {
                        newItem.asia += location.history[i].totalInfections;
                        newDeathItem.asia += location.history[i].totalDeaths;
                        newDailyItem.asia += location.history[i].dailyInfections;
                        newDailyDeathItem.asia += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('Europe')) {
                        newItem.europe += location.history[i].totalInfections;
                        newDeathItem.europe += location.history[i].totalDeaths;
                        newDailyItem.europe += location.history[i].dailyInfections;
                        newDailyDeathItem.europe += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('Oceania')) {
                        newItem.oceania += location.history[i].totalInfections;
                        newDeathItem.oceania += location.history[i].totalDeaths;
                        newDailyItem.oceania += location.history[i].dailyInfections;
                        newDailyDeathItem.oceania += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('Africa')) {
                        newItem.africa += location.history[i].totalInfections;
                        newDeathItem.africa += location.history[i].totalDeaths;
                        newDailyItem.africa += location.history[i].dailyInfections;
                        newDailyDeathItem.africa += location.history[i].dailyDeaths;
                    }
                    reportSummary.stackedChartData.push(newItem);
                    reportSummary.stackedDeathChartData.push(newDeathItem);
                    reportSummary.stackedDailyChartData.push(newDailyItem);
                    reportSummary.stackedDailyDeathChartData.push(newDailyDeathItem);
                } else {
                    let historyItem: StackedChartData = reportSummary.stackedChartData.find(elem => {
                        if (elem.date === location.history[i].date) {
                            return elem;
                        }
                        return undefined
                    });
                    let historyDeathItem: StackedChartData = reportSummary.stackedDeathChartData.find(elem => {
                        if (elem.date === location.history[i].date) {
                            return elem;
                        }
                        return undefined
                    });
                    let historyDailyItem: StackedChartData = reportSummary.stackedDailyChartData.find(elem => {
                        if (elem.date === location.history[i].date) {
                            return elem;
                        }
                        return undefined
                    });
                    let historyDailyDeathItem: StackedChartData = reportSummary.stackedDailyDeathChartData.find(elem => {
                        if (elem.date === location.history[i].date) {
                            return elem;
                        }
                        return undefined
                    });
                    if (location.continent.contains('North America')) {
                        historyItem.northAmerica += location.history[i].totalInfections;
                        historyDeathItem.northAmerica += location.history[i].totalDeaths;
                        historyDailyItem.northAmerica += location.history[i].dailyInfections;
                        historyDailyDeathItem.northAmerica += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('South America')) {
                        historyItem.southAmerica += location.history[i].totalInfections;
                        historyDeathItem.southAmerica += location.history[i].totalDeaths;
                        historyDailyItem.southAmerica += location.history[i].dailyInfections;
                        historyDailyDeathItem.southAmerica += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('Asia')) {
                        historyItem.asia += location.history[i].totalInfections;
                        historyDeathItem.asia += location.history[i].totalDeaths;
                        historyDailyItem.asia += location.history[i].dailyInfections;
                        historyDailyDeathItem.asia += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('Europe')) {
                        historyItem.europe += location.history[i].totalInfections;
                        historyDeathItem.europe += location.history[i].totalDeaths;
                        historyDailyItem.europe += location.history[i].dailyInfections;
                        historyDailyDeathItem.europe += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('Oceania')) {
                        historyItem.oceania += location.history[i].totalInfections;
                        historyDeathItem.oceania += location.history[i].totalDeaths;
                        historyDailyItem.oceania += location.history[i].dailyInfections;
                        historyDailyDeathItem.oceania += location.history[i].dailyDeaths;
                    } else if (location.continent.contains('Africa')) {
                        historyItem.africa += location.history[i].totalInfections;
                        historyDeathItem.africa += location.history[i].totalDeaths;
                        historyDailyItem.africa += location.history[i].dailyInfections;
                        historyDailyDeathItem.africa += location.history[i].dailyDeaths;
                    }
                }
            }

            for (let i = origin; i >= 0; i--) {
                location.history[i].weeklyInfections = location.history[i].totalInfections;
            }

            const stats = location.history[last - 1];
            if (stats === undefined) {
            } else {
                // setting current stats using the last day in the history
                location.totalDeaths = stats.totalDeaths;
                location.totalInfections = stats.totalInfections;
                location.totalRecoveries = stats.totalRecoveries;
                location.dailyDeaths = stats.dailyDeaths;
                location.dailyInfections = stats.dailyInfections;
                location.dailyRecoveries = stats.dailyRecoveries;
                location.weeklyDeaths = stats.weeklyDeaths;
                location.weeklyInfections = stats.weeklyInfections;
                location.weeklyRecoveries = stats.weeklyRecoveries;
                location.history = location.history.splice(8);
                locations.push(location);

            }
        }
        return locations;
    }

    public static getOutbreakCountries(
        locations: OutbreakLocation[],
        shapes: IgrShapefileRecord[]): OutbreakLocation[] {
        // some countries have several outbreak locations so
        // we are combining multiple locations for most best comparison of countries
        let mapCountries: Map<string, OutbreakLocation> = new Map();

        let historySize = 0;
        for (const location of locations) {
            let key = location.country;

            if (!mapCountries.has(key)) {
                // adding first location in a country:
                mapCountries.set(key, location);
            } else {
                historySize = location.history.length;
                // combining stats of locations in the same country:
                for (let ii = 0; ii < location.history.length; ii++) {
                    mapCountries.get(key).history[ii].totalInfections += location.history[ii].totalInfections;
                    mapCountries.get(key).history[ii].totalRecoveries += location.history[ii].totalRecoveries;
                    mapCountries.get(key).history[ii].totalDeaths += location.history[ii].totalDeaths;

                    mapCountries.get(key).history[ii].dailyInfections += location.history[ii].dailyInfections;
                    mapCountries.get(key).history[ii].dailyRecoveries += location.history[ii].dailyRecoveries;
                    mapCountries.get(key).history[ii].dailyDeaths += location.history[ii].dailyDeaths;

                    mapCountries.get(key).history[ii].weeklyInfections += location.history[ii].weeklyInfections;
                    mapCountries.get(key).history[ii].weeklyRecoveries += location.history[ii].weeklyRecoveries;
                    mapCountries.get(key).history[ii].weeklyDeaths += location.history[ii].weeklyDeaths;
                }
            }
        }

        for (const shape of shapes) {
            let key = shape.fieldValues.Name;
            if (!mapCountries.has(key)) {

                let location = new OutbreakLocation();
                location.country = shape.fieldValues.Name;
                location.id = location.country;
                for (let i = 0; i < historySize; i++) {
                    location.history.push(new OutbreakStats());
                }
                mapCountries.set(key, location);
            }

            mapCountries.get(key).shapes = shape.points;
            mapCountries.get(key).latitude = parseInt(shape.fieldValues['ShapePosY'], 10);
            mapCountries.get(key).longitude = parseInt(shape.fieldValues['ShapePosX'], 10);
            mapCountries.get(key).population = parseInt(shape.fieldValues['Population'], 10);
            mapCountries.get(key).iso = shape.fieldValues['Code'].toString();
            mapCountries.get(key).flag = this.FLAGS_URL + mapCountries.get(key).iso.toLowerCase() + ".svg"
        }

        let countries: OutbreakLocation[] = [];
        for (let country of mapCountries.values()) {
            if (country.population > 10000) {

                // setting stat of a country to last/current day in history
                let last = country.history.length;
                country.totalInfections = country.history[last - 1].totalInfections;
                country.totalRecoveries = country.history[last - 1].totalRecoveries;
                country.totalDeaths = country.history[last - 1].totalDeaths;
                country.dailyInfections = country.history[last - 1].dailyInfections;
                country.dailyRecoveries = country.history[last - 1].dailyRecoveries;
                country.dailyDeaths = country.history[last - 1].dailyDeaths;
                country.weeklyInfections = country.history[last - 1].weeklyInfections;
                country.weeklyRecoveries = country.history[last - 1].weeklyRecoveries;
                country.weeklyDeaths = country.history[last - 1].weeklyDeaths;
                countries.push(country);
            }
        }
        return countries;
    }

    public static async getTimeSeries(dataSet: DataType, loadFromCache: boolean): Promise<OutbreakLocation[]> {
        const dataCache = `data-totals-${this.FILE_BASE}${dataSet}`;
        const dataURL = `${this.COVID_URL}/${this.TIME_SERIES}/${this.FILE_BASE}${dataSet}.csv`;
        let dataCSV = '';
        if (loadFromCache) {
            dataCSV = window.localStorage.getItem(dataCache);
        } else {
            try {
                const response = await fetch(dataURL);
                dataCSV = await response.text();  // may error if there is no body
            } catch (ex) {
                console.log('CDS fetch error \n' + ex);
            }
            window.localStorage.setItem(dataCache, dataCSV);
        }

        const locations: OutbreakLocation[] = [];
        if (dataCSV === null || dataCSV === undefined || dataCSV === '') {
            return new Promise<OutbreakLocation[]>((resolve, reject) => {
                resolve(locations);
            });
        }

        dataCSV = dataCSV.replace(/, /g, ' - ');
        dataCSV = dataCSV.replace(/'/g, '');
        const csvLines = dataCSV.split('\n');
        const headers = csvLines[0].split(',');

        for (let i = 1; i < csvLines.length; i++) {

            const columns = csvLines[i].split(',');
            const location = new OutbreakLocation();
            location.province = columns[0];
            location.country = columns[1];

            // skipping invalid locations
            if (location.country === undefined ||
                location.country === '' ||
                location.country === 'Diamond Princess') {
                continue;
            }

            // correcting name of countries to match with data in shapefile
            location.country = location.country.replace('US', 'United States');
            location.country = location.country.replace('Mainland China', 'China');
            location.country = location.country.replace('West Bank and Gaza', 'Palestine');
            location.country = location.country.replace('Burma', 'Myanmar');
            location.country = location.country.replace('Bosnia and Herzegovina', 'Bosnia and Herz.');
            location.country = location.country.replace('Cote dIvoire', 'Ivory Coast');
            location.country = location.country.replace('Holy See', 'Vatican');
            location.country = location.country.replace('Korea - South', 'South Korea');
            location.country = location.country.replace('Saint Vincent and the Grenadines', 'St. Vin. and Gren.');
            location.country = location.country.replace('Saint Kitts and Nevis', 'St. Kitts and Nevis');
            location.country = location.country.replace('*', '');
            location.country = location.country.replace(' (Kinshasa)', '');
            location.country = location.country.replace(' (Brazzaville)', '');
            location.country = location.country.split('"').join('');

            if (location.country === 'MS Zaandam') {
                location.country = 'Netherlands';
                location.province = 'Zaandam';
            }

            location.latitude = parseInt(columns[2], 10);
            location.longitude = parseInt(columns[3], 10);
            location.id = location.country + '-' + location.province;
            const cntnnt = continentMap.find(item => item.country === location.country);
            if (cntnnt !== undefined) {
                location.continent = cntnnt.continent;
            }

            // data values start from 4th column:
            for (let c = 4; c < columns.length; c++) {
                const date = TimeUtils.getDate(headers[c]);
                const cases = parseInt(columns[c], 10);
                const stats = new OutbreakStats();
                stats.cases = isNaN(cases) ? 0 : cases;
                stats.date = TimeUtils.getString(date, 'MM dd, yyyy');
                location.history.push(stats);
            }

            if (location.history.length > 0) {
                locations.push(location);
            }
        }

        let total = 0;
        for (const location of locations) {
            const last = location.history.length;
            total += location.history[last - 1].cases;

        }

        return new Promise<OutbreakLocation[]>((resolve, reject) => {
            resolve(locations);
        });
    }

    public static async getDailySeries(outbreakDate: string, outbreakDay: number, loadFromCache: boolean): Promise<OutbreakDailyReport> {
        const report = new OutbreakDailyReport();
        report.date = outbreakDate;
        report.index = outbreakDay;

        const fileDate = this.toDateFile(outbreakDate);
        const dataCache = `data-daily-${fileDate}`;
        const dataURL = `${this.COVID_URL}/${this.DAILY_SERIES}/${fileDate}.csv`;

        let dataCSV = '';

        loadFromCache = false;
        if (loadFromCache) {
            dataCSV = window.localStorage.getItem(dataCache);
        } else {
            try {
                const response = await fetch(dataURL);
                dataCSV = await response.text();  // may error if there is no body
            } catch (ex) {
            }
        }

        if (dataCSV === null || dataCSV === undefined || dataCSV === '') {
            return new Promise<OutbreakDailyReport>((resolve, reject) => {
                resolve(report);
            });
        }

        dataCSV = dataCSV.replace(/, /g, ' - ');
        dataCSV = dataCSV.replace(/'/g, '');
        const csvLines = dataCSV.split('\n');
        const headers = csvLines[0].split(',');

        const locations: OutbreakLocation[] = [];
        for (let i = 1; i < csvLines.length; i++) {
            const columns = csvLines[i].split(',');
            const location = new OutbreakLocation();

            for (let c = 0; c < columns.length; c++) {

                const header = headers[c];
                if (header === 'Province_State' || header === 'Province/State') {
                    location.province = columns[c];

                } else if (header === 'Country_Region' || header === 'Country/Region') {
                    location.country = columns[c];

                } else if (header === 'Admin2') {
                    location.place = columns[c];

                } else if (header === 'Confirmed') {
                    const cases = parseInt(columns[c], 10);
                    location.dailyInfections = isNaN(cases) ? 0 : cases;

                } else if (header === 'Deaths') {
                    const cases = parseInt(columns[c], 10);
                    location.dailyDeaths = isNaN(cases) ? 0 : cases;

                } else if (header === 'Recovered') {
                    const cases = parseInt(columns[c], 10);
                    location.dailyRecoveries = isNaN(cases) ? 0 : cases;
                }

                if (location.country !== undefined) {
                    location.country = location.country.replace('US', 'United States');
                    location.country = location.country.replace('Mainland China', 'China');
                    location.country = location.country.replace('Korea - South', 'South Korea');
                    location.country = location.country.replace('*', '');
                    location.country = location.country.replace(' (Kinshasa)', '');
                    location.country = location.country.replace(' (Brazzaville)', '');

                    if (location.country === 'MS Zaandam') {
                        location.country = 'Netherlands';
                        location.province = 'Zaandam';
                    }
                }
            }

            location.id = location.country + '-' + location.province; 
            locations.push(location);
        }

        report.locations = locations;

        return new Promise<OutbreakDailyReport>((resolve, reject) => {
            resolve(report);
        });
    }

    /**  Retrieves the date when the data source files were last updated. */
    public static async getLatestCommits(): Promise<number> {
        let dataLastCommit: number;
        const dataURL = 'https://api.github.com/repos/CSSEGISandData/COVID-19/commits';
        try {
            const response = await fetch(dataURL);
            const json = await response.json();  // may error if there is no body
            const date = new Date(json[0].commit.author.date);
            dataLastCommit = date.getTime();
        } catch (ex) {
        }
        return new Promise<number>((resolve, reject) => {
            resolve(dataLastCommit);
        });
    }

    public static toDateString(str: string): string {
        const parts = str.split('/');
        if (parts[0].length === 1) {
            parts[0] = '0' + parts[0];
        }
        if (parts[1].length === 1) {
            parts[1] = '0' + parts[1];
        }
        if (parts[2].length === 2) {
            parts[2] = '20' + parts[2];
        }
        return parts.join('/');
    }

    public static toDateFile(str: string): string {
        const parts = str.split('/');
        if (parts[0].length === 1) {
            parts[0] = '0' + parts[0];
        }
        if (parts[1].length === 1) {
            parts[1] = '0' + parts[1];
        }
        if (parts[2].length === 2) {
            parts[2] = '20' + parts[2];
        }
        return parts.join('-');
    }

    public static format(largeValue: number): string {
        if (largeValue === undefined) {
            largeValue = 0;
        }
        if (largeValue >= 10) {
            largeValue = Math.round(largeValue);
            return largeValue.toLocaleString();
        } else {
            return largeValue.toFixed(1);
        }
    }

    public static abbreviate(largeValue: number, precision?: number): string {
        let roundValue: number;

        if (precision === undefined) {
            precision = 1;
        }

        if (largeValue >= 1000000000) {
            roundValue = Math.round(largeValue / 100000000) / 10;
            return roundValue.toFixed(precision) + 'B';
        }
        if (largeValue >= 1000000) {
            roundValue = Math.round(largeValue / 100000) / 10;
            return roundValue.toFixed(precision) + 'M';
        }
        if (largeValue >= 1000) {
            roundValue = Math.round(largeValue / 100) / 10;
            return roundValue.toFixed(precision) + 'K';
        }
        return Math.round(largeValue).toString();
    }
}

export class OutbreakStats {
    public cases: number;
    public totalInfections: number;
    public totalRecoveries: number;
    public totalDeaths: number;

    public indexInfections: number;
    public indexRecoveries: number;
    public indexDeaths: number;

    public dailyInfections: number;
    public dailyRecoveries: number;
    public dailyDeaths: number;

    public weeklyInfections: number;
    public weeklyRecoveries: number;
    public weeklyDeaths: number;
    public date: string;

    constructor() {
        this.totalInfections = 0;
        this.totalRecoveries = 0;
        this.totalDeaths = 0;

        this.dailyInfections = 0;
        this.dailyRecoveries = 0;
        this.dailyDeaths = 0;

        this.weeklyInfections = 0;
        this.weeklyRecoveries = 0;
        this.weeklyDeaths = 0;
        this.date = '';
    }
}

export class StackedChartData {
    public date: string;
    public northAmerica: number;
    public southAmerica: number;
    public asia: number;
    public europe: number;
    public oceania: number;
    public africa: number;
}

export class OutbreakLocation extends OutbreakStats {
    public latitude: number;
    public longitude: number;
    public province: string;
    public country: string;
    public continent: string;
    public place: string;
    public id: string;

    public date: string;
    public cases: number;
    public history: OutbreakStats[];
    public progress: OutbreakStats[];

    public shapes: Point[][];
    public population: number;
    public iso: string;
    public flag: string;

    constructor() {
        super();

        this.province = '';
        this.country = '';
        this.continent = '';
        this.place = '';
        this.history = [];
        this.progress = [];
    }
}

export class OutbreakDailyReport {
    public locations: OutbreakLocation[];
    public date: string;
    public index: number;

    constructor() {
        this.index = 0;
        this.date = '';
        this.locations = [];
    }
}

export class OutbreakReport {
    public regions: OutbreakLocation[];
    public countries: OutbreakLocation[];
    public stackedChartData: StackedChartData[];
    public stackedDeathChartData: StackedChartData[];
    public stackedDailyChartData: StackedChartData[];
    public stackedDailyDeathChartData: StackedChartData[];
    public locations: OutbreakLocation[];
    public date: string;

    constructor() {
        this.countries = [];
        this.locations = [];
        this.regions = [];
        this.date = '';
        this.stackedChartData = [];
        this.stackedDeathChartData = [];
        this.stackedDailyChartData = [];
        this.stackedDailyDeathChartData = [];
    }
}