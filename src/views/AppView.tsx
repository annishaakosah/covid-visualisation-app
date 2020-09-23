import * as React from "react";

import * as IconPlay from "@material-ui/icons/PlayArrow";
import * as IconPause from "@material-ui/icons/Pause";
import IconButton from '@material-ui/core/IconButton';
import Tour from 'reactour'

import "../data/Extensions";
import { Locations } from "../data/Locations";

import { AppState } from "./AppState"
import { ChartView } from "./ChartView";
import { ChartAxisRange } from "./ChartAxisRange";
import { StackedChart } from "./StackedChart";
import { ListView } from "./ListView";
import { DataService, OutbreakStats } from "../data/DataService";
import { Slider } from "../components/Slider";
import { Tooltip } from "../components/Tooltip";
import { SplashScreen } from "../components/SplashScreen"
import { IgrShapeDataSource, parseBool } from 'igniteui-react-core';
import ChoroplethMap from './ChoroplethMap';

/**
 * Onboarding steps for new users.
 */
const steps = [
    {
      selector: '#first-step',
      content: () => (<div>Welcome to our COVID-19 Dashboard! <br/><br/> To toggle between visualisations, click these icons</div>),
      style: {
       outline: 0,
      },
    },
    {
      selector: '#second-step',
      content: 'Use these tabs to toggle between different stats. You can look at the total number of cases, deaths or recorveries.',
    },
    {
      selector: '#third-step',
      content: () => (<div>Want to see how COVID data changes over time?<br/><br/>Use this player to see how the stats changes by the day.</div>),
    },
  ];

export class AppView extends React.Component<any, AppState> {
    // Colour scheme and font styling of various components of the application.
    public themes: any = {
        dark: {
            name: "dark",
            primary: { color: "white", background: "#1E1F2E" },
            card: { color: "#242241", background: "#262a3c" },
            tooltip: { color: "#262a3c", background: "white" },
            toolbar: { color: "white", background: "#1E1F2E" },
            buttons: { color: "#131416", background: "#1d8cf8" },
            list: { color: "#ddddde", background: "#131416", border: "1px solid #222327" },
            listItem: { color: "rgba(255, 255, 255, 0.7)", fontWeight: "normal" },
            listSelected: { color: "rgba(39,103,182, 0.5)", fontWeight: "bold" },
            listValue: { color: "#ddddde", fontWeight: "bold" },
            listFlag: { border: "1px solid #5b5858" },

            buttonSelected: { color: "#ffffff", background: "#1d8cf8", width: "auto" },
            buttonNormal: { color: "#ffffff", background: "#262a3c", width: "auto" },

            sourceInfo: { color: "#ffffff" },
            infections: { color: "#1d8cf8" },
            recoveries: { color: "#4CAF50" }, 
            deaths: { color: "#FF3D60" }, 
        },
    };

    // Data structures used by the visualisations.
    public frameInterval: number = -1;
    public chart: ChartView;
    public lists: ListView[] = [];
    public listInfections: ListView;
    public listDeaths: ListView;
    public listRecoveries: ListView;
    public listsUpdating = false;
    public splashScreen: SplashScreen;

    constructor(props: any) {
        super(props);

        this.parseQuery();
        this.onClickStart = this.onClickStart.bind(this);
        this.onSliderChangeIndex = this.onSliderChangeIndex.bind(this);
        this.onCreatedChart = this.onCreatedChart.bind(this);
        this.onCreatedListView = this.onCreatedListView.bind(this);
        this.onCreatedListViewInfections = this.onCreatedListViewInfections.bind(this);
        this.onCreatedListViewDeaths = this.onCreatedListViewDeaths.bind(this);
        this.onCreatedListViewRecoveries = this.onCreatedListViewRecoveries.bind(this);
        this.onCreatedSplash = this.onCreatedSplash.bind(this);
        this.onResize = this.onResize.bind(this);
        this.onShapesLoaded = this.onShapesLoaded.bind(this);
        this.onCountrySelected = this.onCountrySelected.bind(this);
        this.onSelectedListInfections = this.onSelectedListInfections.bind(this);
        this.onSelectedListDeaths = this.onSelectedListDeaths.bind(this);
        this.onSelectedListRecoveries = this.onSelectedListRecoveries.bind(this);
        this.onClickTogglePropStats = this.onClickTogglePropStats.bind(this);
        this.onClickPlotYAxis = this.onClickPlotYAxis.bind(this);
        this.onClickPlotXAxis = this.onClickPlotXAxis.bind(this);
        this.onClickPlotInfections = this.onClickPlotInfections.bind(this);
        this.onClickPlotDeaths = this.onClickPlotDeaths.bind(this);
        this.onClickPlotRecoveries = this.onClickPlotRecoveries.bind(this);
        this.setVisualisation = this.setVisualisation.bind(this);
    }

