import * as React from "react";

import {DataService, OutbreakLocation} from "../data/DataService";
import {AppState} from "./AppState"
import {
    IgrChartMouseEventArgs,
    IgrDataChart,
    IgrDataChartCategoryModule,
    IgrDataChartCoreModule,
    IgrDataChartInteractivityModule,
    IgrDataChartScatterCoreModule,
    IgrDataChartScatterModule,
    IgrNumberAbbreviatorModule,
    IgrNumericXAxis,
    IgrNumericYAxis,
    IgrScatterLineSeries,
    IgrScatterSeries,
    IgrSeriesViewer,
    MarkerType
} from 'igniteui-react-charts';
// tooltip and marker modules:
import {DataContext, DataTemplateMeasureInfo, DataTemplateRenderInfo} from "igniteui-react-core";

IgrDataChartCoreModule.register();
IgrDataChartCategoryModule.register();
IgrDataChartScatterCoreModule.register();
IgrDataChartScatterModule.register();
IgrDataChartInteractivityModule.register();
IgrNumberAbbreviatorModule.register();

export class ChartView extends React.Component<any, AppState> {
    // Colour scheme and font styling of various components of the application.
    public themes: any = {
        dark:  {
            name: "dark",

            infections: { color: "#1d8cf8", fill: "#262a3c" },
            deaths:     { color: "#FF3D60", fill: "#262a3c" },
            recoveries: { color: "#4CAF50", fill: "#262a3c" },

            plot:       { color: "white", background: "#262a3c" },
            tooltip:    { color: "#242241", background: "#FFFFFF" },
            axisTitles: { color: "rgba(255, 255, 255, 0.4)", fontFamily: "Poppins" },
            axisLabels: { color: "rgba(255, 255, 255, 0.7)", fontFamily: "Poppins" },
            axisLines:  { color: "rgba(29, 140, 248, 0.25)", border: "0.5px solid" },
        },
    };

    public chart: IgrDataChart;
    public markerSeries: IgrScatterSeries;
    public highlightSeries: IgrScatterLineSeries;
    public historySeries: IgrScatterLineSeries[] = [];
    public historySeriesCount: number = 1;

    public selectedCountries: OutbreakLocation[];

    constructor(props: any) {
        super(props);

        this.state = {
            theme: props.theme,
            countriesStats: [],
        };

        this.onChartRef = this.onChartRef.bind(this);
        this.onSeriesMouseEnter = this.onSeriesMouseEnter.bind(this);
        this.onSeriesMouseLeave = this.onSeriesMouseLeave.bind(this);

        this.getTooltip = this.getTooltip.bind(this);
    }

    public getProp(propName: string, defaultValue: any): any {
        return this.props[propName] !== undefined ? this.props[propName] : defaultValue;
    }


    public render() {
        let theme = this.themes[this.props.theme || "dark"];

        let xAxisMinimumValue = this.getProp("xAxisMinimumValue", 1);
        let xAxisMaximumValue = this.getProp("xAxisMaximumValue", 100);

        let yAxisMinimumValue = this.getProp("yAxisMinimumValue", 1);
        let yAxisMaximumValue = this.getProp("yAxisMaximumValue", 100);

        let style = { } as React.CSSProperties;
        style.display = this.props.isVisible ? "block" : "none";

        return (
        <div className="app-stack-chart" style={style}>
            <IgrDataChart ref={this.onChartRef}
                isHorizontalZoomEnabled={true}
                isVerticalZoomEnabled={true}
                plotAreaBackground={theme.plot.background}
                seriesMouseEnter={this.onSeriesMouseEnter}
                seriesMouseLeave={this.onSeriesMouseLeave}
                subtitleTextColor={theme.axisLabels.color}
                width="100%"
                height="100%">

                <IgrNumericXAxis name="xAxis"
                    tickLength="5"
                    tickStrokeThickness="0.5"
                    tickStroke={theme.axisLines.color}
                    labelTextColor={theme.axisLabels.color}
                    titleTextColor={theme.axisLabels.color}
                    majorStroke={theme.axisLines.color}
                    majorStrokeThickness="0.5"
                    stroke={theme.axisLines.color}
                    strokeThickness="0.75"
                    abbreviateLargeNumbers={true}
                    isLogarithmic={false}
                    minimumValue={xAxisMinimumValue}
                    maximumValue={xAxisMaximumValue}
                    title={ DataService.GetDisplayName(this.props.xAxisMemberPath, this.props.usePropStats)}
                    titleBottomMargin="0"
                    />

                <IgrNumericYAxis name="yAxis"
                    tickLength="5"
                    tickStrokeThickness="0.5"
                    tickStroke={theme.axisLines.color}
                    labelTextColor={theme.axisLabels.color}
                    titleTextColor={theme.axisLabels.color}
                    majorStroke={theme.axisLines.color}
                    majorStrokeThickness="0.5"
                    stroke={theme.axisLines.color}
                    strokeThickness="0.75"
                    abbreviateLargeNumbers={true}
                    isLogarithmic={false}
                    minimumValue={yAxisMinimumValue}
                    maximumValue={yAxisMaximumValue}
                    title={ DataService.GetDisplayName(this.props.yAxisMemberPath, this.props.usePropStats)}
                    titleLeftMargin={0}
                    titleRightMargin={0}
                    labelLeftMargin={0}
                    />


            </IgrDataChart>
        </div>
        );
    }

