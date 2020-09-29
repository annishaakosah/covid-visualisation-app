# SWEN422 2020 Assignment 2

 Hello! Welcome to our COVID-19 Dashboard, an information visualization application made with React that allows you to interactively explore the COVID dataset up until this present day. 

**Made with ❤️️ by Nevin Jojo, James Del Puerto, and Annisha Akosah**

## Setup

1. Clone the git repository

```
git clone https://gitlab.ecs.vuw.ac.nz/course-work/swen422/2020/assignment2/t9/covid-visualisation-app.git
```

2. Navigate into the folder

```
cd covid-visualisation-app
```

3. Install dependencies

```
npm install
```

4. Run the application in your browser

```
npm start
```

5. Explore the application at `http://localhost:3000/`

Enjoy!

## Notes about external components

We used the [COVID-19 Data Repository](https://github.com/CSSEGISandData/COVID-19) by the Center for Systems Science and Engineering (CSSE) at Johns Hopkins University as our main data source. 

For the initial tutorial you see when the webpage is first loaded, we used [Reactour](https://reactour.js.org/).

Below is a summary of the frameworks, tools and technologies used in the making of our components

| Component         | Visualisation Aspect                                                                                                                                                                 | Tools, Technologies and Libraries Used                                                                 | Main Person Responsible |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|-------------------------|
| Index Chart       | Total number of COVID-19 cases per country, what country has performed the best and worst, when has the second wave happened for countries, how has COVID-19 cases changed over time | [IgniteUI Charts](https://www.infragistics.com/products/ignite-ui-jquery/charts)                       | Nevin                   |
| Choropleth Map    | Total number of COVID-19 cases per country, what country has performed the best and worst, how has COVID-19 cases changed over time                                                  | [Leaflet](https://leafletjs.com/) , [MapBox](https://www.mapbox.com/), [GeoJSON](https://geojson.org/) | James                   |
| Stacked Bar Chart | What geographical region has performed the best and worst, how has COVID-19 cases changed over time                                                                                  | [Recharts Barchart](https://recharts.org/en-US/api/BarChart)                                           | Annisha                 |


## Demos and Notes About Our Visualisations

### Index Chart
This chart has a lot of moving parts to it. Using the list on the left side, you may toggle countries in or out of view into the respective index chart. 

To view a portion of the index chart, you may drag and select using your mouse, or alternatively, scroll with your mouse to zoom in or out. 

Using the slider below, you can play through a timeline of COVID from the very start (of our dataset, which is around 30 Jan 2020), up until this present day (and it will be up to date when you run this Craig!)

To toggle between views of Infections/Deaths/Recoveries stats, just use the handy tabs at the top.

[![vis1](https://media.giphy.com/media/EugyRuwfaVZRUSpTCC/giphy.gif)]()

### Choropleth Map
To see how each country fares, simply hover over it an you'll get information in the top right corner. 

Same deal as the index chart, you can play through a timeline using the slider, and also switch between stats using the tabs.

[![vis2](https://media.giphy.com/media/sQYURTTBxmF5uKAA4b/giphy.gif)]()

### Stacked Bar Chart
A colourful stacked bar chart, largely inspired by [WHO](https://covid19.who.int/), showing how each geographic region compares. Hover over a given day to get more detailed insights.

As with the other two visualisations, use the tabs to toggle between differents stats. Note: Total Deaths/Cases is a cumulative sum of each day, whilst Daily Deaths/Case shows the stats from that given day.

[![vis3](https://media.giphy.com/media/2KH8lWJeA093HeNCUI/giphy.gif)]()