    /**
     * Function to set button style based on application state
     **/
    public getButtonStyle(color?: string, background?: string): React.CSSProperties {
        let style = {
            color: color === undefined ? "black" : color,
            background: background === undefined ? "transparent" : background,
            marginLeft: "0.25rem", marginRight: "0.25rem",
            padding: "0.25rem",
            width: "2rem", height: "2rem",
            fontSize: "1.2rem", display: "inline-block"
        } as React.CSSProperties;
        return style;
    }

    public render() {
        let theme = this.themes[this.state.theme];

        let playStyle = this.getButtonStyle(theme.buttons.color, theme.buttons.background);

        // toggle button styling
        let toggleBackground = "rgba(255, 255, 255, 0.2)";
        let toggleThemeStyle = this.getButtonStyle(theme.toolbar.color);
        toggleThemeStyle.background = this.state.theme === "light" ? toggleBackground : "transparent";
        let toggleHelpStyle = this.getButtonStyle(theme.buttons.color);
        toggleHelpStyle.background = "transparent";
        toggleHelpStyle.color = "white";
        let togglePropStyle = this.getButtonStyle(theme.buttons.color);
        togglePropStyle.background = this.state.usePropStats ? toggleBackground : "transparent";
        togglePropStyle.fontSize = "1rem";
        togglePropStyle.fontWeight = 700;

        // header and footer styling
        let toolbarStyle = { color: theme.toolbar.color, background: theme.toolbar.background } as React.CSSProperties;
        let contentStyle = { color: theme.primary.color, background: theme.primary.background } as React.CSSProperties;
        let cardStyle = { color: theme.card.color, background: theme.card.background } as React.CSSProperties;
        let footerStyle = { color: theme.primary.color, background: "transparent" } as React.CSSProperties;

        // data type button styling
        let tdButtonStyle = this.state.showTotalDeathList ? theme.buttonSelected : theme.buttonNormal;
        let tiButtonStyle = this.state.showTotalInfectionList ? theme.buttonSelected : theme.buttonNormal;
        let trButtonStyle = this.state.showTotalRecoveries ? theme.buttonSelected : theme.buttonNormal;
        let ddButtonStyle = this.state.showDailyDeaths ? theme.buttonSelected : theme.buttonNormal;
        let diButtonStyle = this.state.showDailyInfections ? theme.buttonSelected : theme.buttonNormal;
        let tabStyle = {} as React.CSSProperties;
        tabStyle.display = (this.state.showChart || this.state.showMap) ? "flex" : "none";

        // tool tip styling
        let tipBackground = theme.tooltip.background;
        let tipForeground = theme.tooltip.color;

        return (
            // Root of application
            <div className="app-root" >
                <div className="app-main" style={contentStyle}>
                    {/*Header*/}
                    <div className="app-toolbar" style={toolbarStyle}>
                        <div className="app-toolbar-title">COVID-19 Dashboard</div>
                            <Tooltip background={tipBackground} color={tipForeground}
                                message="Index Chart" >
                                <IconButton id="first-step" onClick={() => this.setVisualisation(1)} style={toggleThemeStyle} edge="start" >
                                    <i className="tim-icons icon-sound-wave" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip background={tipBackground} color={tipForeground}
                                message="Geo Graph" >
                                <IconButton onClick={() => this.setVisualisation(2)} style={toggleThemeStyle} edge="start" >
                                    <i className="tim-icons icon-world" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip background={tipBackground} color={tipForeground}
                                message="Stacked Bar Graph" >
                                <IconButton onClick={() => this.setVisualisation(3)} style={toggleThemeStyle} edge="start" >
                                    <i className="tim-icons icon-chart-bar-32" />
                                </IconButton>
                            </Tooltip>
                    </div>

                    {/*Index Map and ListView*/}
                    {this.state.visualisation === 1 &&
                        <div className="app-content">
                            {/*Total Deaths List*/}
                            {this.state.showLists && this.state.showTotalDeathList &&
                                <ListView
                                    valuePropertyPath="totalDeaths"
                                    indexPropertyPath="indexDeaths"
                                    imagePropertyPath="flag"
                                    codePropertyPath="iso"
                                    namePropertyPath="country"
                                    showCodes={this.state.showCodes}
                                    showIndex={this.state.showIndex}
                                    usePropStats={this.state.usePropStats}
                                    selectedItemKeys={this.state.countriesSelected}
                                    ref={this.onCreatedListViewDeaths}
                                    onSelected={this.onSelectedListDeaths}
                                    theme={theme}
                                    style={theme.list} />
                            }

                            {/*Total Infections List*/}
                            {this.state.showLists && this.state.showTotalInfectionList &&
                                <ListView
                                    valuePropertyPath="totalInfections"
                                    indexPropertyPath="indexInfections"
                                    imagePropertyPath="flag"
                                    codePropertyPath="iso"
                                    namePropertyPath="country"
                                    showCodes={this.state.showCodes}
                                    showIndex={this.state.showIndex}
                                    usePropStats={this.state.usePropStats}
                                    selectedItemKeys={this.state.countriesSelected}
                                    ref={this.onCreatedListViewInfections}
                                    onSelected={this.onSelectedListInfections}
                                    theme={theme}
                                    style={theme.list} />
                            }

                            {/*Total Recoveries List*/}
                            {this.state.showLists && this.state.showTotalRecoveries &&
                            <ListView
                              valuePropertyPath="totalRecoveries"
                              indexPropertyPath="indexRecoveries"
                              imagePropertyPath="flag"
                              codePropertyPath="iso"
                              namePropertyPath="country"
                              showCodes={this.state.showCodes}
                              showIndex={this.state.showIndex}
                              usePropStats={this.state.usePropStats}
                              selectedItemKeys={this.state.countriesSelected}
                              ref={this.onCreatedListViewRecoveries}
                              onSelected={this.onSelectedListRecoveries}
                              theme={theme}
                              style={theme.list} />
                            }

                            {/*Data type toggle*/}
                            <div className="app-center" style={cardStyle}>
                                <div id="second-step" className="app-button-row" style={tabStyle}>
                                    <div className="app-button-tab" style={tdButtonStyle}
                                        onClick={() => this.onClickPlotDeaths()}>
                                        <span>Total Deaths</span>
                                    </div>
                                    <div className="app-button-tab" style={tiButtonStyle}
                                        onClick={() => this.onClickPlotInfections()}>
                                        <span>Total Cases</span>
                                    </div>
                                    <div className="app-button-tab" style={trButtonStyle}
                                         onClick={() => this.onClickPlotRecoveries()}>
                                         <span>Total Recoveries</span>
                                    </div>
                                </div>

                                {/*Chart View Component*/}
                                <div className="app-stack" style={{ flexDirection: this.state.displayMode }}>
                                    <ChartView ref={this.onCreatedChart}
                                        isVisible={this.state.showChart}
                                        style={theme.list}
                                        theme={this.state.theme}
                                        usePropStats={this.state.usePropStats}
                                        xAxisMemberPath={this.state.xAxisMemberPath}
                                        yAxisMemberPath={this.state.yAxisMemberPath}
                                        xAxisMinimumValue={this.state.xAxisMinimumValue}
                                        xAxisMaximumValue={this.state.xAxisMaximumValue}
                                        yAxisMinimumValue={this.state.yAxisMinimumValue}
                                        yAxisMaximumValue={this.state.yAxisMaximumValue}
                                        updateInterval={this.state.updateInterval} />
                                </div>
                            </div>
                        </div>
                    }

                    {/*Chloropleth Map*/}
                    {this.state.visualisation === 2 &&
                        <div className="app-stack" style={{color: theme.card.color, background: theme.card.background, padding: "1.2rem"}}>
                          <div className="app-button-row" style={tabStyle}>
                            <div className="app-button-tab" style={tdButtonStyle}
                                 onClick={() => this.onClickPlotDeaths()}>
                              <span>Total Deaths</span>
                            </div>
                            <div className="app-button-tab" style={tiButtonStyle}
                                 onClick={() => this.onClickPlotInfections()}>
                              <span>Total Cases</span>
                            </div>
                            <div className="app-button-tab" style={trButtonStyle}
                                 onClick={() => this.onClickPlotRecoveries()}>
                                 <span>Total Recoveries</span>
                            </div>
                          </div>
                          <ChoroplethMap data={DataService.aggregateGeoCovidData(this.state.countriesStats)} state={this.state}/>
                        </div>
                    }

                    {/*StackBar Map*/}
                    {this.state.visualisation === 3 &&
                        <div className="app-content">
                            <div className="app-center" style={cardStyle}>
                              <div className="app-button-row" style={tabStyle}>
                                <div className="app-button-tab" style={tdButtonStyle}
                                     onClick={() => this.onClickPlotDeaths()}>
                                  <span>Total Deaths</span>
                                </div>
                                <div className="app-button-tab" style={tiButtonStyle}
                                     onClick={() => this.onClickPlotInfections()}>
                                  <span>Total Cases</span>
                                </div>
                                <div className="app-button-tab" style={ddButtonStyle}
                                     onClick={() => this.onClickPlotDailyDeaths()}>
                                  <span>Daily Deaths</span>
                                </div>
                                <div className="app-button-tab" style={diButtonStyle}
                                     onClick={() => this.onClickPlotDailyInfections()}>
                                  <span>Daily Cases</span>
                                </div>
                              </div>
                               <StackedChart data={this.getStackedBarData()} state={this.state}/>
                            </div>
                        </div>
                    }

                    {/*Slider For Live Data Visualisation*/}
                    {(this.state.visualisation === 1 || this.state.visualisation === 2) &&
                        <div id="third-step" className="app-actionbar" style={footerStyle}>
                          <IconButton onClick={this.onClickStart} style={playStyle} edge="start">
                              {this.state.updateActive ? <IconPause.default/> : <IconPlay.default/>}
                          </IconButton>

                          <Slider
                            min={this.state.dataIndexMin}
                            max={this.state.dataIndexMax}
                            value={this.state.currentIndex}
                            width="100%" theme={this.state.theme}
                            onChange={this.onSliderChangeIndex}/>

                          <div className="app-actionbar-date" style={theme.sourceInfo}>{this.state.currentDate}</div>
                        </div>
                    }
                </div>

                {/*Splashscreen to be displayed while processing data*/}
                <SplashScreen ref={this.onCreatedSplash} />

                {/*Onboarding component*/}
                <Tour
                    steps={steps}
                    rounded={10}
                    accentColor={"#1d8cf8"}
                    isOpen={this.state.isTourOpen}
                    onRequestClose={() => this.setState({ isTourOpen: false })}
                    showNavigationNumber={false}
        />
            </div>
        );
    }