    public onSeriesMouseEnter(s: IgrSeriesViewer, e: IgrChartMouseEventArgs) {
        let location = e.item as OutbreakLocation;
        if (location === null || location === undefined) { return; }

        this.highlightSeries.dataSource = [];

        for (let i = 0; i < this.selectedCountries.length; i++) {
            let item = this.selectedCountries[i];
            if (item.iso === location.iso) {
                this.highlightSeries.dataSource = item.progress;
                break;
            }
        }
    }

    public onSeriesMouseLeave(s: IgrSeriesViewer, e: IgrChartMouseEventArgs) {
        this.highlightSeries.dataSource = [];

        let location = e.item as OutbreakLocation;
        if (location === null || location === undefined) { return; }
    }

    public onChartRef(chart: IgrDataChart) {
        this.chart = chart;
        if (this.chart === null) { return; }
        if (this.chart === undefined) { return; }

        this.chart.series.clear();

        for (let i = 0; i < this.historySeriesCount; i++) {
            let series = this.createHistorySeries();
            this.chart.series.add(series);
            this.historySeries.push(series);
        }

        this.highlightSeries = this.createHistorySeries();
        this.highlightSeries.thickness = 4;
        this.chart.series.add(this.highlightSeries);

        this.markerSeries = this.createMarkerSeries("Large Countries");
        this.chart.series.add(this.markerSeries);

        this.updateMarkers();
    }

    public createMarkerSeries(title: string): IgrScatterSeries {
        let xAxisMemberPath = this.props.xAxisMemberPath || "totalInfections";
        let yAxisMemberPath = this.props.yAxisMemberPath || "weeklyInfections";

        const id = "series" + this.chart.series.count;
        const series = new IgrScatterSeries({ name: id });
        series.title = title;
        series.markerType = MarkerType.Circle;

        series.xMemberPath = xAxisMemberPath;
        series.yMemberPath = yAxisMemberPath;
        series.xAxisName = "xAxis";
        series.yAxisName = "yAxis";
        series.showDefaultTooltip = false;
        series.tooltipTemplate = this.getTooltip;
        return series;
    }

    public createHistorySeries(): IgrScatterLineSeries {
        let xAxisMemberPath = this.props.xAxisMemberPath || "totalInfections";
        let yAxisMemberPath = this.props.yAxisMemberPath || "weeklyInfections";

        const id = "series" + this.chart.series.count;
        const series = new IgrScatterLineSeries({ name: id });
        series.markerType = MarkerType.None;

        series.brush = "gray";
        series.thickness = 2;
        series.xMemberPath = xAxisMemberPath;
        series.yMemberPath = yAxisMemberPath;
        series.xAxisName = "xAxis";
        series.yAxisName = "yAxis";
        series.showDefaultTooltip = false;
        return series;
    }

    public updateMarkers() {
        let theme = this.themes[this.props.theme || "dark"];
        let xAxisMemberPath = this.props.xAxisMemberPath || "totalInfections";

        if (xAxisMemberPath === "totalInfections") {
            this.markerSeries.markerTemplate = this.getMarker(theme.infections, false);
            this.highlightSeries.brush = theme.infections.color;
        } else if (xAxisMemberPath === "totalRecoveries") {
            this.markerSeries.markerTemplate = this.getMarker(theme.recoveries, false);
            this.highlightSeries.brush = theme.recoveries.color;
        } else {
            this.markerSeries.markerTemplate = this.getMarker(theme.deaths, false);
            this.highlightSeries.brush = theme.deaths.color;
        }
    }

    public updateColumns() {
        let xAxisMemberPath = this.props.xAxisMemberPath || "totalInfections";
        let yAxisMemberPath = this.props.yAxisMemberPath || "weeklyInfections";

        this.updateMarkers();

        this.markerSeries.xMemberPath = xAxisMemberPath;
        this.markerSeries.yMemberPath = yAxisMemberPath;

        this.highlightSeries.xMemberPath = xAxisMemberPath;
        this.highlightSeries.yMemberPath = yAxisMemberPath;
        for (let i = 0; i < this.historySeries.length; i++) {
            this.historySeries[i].xMemberPath = xAxisMemberPath;
            this.historySeries[i].yMemberPath = yAxisMemberPath;
        }

    }

