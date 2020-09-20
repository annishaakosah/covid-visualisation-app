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
} from "recharts"; ""
import * as React from "react";

export class StackedChart extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <ResponsiveContainer height={"100%"} maxHeight={"80vh"}>
                <BarChart
                    data={this.props.data}
                    margin={{top: 20, right: 50, left: 50, bottom: 5}}
                >
                    <CartesianGrid strokeDasharray="0 0" stroke="rgba(29,140,248,0.25)" strokeWidth="0.5"/>
                    <XAxis dataKey='date' tickFormatter={formatXAxis} height={50}/>
                    <YAxis tickFormatter={this.numberWithCommas}/>
                    <Tooltip
                        formatter={this.numberWithCommas}
                        cursor={{ fill:'rgba(139,135,145,0.3)', strokeWidth: 2 }} 
                    />
                    <Legend/>

                    <Bar name="Asia" dataKey="asia" stackId="a" fill="#eb4d4b" color="#ffffff"/>
                    <Bar name="Africa" dataKey="africa" stackId="a" fill="#f9ca24"/>
                    <Bar name="North America" dataKey="northAmerica" stackId="a" fill="#6ab04c"/>
                    <Bar name="South America" dataKey="southAmerica" stackId="a" fill="#8e44ad"/>
                    <Bar name="Europe" dataKey="europe" stackId="a" fill="#3498db"/>
                    <Bar name="Oceania" dataKey="oceania" stackId="a" fill="#F97F51"/>
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

const formatXAxis: TickFormatterFunction = (tickItem: string) =>
    tickItem.slice(0, -6)