    public onCreatedChart(chart: ChartView) {
        this.chart = chart;
    }

    public onCreatedSplash(splash: SplashScreen) {
        this.splashScreen = splash;
    }

    public onCreatedListViewInfections(listView: ListView) {
        this.listInfections = listView;
    }
    public onCreatedListViewDeaths(listView: ListView) {
        this.listDeaths = listView;
    }
    public onCreatedListViewRecoveries(listView: ListView) {
        this.listRecoveries = listView;
    }

    public onCreatedListView(listView: ListView) {
        this.lists.push(listView);
    }

    // Adjust size based on window resizes
    public validateSize() {
        if (window.innerWidth !== this.state.width) {
            if (window.innerWidth < 950) {
                this.setState({ width: window.innerWidth, showCodes: true, showIndex: false, displayMode: "column" });
            } else if (window.innerWidth < 1250) {
                this.setState({ width: window.innerWidth, showCodes: false, showIndex: false, displayMode: "column" });
            } else if (window.innerWidth < 1600) {
                this.setState({ width: window.innerWidth, showCodes: false, showIndex: true, displayMode: "column" });
            } else {
                this.setState({ width: window.innerWidth, showCodes: false, showIndex: true, displayMode: "row" });
            }
        }
    }

    public onResize() {
        this.validateSize();
    }