    public updateData(allCountries: OutbreakLocation[], selectedNames: string[], date: string) {
        if (this.chart === undefined) { return; }

        if (selectedNames.length > this.historySeriesCount) {
            for (let i = 0; i < selectedNames.length - this.historySeriesCount; i++) {
                let series = this.createHistorySeries();
                this.chart.series.insert(0, series);
                this.historySeries.push(series);
            }
            this.historySeriesCount = selectedNames.length;
        }

        this.selectedCountries = [];
        for (const item of allCountries) {
            if (
                selectedNames.indexOf(item.iso) >= 0) {
                this.selectedCountries.push(item);
            }
        }

        this.markerSeries.dataSource = this.selectedCountries;

        for (let i = 0; i < this.historySeries.length; i++) {

            if (i < this.selectedCountries.length) {
                this.historySeries[i].dataSource = this.selectedCountries[i].progress;
            } else {
                this.historySeries[i].dataSource = [];
            }
        }
    }

    public getTooltip(context: any) {
        const dataContext = context.dataContext as DataContext;
        if (!dataContext) return null;

        const dataItem = dataContext.item as OutbreakLocation;
        if (!dataItem) return null;

        let theme = this.themes[this.props.theme || "dark"];

        let xDataMember = this.props.xAxisMemberPath || "totalInfections";
        let yDataMember = this.props.yAxisMemberPath || "weeklyInfections";
        let xDataValue = DataService.format(dataItem[xDataMember]);
        let yDataValue = DataService.format(dataItem[yDataMember]);

        let yDataHeader = DataService.GetDisplayName(yDataMember, this.props.usePropStats);
        let xDataHeader = DataService.GetDisplayName(xDataMember, this.props.usePropStats);

        return <div>
            <div className="tooltip" style={theme.tooltip}>
                <div className="tooltipHeader">
                    <img className="tooltipFlag" src={dataItem.flag}/>
                    <div className="tooltipTitle" >{dataItem.country}</div>
                </div>
                <div className="tooltipBox">

                    <div className="tooltipRow">
                        <div className="tooltipLbl">{yDataHeader}</div>
                        <div className="tooltipVal">{yDataValue}</div>
                    </div>
                    <div className="tooltipRow">
                        <div className="tooltipLbl">{xDataHeader}</div>
                        <div className="tooltipVal">{xDataValue}</div>
                    </div>
                    <div className="tooltipRow">
                        <div className="tooltipLbl">Date</div>
                        <div className="tooltipVal">{dataItem.date}</div>
                    </div>
                </div>
            </div>
        </div>
    }

    public getMarker(style: any, useFlags: boolean): any {
        if (style === undefined) style = { color: "#7D73E6", fill: "white", text: "black" };

        const size = 12;
        const radius = size / 2;
        return {
            measure: function (measureInfo: DataTemplateMeasureInfo) {
                const data = measureInfo.data;
                const context = measureInfo.context;
                let name = "null";
                let item = data.item as OutbreakLocation;
                const height = context.measureText("M").width;
                const width = context.measureText("USA").width;
                measureInfo.width = width;
                measureInfo.height = height + size;
            },
            render: function (renderInfo: DataTemplateRenderInfo) {
                const location = renderInfo.data.item as OutbreakLocation;
                const name = location.iso.toString().toUpperCase();

                const ctx = renderInfo.context as CanvasRenderingContext2D;
                let x = renderInfo.xPosition;
                let y = renderInfo.yPosition;
                let halfHeight = renderInfo.availableHeight / 2.0;

                if (renderInfo.isHitTestRender) {
                    ctx.fillStyle = renderInfo.data.actualItemBrush.fill;
                    ctx.fillRect(x, y, renderInfo.availableWidth, renderInfo.availableHeight);
                    return;
                } else {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = style.fill;
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = style.color;
                    ctx.stroke();
                    ctx.closePath();
                }

                x = renderInfo.xPosition + 5;
                y = renderInfo.yPosition + 7.5;
                if (y < 0) {
                    y -= renderInfo.availableHeight + 7.5;
                }

                let bottomEdge = renderInfo.passInfo.viewportTop + renderInfo.passInfo.viewportHeight;
                if (y + renderInfo.availableHeight > bottomEdge) {
                    y -= renderInfo.availableHeight + 5;
                }


                let rightEdge = renderInfo.passInfo.viewportLeft + renderInfo.passInfo.viewportWidth;
                if (x + renderInfo.availableWidth > rightEdge) {
                    x -= renderInfo.availableWidth + 12;
                }

                ctx.beginPath();
                ctx.fillStyle = style.color;
                ctx.fillRect(x - 2, y - 2, renderInfo.availableWidth + 8, halfHeight + 6);
                ctx.closePath();

                ctx.font = '8pt Verdana';
                ctx.textBaseline = "top";
                ctx.fillStyle = style.fill;
                ctx.fillText(name, x + 2, y + 1);
            }
        }
    }
}
