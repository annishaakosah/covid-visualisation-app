import React, { useEffect } from 'react';
import './../assets/css/ChoroplethMap.css';
import L from 'leaflet';

/**
 * The Choroplet Map renders a map using the Mapbox API and then draws polygons over it using Geojson data
 * which is combined with COVID-19 data. 
 * @param {*} props 
 */
function ChoroplethMap(props) {
    useEffect(() => {
        // Initialises the choropleth map using the mapbox api to render a picture of the world map
        var map = L.map('map', {
            center: [51.505, -0.09],
            minZoom: 2,
            maxZoom: 6,
            maxBounds: [[-90, -180], [90, 180]]
        }).setView([51.505, -0.09], 1);
        L.tileLayer('https://api.mapbox.com/styles/v1/alice2u34982348/ckf1x8bjz608c19obvkq38t9l.html?fresh=true&title=view&access_token=pk.eyJ1IjoiYWxpY2UydTM0OTgyMzQ4IiwiYSI6ImNrZjF4N2E4bTBjdmQyeW1zajlzNW4yczYifQ.4-5ESTVA2rqA_XDTTzyI0A#3.02/41.31/-127.44', {
            id: 'mapbox/dark-v9',
            tileSize: 512,
            zoomOffset: -1,
            noWrap: true,
            bounds: [
                [-90, -180],
                [90, 180]
            ],
            bounceAtZoomLimits: true
        }).addTo(map);


        // control that shows state info on hover
        var info = L.control();

        // Adds the tooltip div onto the map
        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        // Updates the information displayed on the tooltip
        info.update = function (country) {
            this._div.innerHTML = '<h3>Global COVID-19 Density</h3>' + (country ?
                getDisplayIno(country) : '<b><b>Hover over a country</b></h4>');
        };

        // Adding tooltip to the map 
        info.addTo(map);

        /**
         * Returns color depending on population density (d) value of the chosen data variable 
         * which can be totalInfections, totalDeaths and totalRecoveries
         * @param {String} d 
         */
        function getColor(d) {
            if (props.state.xAxisMemberPath === "totalInfections") {
                return d > 300000 ? '#074F9D' :
                    d > 50000 ? '#0863C4' :
                        d > 10000 ? '#0A77EB' :
                            d > 100 ? '#9DCAFB' :
                                '#C4E0FD';
            } else if (props.state.xAxisMemberPath === "totalDeaths") {
                return d > 300000 ? '#B80022' :
                    d > 50000 ? '#F5002D' :
                        d > 10000 ? '#FF3358' :
                            d > 100 ? '#FF859B' :
                                '#FFC2CD';
            } else if (props.state.xAxisMemberPath === "totalRecoveries") {
                return d > 300000 ? '#2C632E' :
                    d > 50000 ? '#3E8E42' :
                        d > 10000 ? '#55B45A' :
                            d > 100 ? '#7FC783' :
                                '#AADAAC';
            }
        };
        /**
         * Returns the COVID-19 data for the chosen data variable which can be totalInfections, 
         * totalDeaths and totalRecoveries. feature is what holds the data.
         * @param {String} feature 
         */
        function getData(feature) {
            if (props.state.xAxisMemberPath === "totalInfections") {
                return feature.properties.totalInfections;
            } else if (props.state.xAxisMemberPath === "totalDeaths") {
                return feature.properties.totalDeaths;
            } else if (props.state.xAxisMemberPath === "totalRecoveries") {
                return feature.properties.totalRecoveries;
            }
        }
        
        /**
         * Returns a stringified HTML code to display in the tooltip div as the it can display different 
         * data variables which are totalInfections, totalDeaths and totalRecoveries.
         * @param {Object} country 
         */
        function getDisplayIno(country) {
            if (props.state.xAxisMemberPath === "totalInfections") {
                return '<b><h4>' + country.name + '</b><br />' + country.totalInfections.toLocaleString() + ' cases</h4>'
            } else if (props.state.xAxisMemberPath === "totalDeaths") {
                return '<b><h4>' + country.name + '</b><br />' + country.totalDeaths.toLocaleString() + ' deaths</h4>'
            } else if (props.state.xAxisMemberPath === "totalRecoveries") {
                return '<b><h4>' + country.name + '</b><br />' + country.totalRecoveries.toLocaleString() + ' recoveries</h4>'
            }
        }

        /**
         * Return the style of the drawn Geojson data (polygons) so they are colored correctly
         * @param {Object} feature 
         */
        function style(feature) {
            return {
                weight: 1,
                opacity: 0.7,
                color: 'white',
                fillOpacity: 1,
                fillColor: getColor(getData(feature))
            };
        }

        /**
         * Hightlights the given country that the mouse is hovering over by styling it.
         * @param {Object} e 
         */
        function highlightFeature(e) {
            var layer = e.target;
            layer.setStyle({
                weight: 3,
                color: 'rgba(39,103,182, 0.5)',
                fillOpacity: 1
            });
            // Brings the given layer to the front 
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }
            // Updates state of the map
            info.update(layer.feature.properties);
        }

        // Variable that will hold the geojson data
        var geojson;

        /**
         * Unhighlights the given country that the mouse leaves by reseting its style to the original.
         * @param {Object} e 
         */
        function resetHighlight(e) {
            geojson.resetStyle(e.target);
            info.update();
        }

        /**
         * Zooms into a country when a user click on one.
         * @param {Object} e 
         */
        function zoomToFeature(e) {
            map.fitBounds(e.target.getBounds());
        }

        /**
         * This handles the mouse events (i.e. mouseover, mouseout and click) by calling the corresponding methods
         * that changes the state of the choropleth map
         * @param {Object} feature 
         * @param {Object} layer 
         */
        function onEachFeature(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }

        // processes the Geojson data and combines it with the map. Note that the data also contain COVID-19 data
        geojson = L.geoJson(props.data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

        // Adds the legend on the map which is positioned on the bottom right of the screen
        var legend = L.control({ position: 'bottomright' });

        /**
         * Adds the data information on the legend to display depending on the select data variable which can be
         * totalInfections, totalDeaths and totalRecoveries.
         * @param {*} map 
         */
        legend.onAdd = function (map) {
            // Creates div for legend
            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 100, 10000, 50000, 300000],
                labels = [],
                from, to;
            // For loop adding the color information
            for (var i = 0; i < grades.length; i++) {
                from = grades[i];
                to = grades[i + 1];

                labels.push(
                    '<i style="background:' + getColor(from + 1) + '"></i> ' +
                    from + (to ? '&ndash;' + to : '+'));
            }
            div.innerHTML = labels.join('<br>');
            return div;
        };

        // Adds the legend to the map
        legend.addTo(map);
        return () => {
            if (map) {
                map.remove("leaflet-container");
            }
        };
    });

    return (
        <div id="map"></div>
    );
}



export default ChoroplethMap;