    public componentDidUpdate() {
        this.validateSize();
    }

    public componentDidMount() {
        window.addEventListener("resize", this.onResize);

        const sds = new IgrShapeDataSource();
        sds.importCompleted = this.onShapesLoaded;
        sds.shapefileSource = DataService.SHAPE_URL + 'world_countries_all.shp';
        sds.databaseSource = DataService.SHAPE_URL + 'world_countries_all.dbf';
        sds.dataBind();
    }

    public onShapesLoaded(sds: IgrShapeDataSource, e: any) {
        const shapes = sds.getPointData();

        DataService.getOutbreakReport(shapes).then(outbreak => {
            let last = outbreak.countries[0].history.length - 1;
            this.setState({
                countriesStats: outbreak.countries,
                stackedChartData: outbreak.stackedChartData,
                stackedDeathChartData: outbreak.stackedDeathChartData,
                stackedDailyChartData: outbreak.stackedDailyChartData,
                stackedDailyDeathChartData: outbreak.stackedDailyDeathChartData,
                dataIndexMin: 0,
                dataIndexMax: last,
                currentIndex: last,
                updateDate: outbreak.date,
                isLoading: false,
                isTourOpen: true,
            }, () => {
                this.updateRanges(this.state.countriesSelected);
                this.updateData(last);
                this.refreshLists();
            });
        });
    }

    public onSliderChangeIndex = (e: any) => {
        if (this.state.updateActive) { return; }

        let index = e.target.value = parseInt(e.target.value, 10);
        this.updateData(index);
    };

    public onClickStart(event: React.MouseEvent) {
        this.toggleAnimation();
    }

