
import { OutbreakLocation } from "../data/DataService";
import { FlexDirectionProperty } from "csstype";

// tslint:disable-next-line:interface-name
export interface AppState
{
    displayMode?: FlexDirectionProperty,
    theme?: any,
    updateInterval?: number,
    updateActive?: boolean,
    updateDate?: string,
    dataIndexMin?: number,
    dataIndexMax?: number,
    currentIndex?: number,
    currentDate?: string,
    usePropStats?: boolean,
    showFlags?: boolean,
    showLists?: boolean,
    showTotalDeathList?: boolean,
    showTotalInfectionList?: boolean,
    showChart?: boolean,
    showBarGraph?: boolean,
    showMap?: boolean,
    showCodes?: boolean,
    showIndex?: boolean,
    width?: number,
    isLoading?: boolean,
    isTourOpen?: boolean,


    frameInfo?: string,

    bubbleMemberPath?: string,
    bubbleIsLogarithmic?: boolean,

    xAxisMemberPath?: string,
    yAxisMemberPath?: string,
    xAxisIsLogarithmic?: boolean,
    yAxisIsLogarithmic?: boolean,

    xAxisMinimumValue?: number,
    xAxisMaximumValue?: number,
    yAxisMinimumValue?: number,
    yAxisMaximumValue?: number,
    countriesStats?: OutbreakLocation[],
    countriesSelected?: string[],
    highlighted?: string[],
    visualisation?: number
};

// tslint:disable-next-line:interface-name
export interface ChartProps
{
    style: any,
    theme?: any,
    countries: OutbreakLocation[],
    notifyDataChange?(): void,
};
