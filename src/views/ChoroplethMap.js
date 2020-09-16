import React, { useEffect } from 'react';
import './ChoroplethMap.css';
import L from 'leaflet';
import statesData from './../data/us-states';
// import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import geonet from './../data/custom.geoM.json';

function ChoroplethMap() {
    useEffect(() => {
        // var container = L.DomUtil.get('map');
        // if (container != null) {
        //     container.off();
        //     // container._leaflet_id = null;
        // }
        // document.getElementById('container').innerHTML = "<div id='map' style='width: 100%; height: 100%;'></div>";
        var map = L.map('map', {
            center: [51.505, -0.09],
            minZoom: 2,
            maxZoom: 6,
            maxBounds: [[-90, -180], [90, 180]]
        }).setView([51.505, -0.09], 3);
        console.log(map.getBounds())
        map.on('zoom', () => {
            console.log(map.getZoom());
        })

        L.tileLayer('https://api.mapbox.com/styles/v1/alice2u34982348/ckf1x8bjz608c19obvkq38t9l.html?fresh=true&title=view&access_token=pk.eyJ1IjoiYWxpY2UydTM0OTgyMzQ4IiwiYSI6ImNrZjF4N2E4bTBjdmQyeW1zajlzNW4yczYifQ.4-5ESTVA2rqA_XDTTzyI0A#3.02/41.31/-127.44', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
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

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function (props) {
            this._div.innerHTML = '<h3>Global COVID-19 Density</h3>' + (props ?
                '<b><h4>' + props.name + '</b><br />' + props.density + ' cases</h4>'
                : '<b><b>Hover over a country</b></h4>');
        };

        info.addTo(map);


        // get color depending on population density value
        const getColor = (d) => {
            return d > 300000 ? '#074F9D' :
                    d > 50000 ? '#0863C4' :
                      d > 10000 ? '#0A77EB' :
                        d > 100 ? '#9DCAFB' :
                          '#C4E0FD';
        };

        function style(feature) {
            return {
                weight: 1,
                opacity: 1,
                color: 'white',
                fillOpacity: 1,
                // EDIT
                fillColor: getColor(feature.properties.density)
            };
        }

        function highlightFeature(e) {
            var layer = e.target;

            layer.setStyle({
                weight: 3,
                color: 'rgba(39,103,182, 0.5)',
                fillOpacity: 1
            });

            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }

            info.update(layer.feature.properties);
        }

        var geojson;

        function resetHighlight(e) {
            geojson.resetStyle(e.target);
            info.update();
        }

        function zoomToFeature(e) {
            map.fitBounds(e.target.getBounds());
        }

        function onEachFeature(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }

        geojson = L.geoJson(geonet, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
        // geojson = L.geoJson(statesData, {
        //     style: style,
        //     onEachFeature: onEachFeature
        // }).addTo(map);

        map.attributionControl.addAttribution('Population data &copy; <a href="http://census.gov/">US Census Bureau</a>');

        var legend = L.control({ position: 'bottomright' });

        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 100, 10000, 50000, 300000],
                labels = [],
                from, to;

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

        legend.addTo(map);
        return () => {
            if (map) {
                map.remove("leaflet-container");
                // map.remove(); https://michalzalecki.com/versatility-and-use-cases-of-react-use-effect-hook/
            }
        };
    });

    return (
        <div id="map"></div>
    );
}



export default ChoroplethMap;