    // Set states of various component based on the visualisation button clicked.
    public setVisualisation(v: number) {
        if (this.state.showDailyDeaths || this.state.showDailyInfections) {
            this.onClickPlotDeaths()
        }
        if (v === 1) {
            this.setState({showLists: true},
                () => {
                    this.refreshAll();
                });
        }
        // StackedBar does not have total recovery data. So show total deaths stats instead on load.
        else if (v === 3 && this.state.showTotalRecoveries) {
            this.onClickPlotDeaths();
        }
        this.setState({ visualisation: v }, () => {
        });
    }

    public onClickTogglePropStats(event: React.MouseEvent) {
        let usePropStats = !this.state.usePropStats;

        this.setState({ usePropStats: usePropStats }, () => {
            this.updateRanges(this.state.countriesSelected, usePropStats);
            this.updateData(null, usePropStats);
        });
    }

    // fetch the data requested by stackedBar data based on props.state flags
    public getStackedBarData() {
        if(this.state.yAxisMemberPath == 'weeklyInfections') {
            return this.state.stackedChartData;
        }
        else if(this.state.yAxisMemberPath == 'weeklyDeaths') {
            return this.state.stackedDeathChartData;
        }
        else if(this.state.yAxisMemberPath == 'dailyInfections') {
            return this.state.stackedDailyChartData;
        }
        else {
            return this.state.stackedDailyDeathChartData;
        }
    }

    // Set only showTotalDeathList flag to true
    public onClickPlotDeaths() {
        this.setState({
            yAxisMemberPath: "weeklyDeaths",
            xAxisMemberPath: "totalDeaths",
            showTotalInfectionList: false,
            showTotalDeathList: true,
            showTotalRecoveries: false,
            showDailyDeaths: false,
            showDailyInfections: false
        },
            this.updateColumns);
    }

    // Set only showTotalInfectionList flag to true
    public onClickPlotInfections() {
        this.setState({
            yAxisMemberPath: "weeklyInfections",
            xAxisMemberPath: "totalInfections",
            showTotalDeathList: false,
            showTotalInfectionList: true,
            showTotalRecoveries: false,
            showDailyDeaths: false,
            showDailyInfections: false
        },
            this.updateColumns);
    }

    // Set only showTotalRecoveries flag to true
    public onClickPlotRecoveries() {
        this.setState({
            yAxisMemberPath: "weeklyRecoveries",
            xAxisMemberPath: "totalRecoveries",
            showTotalDeathList: false,
            showTotalInfectionList: false,
            showTotalRecoveries: true,
            showDailyDeaths: false,
            showDailyInfections: false
        }, this.updateColumns);
    }

    // Set only showDailyDeaths flag to true
    public onClickPlotDailyDeaths() {
        this.setState({
            yAxisMemberPath: "dailyDeaths",
            xAxisMemberPath: "totalDeaths",
            showTotalDeathList: false,
            showTotalInfectionList: false,
            showTotalRecoveries: false,
            showDailyDeaths: true,
            showDailyInfections: false
        }, this.updateColumns);
    }

    // Set only showDailyInfections flag to true
    public onClickPlotDailyInfections() {
        this.setState({
            yAxisMemberPath: "dailyInfections",
            xAxisMemberPath: "totalInfections",
            showTotalDeathList: false,
            showTotalInfectionList: false,
            showTotalRecoveries: false,
            showDailyDeaths: false,
            showDailyInfections: true
        }, this.updateColumns);
    }

    public onClickPlotXAxis(memberPath: string) {
        this.setState({ xAxisMemberPath: memberPath }, this.refreshAll);
    }
    public onClickPlotYAxis(memberPath: string) {
        this.setState({ yAxisMemberPath: memberPath }, this.refreshAll);
    }

    public toggleAnimation(): void {
        this.setState({ updateActive: !this.state.updateActive });

        if (this.frameInterval >= 0) {
            window.clearInterval(this.frameInterval);
            this.frameInterval = -1;

        } else {
            let index = this.state.currentIndex;
            if (index >= this.state.dataIndexMax) {
                index = 0;
            }
            this.updateData(index);
            this.frameInterval = window.setInterval(() => this.tick(), this.state.updateInterval);
        }
    }

    // Set the index of the data that is being used by visualisation while showing live data animation.
    public tick(): void {
        let index = this.state.currentIndex + 1;
        if (index > this.state.dataIndexMax) {
            this.toggleAnimation();
        } else {
            this.updateData(index);
        }
    }

