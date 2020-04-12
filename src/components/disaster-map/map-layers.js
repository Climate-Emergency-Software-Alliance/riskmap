//Utility functions for manipulating leaflet map layers

import { inject, noView } from 'aurelia-framework';
import * as L from 'leaflet';
// eslint-disable-next-line no-unused-vars
import markerClusterGroup from 'leaflet.markercluster';
import Chart from 'chart';
import { Config } from 'resources/config';
import { HttpClient } from 'aurelia-http-client';
import * as topojson from 'topojson-client';

//start-aurelia-decorators
@noView
@inject(Config)
//end-aurelia-decorators
export class MapLayers {
  constructor(Config) {
    this.activeReports = {}; // List of available reports (filtered by city, time: last 1 hour)
    this.config = Config.map;
    this.selReportType = null;
    this.mapIcons = {
      report_normal: (type) => L.divIcon({
        iconSize: [30, 30],
        html: '<i class="icon-map-bg bg-circle ' + type + '"><i class="icon-' + type + ' report-icon"></i>'
        //html: '<i class="icon-map-' + type + ' report-icon ' + type + '"></i>'
      }),
      report_normal_with_url: (type) => L.icon({
        iconUrl: 'assets/icons/' + type + '.svg',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      report_selected: (type) => L.divIcon({
        iconSize: [30, 30],
        html: '<i class="icon-map-bg bg-circle ' + type + ' selected"><i class="icon-' + type + ' report-icon"></i>'
      }),
      report_selected_with_url: (type) => L.icon({
        iconUrl: 'assets/icons/' + type + '_select.svg',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      gauge_normal: (url) => L.icon({
        iconUrl: url,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      gauge_selected: L.icon({
        iconUrl: 'assets/icons/floodgauge_selected.svg',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      flood_cluster: (level) => L.divIcon({
        iconSize: [30, 30],
        html: '<i class="icon-map-bg bg-cluster cluster ' + level + '"><i class="icon-map-flood report-cluster">'
      }),
      disaster_cluster: (disaster, level) => L.divIcon({
        iconSize: [30, 30],
        html: '<i class="icon-map-bg bg-cluster cluster ' + level + '"><i class="icon-map-' + disaster + ' report-cluster">'
      })
    };
    this.mapPolygons = {
      normal: {
        weight: 0,
        opacity: 0
      },
      selected: {
        weight: 1,
        opacity: 1
      }
    };
  }

  getReportIcon(disasterType, subType) {
    switch (disasterType) {
    case 'flood':
      return this.mapIcons.report_normal(disasterType);
    case 'prep':
      return this.mapIcons.report_normal(subType);
    case 'earthquake':
      return this.mapIcons.report_normal_with_url(subType);
    case 'haze':
    case 'wind':
    case 'volcano':
    case 'fire':
      return this.mapIcons.report_normal_with_url(disasterType);
    default:
      return this.mapIcons.report_normal(disasterType);
    }
  }
  getSelectedReportIcon(disasterType, subType) {
    switch (disasterType) {
    case 'flood':
      return this.mapIcons.report_selected(disasterType);
    case 'prep':
      return this.mapIcons.report_selected(subType);
    case 'earthquake':
      return this.mapIcons.report_selected_with_url(subType);
    case 'haze':
    case 'wind':
    case 'volcano':
    case 'fire':
      return this.mapIcons.report_selected_with_url(disasterType);
    default:
      return this.mapIcons.report_selected(disasterType);
    }
  }
  

  // Get icon for flood gauge
  gaugeIconUrl(level) {
    switch (level) {
    case 1:
      return 'assets/icons/floodgauge_1.svg';
    case 2:
      return 'assets/icons/floodgauge_2.svg';
    case 3:
      return 'assets/icons/floodgauge_3.svg';
    default:
      return 'assets/icons/floodgauge_4.svg';
    }
  }

  /**
    * Format UTC timestamps to local time for display in local time zone
    * @function {String} UTC timestamp in ISO8601 format
    * @returns {String} timestamp formatted HH:MM DD-MM-YYYY in local time zone
    */
  formatTime(timestamp) {
    //let timeZoneDifference = 7; // UTC offset (e.g. +7 or -5)
    // create date object
    let utc = new Date(timestamp).getTime();
    // convert to local time (millisecond) based on browser timezone
    let localTime = utc + (-60 * new Date().getTimezoneOffset()) * 1000;
    // Make string
    let timestring = new Date(localTime).toISOString(); // ISO string
    // Format string for output
    timestring = timestring.split('T');
    let t1 = timestring[1].slice(0, 5); // Extract HH:MM
    let d1 = timestring[0].split('-'); // Extract DD-MM-YY
    let d2 = d1[2] + '-' + d1[1] + '-' + d1[0]; // Reformat
    return (t1 + ' ' + d2);
  }

  getStats(regionCode) {
    let self = this;
    let client = new HttpClient();
    const url = self.config.data_server +
      'stats/reportsSummary?city=' + regionCode +
      '&timeperiod=' + self.config.report_timeperiod;
    return new Promise((resolve, reject) => {
      client.get(url)
        .then(summary => {
          let reports = JSON.parse(summary.response)['total number of reports'];
          resolve({
            reports: reports,
            timeperiod: self.config.report_timeperiod
          });
        })
        .catch(err => reject(err));
    });
  }

  // Get topojson data from server, return geojson
  getData(endPoint) {
    let self = this;
    let url = self.config.data_server + endPoint;
    let client = new HttpClient();
    return new Promise((resolve, reject) => {
      client.get(url)
        .then(data => {
          let topology = JSON.parse(data.response);
          if (topology.statusCode === 200) {
            let result = topology.result;
            if (result && result.objects) {
              resolve(topojson.feature(result, result.objects.output));
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        })
        .catch(err => reject(err));
    });
  }

  revertIconToNormal(type) {
    let icon = (type === 'flood' || type === null) ? this.getReportIcon(type, null) : this.getReportIcon(this.selReportType, null);
    this.selected_report.target.setIcon(icon);
    this.selected_report = null;
  }

  reportInteraction(feature, layer, cityName, map, togglePane) {
    let self = this;
    self.activeReports[feature.properties.pkey] = layer;
    layer.on({
      click: (e) => {
        map.flyTo(layer._latlng, 15);
        let reportIconNormal = self.getReportIcon(feature.properties.disaster_type, feature.properties.report_data.report_type);
        let reportIconSelected = self.getSelectedReportIcon(feature.properties.disaster_type, feature.properties.report_data.report_type);
        if (self.selected_extent) {
          self.selected_extent.target.setStyle(self.mapPolygons.normal);
          self.selected_extent = null;
        }
        if (self.selected_gauge) {
          self.selected_gauge.target.setIcon(self.mapIcons.gauge_normal(self.gaugeIconUrl(self.selected_gauge.target.feature.properties.observations[self.selected_gauge.target.feature.properties.observations.length - 1].f3)));
          self.selected_gauge = null;
        }
        if (!self.selected_report) {
          // Case 1 : no previous selection, click on report icon
          e.target.setIcon(reportIconSelected);
          self.popupContent = {};
          for (let prop in feature.properties) {
            self.popupContent[prop] = feature.properties[prop];
          }
          self.popupContent.timestamp = self.formatTime(feature.properties.created_at);
          history.pushState({ city: cityName, report_id: feature.properties.pkey }, 'city', 'map/' + cityName + '/' + feature.properties.pkey);
          togglePane('#infoPane', 'show', true);
          self.selected_report = e;
        } else if (e.target === self.selected_report.target) {
          // Case 2 : clicked report icon same as selected report
          e.target.setIcon(reportIconNormal);
          history.pushState({ city: cityName, report_id: null }, 'city', 'map/' + cityName);
          togglePane('#infoPane', 'hide', false);
          self.selected_report = null;
        } else if (e.target !== self.selected_report.target) {
          // Case 3 : clicked new report icon, while previous selection needs to be reset
          self.revertIconToNormal(self.selReportType);
          e.target.setIcon(reportIconSelected);
          self.popupContent = {};
          for (let prop in feature.properties) {
            self.popupContent[prop] = feature.properties[prop];
          }
          self.popupContent.timestamp = self.formatTime(feature.properties.created_at);
          history.pushState({ city: cityName, report_id: feature.properties.pkey }, 'city', 'map/' + cityName + '/' + feature.properties.pkey);
          togglePane('#infoPane', 'show', true);
          self.selected_report = e;
        }
        //Set selReportType value from feature properties
        self.selReportType = 'flood';
        if (feature.properties.report_data) {
          self.selReportType = feature.properties.report_data.report_type;
        }
      }
    });
  }

  floodExtentInteraction(feature, layer, cityName, map, togglePane) {
    let self = this;
    layer.on({
      click: (e) => {
        map.panTo(layer.getCenter());
        // Check for selected report, restore icon to normal, clear variable, update browser URL
        if (self.selected_report) {
          self.revertIconToNormal(self.selReportType);
          history.pushState({ city: cityName, report_id: null }, 'city', 'map/' + cityName);
        }
        if (self.selected_gauge) {
          self.selected_gauge.target.setIcon(self.mapIcons.gauge_normal(self.gaugeIconUrl(self.selected_gauge.target.feature.properties.observations[self.selected_gauge.target.feature.properties.observations.length - 1].f3)));
          self.selected_gauge = null;
        }
        if (!self.selected_extent) {
          // Case 1 : no previous selection, click on flood extent polygon
          // Selection feedback, add stroke
          e.target.setStyle(self.mapPolygons.selected);
          // Reset and fill popupContent
          self.popupContent = {};
          for (let prop in feature.properties) {
            self.popupContent[prop] = feature.properties[prop];
          }
          // open infoPane, set 'clear_selection' var to true, to empty flood gauge chart
          togglePane('#infoPane', 'show', true);
          // set local variable to target
          self.selected_extent = e;
        } else if (e.target === self.selected_extent.target) {
          // Case 2 : clicked polygon same as selected flood extent
          e.target.setStyle(self.mapPolygons.normal);
          self.popupContent = {};
          togglePane('#infoPane', 'hide', false);
          self.selected_extent = null;
        } else if (e.target !== self.selected_extent.target) {
          // Case 3 : clicked new polygon, while previous selection needs to be reset
          self.selected_extent.target.setStyle(self.mapPolygons.normal);
          e.target.setStyle(self.mapPolygons.selected);
          self.popupContent = {};
          for (let prop in feature.properties) {
            self.popupContent[prop] = feature.properties[prop];
          }
          togglePane('#infoPane', 'show', true);
          self.selected_extent = e;
        }
      }
    });
  }

  drawGaugeChart(feature) {
    $('#chart-pane').html('<canvas id="modalChart"></canvas>');
    let ctx = $('#modalChart').get(0).getContext('2d');
    let data = {
      labels: [],
      datasets: [{
        label: 'Tinggi Muka Air / Water Depth (cm)',
        backgroundColor: 'rgba(151,187,205,0.2)',
        borderColor: 'rgba(151,187,205,1)',
        pointBackgroundColor: 'rgba(151,187,205,1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        data: []
      }]
    };
    for (let i = 0; i < feature.properties.observations.length; i += 1) {
      data.labels.push(feature.properties.observations[i].f1);
      data.datasets[0].data.push(feature.properties.observations[i].f2);
    }
    // eslint-disable-next-line no-unused-vars
    let gaugeChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        bezierCurve: true,
        legend: { display: true },
        scaleLabel: "<%= ' ' + value%>",
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              unit: 'hour',
              unitStepSize: 1,
              displayFormats: {
                'millisecond': 'HH:mm',
                'second': 'HH:mm',
                'minute': 'HH:mm',
                'hour': 'HH:mm',
                'day': 'HH:mm',
                'week': 'HH:mm',
                'month': 'HH:mm',
                'quarter': 'HH:mm',
                'year': 'HH:mm'
              }
            }
          }]
        },
        tooltips: {
          enabled: false
        }
      }
    });
  }

  gaugeInteraction(feature, layer, cityName, map, togglePane) {
    let self = this;
    layer.on({
      click: (e) => {
        map.panTo(layer._latlng);
        $('#chart-pane').empty();
        if (self.selected_report) {
          self.revertIconToNormal(self.selReportType);
          history.pushState({ city: cityName, report_id: null }, 'city', 'map/' + cityName);
        }
        if (self.selected_extent) {
          self.selected_extent.target.setStyle(self.mapPolygons.normal);
          self.selected_extent = null;
        }
        if (!self.selected_gauge) {
          e.target.setIcon(self.mapIcons.gauge_selected);
          self.popupContent = {};
          self.popupContent.gauge_name = feature.properties.gaugenameid;
          self.drawGaugeChart(feature);
          togglePane('#infoPane', 'show', false);
          self.selected_gauge = e;
        } else if (e.target === self.selected_gauge.target) {
          e.target.setIcon(self.mapIcons.gauge_normal(self.gaugeIconUrl(e.target.feature.properties.observations[e.target.feature.properties.observations.length - 1].f3)));
          togglePane('#infoPane', 'hide', false);
          self.selected_gauge = null;
        } else if (e.target !== self.selected_gauge.target) {
          self.selected_gauge.target.setIcon(self.mapIcons.gauge_normal(self.gaugeIconUrl(self.selected_gauge.target.feature.properties.observations[self.selected_gauge.target.feature.properties.observations.length - 1].f3)));
          e.target.setIcon(self.mapIcons.gauge_selected);
          self.popupContent = {};
          self.popupContent.gauge_name = feature.properties.gaugenameid;
          self.drawGaugeChart(feature);
          togglePane('#infoPane', 'show', false);
          self.selected_gauge = e;
        }
      }
    });
  }

  appendData(endPoint, localObj, map) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.getData(endPoint)
        .then(data => {
          if (!data) {
            console.log('Could not load map layer');
            resolve(data);
          } else {
            localObj.addData(data);
            localObj.addTo(map);
            resolve(data);
          }
        }).catch(() => reject(null));
    });
  }

