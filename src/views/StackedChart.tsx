import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  TickFormatterFunction
} from "recharts";
import moment from 'moment';
import * as React from "react";
import { useEffect } from "react";
import { DataService, OutbreakLocation } from "../data/DataService";
import useWhoDataStore  from "../data/whoDataStore";

const data = [
  { name: "Page A", asia: 4000, africa: 2400, europe: 2400 },
  { name: "Page B", uv: 3000, pv: 1398, amt: 2210 },
  { name: "Page C", uv: 2000, pv: 9800, amt: 2290 },
  { name: "Page D", uv: 2780, pv: 3908, amt: 2000 },
  { name: "Page E", uv: 1890, pv: 4800, amt: 2181 },
  { name: "Page F", uv: 2390, pv: 3800, amt: 2500 },
  { name: "Page G", uv: 3490, pv: 4300, amt: 2100 },
];


export class StackedChart extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
  }

  
  
    


  public continentColours: string[] = ["#eb4d4b", "#f9ca24", "#6ab04c", "#8e44ad", "#3498db", "#F97F51"];

  public render() {
    // const whoDataStore = useWhoDataStore();
    // console.log(whoDataStore?.getDataArrayWithTime('confirmed', undefined));

    return (
      <ResponsiveContainer height={"100%"} maxHeight={"80vh"}>
         {/* <BarChart
          data={whoDataStore?.getDataArrayWithTime(dataType, sliderValue ? sliderValue : undefined)}
          margin={{
            top: 20,
          }}
        > */}
      
        {/* </BarChart> */}

        <BarChart
          data={data} // replace with parsed data
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="0 0" stroke="rgba(29,140,248,0.25)" strokeWidth="0.5"/>
          <XAxis dataKey='time' tickFormatter={formatXAxis} height={50} />
          <YAxis />
          {/* <Tooltip /> */}
          <Tooltip
            labelFormatter={(tickItem: number) => moment(tickItem * 1000).format('MMMM Do')}
            formatter={this.numberWithCommas}
          />
          <Legend />

          
          
          {/* {whoDataStore?.possibleRegions?.map((region, i) => {
              console.log(region);
              return <Bar dataKey={region} stackId={'a'} fill={this.continentColours[i]} key={i} />;
            })}  */}

          <Bar dataKey="asia" stackId="a" fill="#8884d8" />
          <Bar dataKey="africa" stackId="a" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  
  public numberWithCommas(x: number | string | undefined): string | undefined {
    if (x === undefined || x === null) {
      return undefined;
    }
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

const TIME_FORMAT = 'MMM Do';
const formatXAxis: TickFormatterFunction = (tickItem: number) =>
  moment(tickItem * 1000).format(TIME_FORMAT);