    // add selected countries to list and update chart accordingly
    public onCountrySelected = (event: any) => {
        const country = event.currentTarget.id;
        let newSelection = this.state.countriesSelected;

        if (newSelection.indexOf(country) >= 0) {
            newSelection.remove(country);
        } else {
            newSelection.push(country);
        }

        this.setState({ countriesSelected: newSelection, },
            () => {
                this.listInfections.selectData(newSelection);
                this.listDeaths.selectData(newSelection);
                this.listRecoveries.selectData(newSelection);
                this.updateData();
            });
    };

    // set listInfections state with newly added countries.
    public onSelectedListInfections(s: ListView, items: string[]) {
        if (this.state.updateActive) { return; }
        if (this.listsUpdating) { return; }

        this.listsUpdating = true;
        this.setState({ countriesSelected: items, },
            () => {
                this.listInfections.selectData(items);
                this.updateRanges(items);
                this.updateData();
            });
    }

    // set listDeaths state with newly added countries.
    public onSelectedListDeaths(s: ListView, items: string[]) {
        if (this.state.updateActive) { return; }
        if (this.listsUpdating) { return; }

        this.listsUpdating = true;
        this.setState({ countriesSelected: items, },
            () => {
                this.listDeaths.selectData(items);
                this.updateRanges(items);
                this.updateData();
            });
    }

    // set listRecoveries state with newly added countries.
    public onSelectedListRecoveries(s: ListView, items: string[]) {
        if (this.state.updateActive) { return; }
        if (this.listsUpdating) { return; }

        this.listsUpdating = true;
        this.setState({ countriesSelected: items, },
            () => {
                this.listRecoveries.selectData(items);
                this.updateRanges(items);
                this.updateData();
            });
    }

    // set the ranges (min and max) of the graphs so that the data fits within the range
    public updateRanges(selectedCountries: string[], usePropStats?: boolean) {
        if (usePropStats === undefined || usePropStats === null) {
            usePropStats = this.state.usePropStats;
        }

        if (selectedCountries.length === 0) { return; }

        let minTotalInfections = Number.MAX_VALUE;
        let maxTotalInfections = Number.MIN_VALUE;
        let minTotalDeaths = Number.MAX_VALUE;
        let maxTotalDeaths = Number.MIN_VALUE;
        let minTotalRecoveries = Number.MAX_VALUE;
        let maxTotalRecoveries = Number.MIN_VALUE;

        let minWeekInfections = Number.MAX_VALUE;
        let maxWeekInfections = Number.MIN_VALUE;
        let minWeekDeaths = Number.MAX_VALUE;
        let maxWeekDeaths = Number.MIN_VALUE;
        let minWeekRecoveries = Number.MAX_VALUE;
        let maxWeekRecoveries = Number.MIN_VALUE;

        for (let outbreak of this.state.countriesStats) {

            let last = outbreak.history.length;
            let scale = 1;
            if (usePropStats) {
                scale = outbreak.population / 1000000; // 1M
            }

            let isCountrySelected = selectedCountries.indexOf(outbreak.iso) >= 0;
            if (isCountrySelected) {
                for (let i = 0; i < last; i++) {
                    minWeekInfections = Math.min(minWeekInfections, outbreak.history[i].weeklyInfections / scale);
                    maxWeekInfections = Math.max(maxWeekInfections, outbreak.history[i].weeklyInfections / scale);
                    minWeekDeaths = Math.min(minWeekDeaths, outbreak.history[i].weeklyDeaths / scale);
                    maxWeekDeaths = Math.max(maxWeekDeaths, outbreak.history[i].weeklyDeaths / scale);
                    minWeekRecoveries = Math.min(minWeekRecoveries, outbreak.history[i].weeklyRecoveries / scale);
                    maxWeekRecoveries = Math.max(maxWeekRecoveries, outbreak.history[i].weeklyRecoveries / scale);

                    minTotalInfections = Math.min(minTotalInfections, outbreak.history[i].totalInfections / scale);
                    maxTotalInfections = Math.max(maxTotalInfections, outbreak.history[i].totalInfections / scale);
                    minTotalDeaths = Math.min(minTotalDeaths, outbreak.history[i].totalDeaths / scale);
                    maxTotalDeaths = Math.max(maxTotalDeaths, outbreak.history[i].totalDeaths / scale);
                    minTotalRecoveries = Math.min(minTotalRecoveries, outbreak.history[i].totalRecoveries / scale);
                    maxTotalRecoveries = Math.max(maxTotalRecoveries, outbreak.history[i].totalRecoveries / scale);
                }
            }
        }

        let xAxisRange: ChartAxisRange;
        let yAxisRange: ChartAxisRange;

        if (this.state.xAxisMemberPath === "totalInfections") {
            xAxisRange = ChartAxisRange.calculate(minTotalInfections, maxTotalInfections, false);
            yAxisRange = ChartAxisRange.calculate(minWeekInfections, maxWeekInfections, false);
        } else if (this.state.xAxisMemberPath === "totalRecoveries") {
            xAxisRange = ChartAxisRange.calculate(minTotalRecoveries, maxTotalRecoveries, false);
            yAxisRange = ChartAxisRange.calculate(minWeekRecoveries, maxWeekRecoveries, false);
        } else {
            xAxisRange = ChartAxisRange.calculate(minTotalDeaths, maxTotalDeaths, false);
            yAxisRange = ChartAxisRange.calculate(minWeekDeaths, maxWeekDeaths, false);
        }

        xAxisRange.minimum = usePropStats ? 0.1 : 1;
        yAxisRange.minimum = usePropStats ? 0.1 : 1;

        this.setState({
            xAxisMinimumValue: xAxisRange.minimum,
            xAxisMaximumValue: xAxisRange.maximum,
            yAxisMinimumValue: yAxisRange.minimum,
            yAxisMaximumValue: yAxisRange.maximum,
        });
    }