  addSingleReport(reportId) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.getData('reports/' + reportId)
        .then(data => {
          self.reports.addData(data);
          resolve(self.activeReports[data.features[0].properties.pkey]);
        }).catch(() => reject(null));
    });
  }

  addReports(cityName, cityRegion, map, togglePane) {
    let self = this;
    map.createPane('reports');
    map.getPane('reports').style.zIndex = 700;
    // clear previous reports
    if (self.reports) {
      map.removeLayer(self.reports);
      self.reports = null;
    }
    let endPoint = 'reports/?city=' + cityRegion + '&timeperiod=' + self.config.report_timeperiod;
    // add layer to map
    // return self.appendData('reports/?city=' + cityRegion + '&timeperiod=' + self.config.report_timeperiod, self.reports, map);
    return this.addReportsClustered(endPoint, cityName, map, togglePane);
  }

  addReportsClustered(endPoint, cityName, map, togglePane) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.getData(endPoint)
        .then(data => {
          if (!data) {
            // console.log('Could not load map layer');
            resolve(data);
          } else {
            this.addCluster(data, cityName, map, togglePane, 'earthquake');
            this.addCluster(data, cityName, map, togglePane, 'flood');
            this.addCluster(data, cityName, map, togglePane, 'fire');
            this.addCluster(data, cityName, map, togglePane, 'haze');
            this.addCluster(data, cityName, map, togglePane, 'volcono');
            this.addCluster(data, cityName, map, togglePane, 'wind');
            resolve(data);
          }
        }).catch(() => reject(null));
    });
  }

  addCluster(data, cityName, map, togglePane, disaster) {
    let self = this;
    console.log(disaster);
    // create new layer object
    self.reports = L.geoJSON(data, {
      filter: function(feature, layer) {
        return feature.properties.disaster_type === disaster;
      },
      onEachFeature: (feature, layer) => {
        self.reportInteraction(feature, layer, cityName, map, togglePane);
      },
      pointToLayer: (feature, latlng) => {
        const disasterType = feature.properties.disaster_type;
        let reportIconNormal = self.getReportIcon(disasterType, feature.properties.report_data.report_type || null);
        return L.marker(latlng, {
          icon: reportIconNormal,
          pane: 'reports'
        });
      }
    });
    let markers = L.markerClusterGroup({ iconCreateFunction: this.iconCreateFunction() });
    markers.addLayer(self.reports);
    markers.addTo(map);
  }

  iconCreateFunction() {
    let self = this;
    return (cluster) => {
      let tooltip = L.tooltip({
        className: 'cluster-count',
        permanent: true,
        direction: 'right',
        offset: [7, 7],
        interactive: true
      }).setContent(cluster.getChildCount().toString());
      cluster.bindTooltip(tooltip);
      // cluster.getAllChildMarkers()[0].feature.properties.report_data['flood_depth']
      let children = cluster.getAllChildMarkers();
      let avgDepth = self.getAverageFloodDepth(children);
      if (avgDepth < 30) {
        return self.mapIcons.disaster_cluster('flood', 'low');
      } else if (avgDepth < 70) {
        return self.mapIcons.disaster_cluster('flood', 'normal');
      } else if (avgDepth < 150) {
        return self.mapIcons.disaster_cluster('flood', 'medium');
      } else if (avgDepth >= 150) {
        return self.mapIcons.disaster_cluster('flood', 'high');
      }
    };
  }

  getAverageFloodDepth(report_markers) {
    let depth = 0;
    report_markers.forEach(function(report, index) {
      const reportData = report.feature.properties.report_data || {'flood_depth': 0};
      depth += reportData['flood_depth'] || 0;
    })
    // for (let report in report_markers) {
    //   depth += report.feature.properties.report_data['flood_depth'];
    // }
    return depth/report_markers.length; 
  }

  addFloodExtents(cityName, cityRegion, map, togglePane) {
    let self = this;
    self.flood_extents = L.geoJSON(null, {
      style: (feature, layer) => {
        switch (feature.properties.state) {
          case 4: return { cursor: 'pointer', fillColor: '#CC2A41', weight: 0, color: '#000000', opacity: 0, fillOpacity: 0.7 };
          case 3: return { cursor: 'pointer', fillColor: '#FF8300', weight: 0, color: '#000000', opacity: 0, fillOpacity: 0.7 };
          case 2: return { cursor: 'pointer', fillColor: '#FFFF00', weight: 0, color: '#000000', opacity: 0, fillOpacity: 0.7 };
          case 1: return { cursor: 'pointer', fillColor: '#A0A9F7', weight: 0, color: '#000000', opacity: 0, fillOpacity: 0.7 };
          default: return { weight: 0, opacity: 0, fillOpacity: 0 };
        }
      },
      onEachFeature: (feature, layer) => {
        self.floodExtentInteraction(feature, layer, cityName, map, togglePane);
      }
    });
    return self.appendData('floods?city=' + cityRegion + '&minimum_state=1', self.flood_extents, map);
  }

  removeFloodExtents(map) {
    let self = this;
    if (self.flood_extents) {
      map.removeLayer(self.flood_extents);
      self.flood_extents = null;
    }
  }

  addFloodGauges(cityName, cityRegion, map, togglePane) {
    let self = this;
    map.createPane('gauges');
    map.getPane('gauges').style.zIndex = 650;
    if (cityRegion === 'ID-JK') {
      // Create flood gauge layer and add to the map
      self.gaugeLayer = L.geoJSON(null, {
        pointToLayer: (feature, latlng) => {
          return L.marker(latlng, {
            icon: self.mapIcons.gauge_normal(self.gaugeIconUrl(feature.properties.observations[feature.properties.observations.length - 1].f3)),
            pane: 'gauges'
          });
        },
        onEachFeature: (feature, layer) => {
          self.gaugeInteraction(feature, layer, cityName, map, togglePane);
        }
      });
    }
    return self.appendData('floodgauges?city=' + cityRegion, self.gaugeLayer, map);
  }

  removeFloodGauges(map) {
    let self = this;
    if (self.gaugeLayer) {
      map.removeLayer(self.gaugeLayer);
      self.gaugeLayer = null;
    }
  }
}