    // update data for all visualisations based on the index of the outbreak list
    public updateData(index?: number, usePropStats?: boolean) {
        if (index === undefined || index === null) {
            index = this.state.currentIndex;
        }

        if (usePropStats === undefined || usePropStats === null) {
            usePropStats = this.state.usePropStats;
        }

        let thresholdProp = "totalInfections";
        let thresholdValue = 1;
        if (this.state.xAxisMemberPath === "totalInfections") {
            thresholdProp = "totalInfections";
            thresholdValue = usePropStats ? 1 : 1;
        } else if (this.state.xAxisMemberPath === "totalRecoveries") {
            thresholdProp = "totalRecoveries";
            thresholdValue = usePropStats ? 1 : 1;
        } else {
            thresholdProp = "totalDeaths";
            thresholdValue = usePropStats ? 1 : 1;
        }

        let date = "";
        for (let outbreak of this.state.countriesStats) {

            let scale = 1;
            if (usePropStats) {
                scale = outbreak.population / 1000000;
            }

            let last = outbreak.history.length;
            if (last > index) {
                outbreak.totalInfections = outbreak.history[index].totalInfections / scale;
                outbreak.totalRecoveries = outbreak.history[index].totalRecoveries / scale;
                outbreak.totalDeaths = outbreak.history[index].totalDeaths / scale;

                outbreak.dailyInfections = outbreak.history[index].dailyInfections / scale;
                outbreak.dailyRecoveries = outbreak.history[index].dailyRecoveries / scale;
                outbreak.dailyDeaths = outbreak.history[index].dailyDeaths / scale;

                outbreak.weeklyInfections = outbreak.history[index].weeklyInfections / scale;
                outbreak.weeklyRecoveries = outbreak.history[index].weeklyRecoveries / scale;
                outbreak.weeklyDeaths = outbreak.history[index].weeklyDeaths / scale;

                if (usePropStats) {
                    outbreak.weeklyDeaths = Math.max(0.11, outbreak.weeklyDeaths);
                    outbreak.weeklyInfections = Math.max(0.11, outbreak.weeklyInfections);
                    outbreak.weeklyRecoveries = Math.max(0.11, outbreak.weeklyRecoveries);
                } else {
                    outbreak.weeklyDeaths = Math.max(1, outbreak.weeklyDeaths);
                    outbreak.weeklyInfections = Math.max(1, outbreak.weeklyInfections);
                    outbreak.weeklyRecoveries = Math.max(1, outbreak.weeklyRecoveries);
                }

                outbreak.date = outbreak.history[index].date;

                if (date === "" && outbreak.history[index].totalInfections > 1) {
                    date = outbreak.history[index].date;
                }
            }

            outbreak.progress = [];

            // updating history progress only for selected countries
            let isCountrySelected = this.state.countriesSelected.indexOf(outbreak.iso) >= 0;
            if (isCountrySelected) {
                for (let i = 0; i <= index; i++) {

                    if (outbreak.history[i][thresholdProp] >= thresholdValue) {
                        let stats = new OutbreakStats();
                        stats.date = outbreak.history[i].date;
                        stats.totalInfections = outbreak.history[i].totalInfections / scale;
                        stats.totalRecoveries = outbreak.history[i].totalRecoveries / scale;
                        stats.totalDeaths = outbreak.history[i].totalDeaths / scale;
                        stats.dailyInfections = outbreak.history[i].dailyInfections / scale;
                        stats.dailyRecoveries = outbreak.history[i].dailyRecoveries / scale;
                        stats.dailyDeaths = outbreak.history[i].dailyDeaths / scale;
                        stats.weeklyInfections = outbreak.history[i].weeklyInfections / scale;
                        stats.weeklyRecoveries = outbreak.history[i].weeklyRecoveries / scale;
                        stats.weeklyDeaths = outbreak.history[i].weeklyDeaths / scale;

                        if (usePropStats) {
                            stats.weeklyDeaths = Math.max(0.11, stats.weeklyDeaths);
                            stats.weeklyInfections = Math.max(0.11, stats.weeklyInfections);
                            stats.weeklyRecoveries = Math.max(0.11, stats.weeklyRecoveries);
                        } else {
                            stats.weeklyDeaths = Math.max(1, stats.weeklyDeaths);
                            stats.weeklyInfections = Math.max(1, stats.weeklyInfections);
                            stats.weeklyRecoveries = Math.max(1, stats.weeklyRecoveries);
                        }
                        outbreak.progress.push(stats);
                    }
                }
            }
        }

        this.setState({
            currentIndex: index,
            currentDate: date,
            countriesStats: this.state.countriesStats
        }, this.refreshAll);
    }

    public updateColumns() {
        if (this.chart) {
            this.chart.updateColumns();
        }
        this.updateRanges(this.state.countriesSelected);
        this.updateData();
    }

    public refreshLists(newItems?: string[]) {
        if (newItems === undefined) {
            newItems = this.state.countriesSelected;
        }

        if (this.listDeaths) {
            this.listDeaths.selectData(newItems);
        }
        if (this.listInfections) {
            this.listInfections.selectData(newItems);
        }
        if (this.listRecoveries) {
            this.listRecoveries.selectData(newItems);
        }
    }

    // updates all visualisations after on call.
    public refreshAll() {
        if (this.chart) {
            this.chart.updateData(this.state.countriesStats, this.state.countriesSelected, this.state.currentDate);
        }

        if (this.listDeaths) {
            this.listDeaths.updateData(this.state.countriesStats, this.state.countriesSelected);
        }
        if (this.listInfections) {
            this.listInfections.updateData(this.state.countriesStats, this.state.countriesSelected);
        }
        if (this.listRecoveries) {
            this.listRecoveries.updateData(this.state.countriesStats, this.state.countriesSelected);
        }
        this.listsUpdating = false;
    }

    // Query that displays the apps current state as a URL on the browser (for testing)
    public parseQuery() {
        let query = this.props.location;
        let parameters = Locations.parse(query);

        let usePropStats = parameters["1m"] !== undefined ? parseBool(parameters["1m"]) : false;
        let logScale = false;
        let showMap = false;
        let showBarGraph = false;
        let showChart = parameters.chart !== undefined ? parseBool(parameters.chart) : true;
        let showLists = parameters.list !== undefined ? parseBool(parameters.list) : true;
        let themeName = parameters.theme !== undefined ? parameters.theme : "dark";

        let xAxisMemberPath = parameters.show !== undefined ? parameters.show : "totalInfections";
        xAxisMemberPath = xAxisMemberPath === "deaths" ? "totalDeaths" : "totalInfections";
        let yAxisMemberPath = xAxisMemberPath === "totalDeaths" ? "weeklyDeaths" : "weeklyInfections";
        let showTotalInfectionList = xAxisMemberPath === "totalInfections";
        let showTotalDeathList = xAxisMemberPath !== "totalInfections";
        let showTotalRecoveryList = false;

        let selection = ["USA", "BRA", "GBR", "NZL", "IND", "CHN"];
        if (parameters.items !== undefined) {
            let items = parameters.items.toString();
            selection = items.split("+");
        }

        this.state = {
            theme: themeName,
            updateInterval: 200,
            updateActive: false,
            updateDate: '',
            dataIndexMin: 0,
            dataIndexMax: 200,
            currentIndex: 0,
            currentDate: "",
            isLoading: true,
            isTourOpen: false,

            frameInfo: "",
            countriesStats: [],
            stackedChartData: [],
            countriesSelected: selection,
            highlighted: [],
            usePropStats: usePropStats,
            showChart: showChart,
            showBarGraph: showBarGraph,
            showMap: showMap,
            showLists: showLists,
            showTotalInfectionList: showTotalInfectionList,
            showTotalDeathList: showTotalDeathList,
            showTotalRecoveries: showTotalRecoveryList,
            showCodes: true,
            showIndex: false,
            width: 0,

            yAxisMemberPath: yAxisMemberPath,
            xAxisMemberPath: xAxisMemberPath,
            xAxisMinimumValue: 1,
            xAxisMaximumValue: 10000000,
            yAxisMinimumValue: 1,
            yAxisMaximumValue: 10000,
            // James
            visualisation: 1
        };
    }
}