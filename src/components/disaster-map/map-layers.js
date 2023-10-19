//Utility functions for manipulating leaflet map layers

import { inject, noView } from "aurelia-framework";
import * as L from "leaflet";
// eslint-disable-next-line no-unused-vars
import Chart from "chart";
import { Config } from "resources/config";
import { HttpClient } from "aurelia-http-client";
import * as topojson from "topojson-client";
import { Promise, reject } from "bluebird";
import { PointsService } from "../report-info/points-service";

//start-aurelia-decorators
@noView
@inject(Config, PointsService)
//end-aurelia-decorators
export class MapLayers {
    constructor(Config, PointsService) {
        this.activeReports = {}; // List of available reports (filtered by city, time: last 1 hour)
        this.queriedReports = {};
        this.service = PointsService;
        this.config = Config.map;
        this.selReportType = null;
        this.popupContainer = null;
        this.fireMarkers = null;
        this.fireMarker = {};
        this.fireCircle = {};
        this.fireSingleFeature = {};
        this.VolcanoEruptionLevelsMap = ["3", "4"];
        this.disasterMap = [
            {
                disaster: "flood",
                levels: ["normal", "medium", "high"]
            },
            {
                disaster: "haze",
                levels: ["low", "normal", "high"]
            },
            {
                disaster: "wind",
                levels: ["normal", "medium", "high"]
            },
            {
                disaster: "volcano",
                levels: ["low"]
            },
            {
                disaster: "structure",
                levels: ["low", "medium", "high"]
            },
            {
                disaster: "road",
                levels: ["low", "normal", "medium", "high"]
            }
        ];
        this.mapIcons = {
            report_normal: (type, level, isPartnerCode) =>
                L.divIcon({
                    iconSize: [30, 30],
                    html: `<img src=${this.fetchIcon(type, level, isPartnerCode)} />`
                    //html: '<i class="icon-map-' + type + ' report-icon ' + type + '"></i>'
                }),
            report_normal_with_url: (type, level, isPartnerCode) =>
                L.icon({
                    iconUrl: this.fetchIcon(type, level, isPartnerCode),
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                }),
            report_selected: type =>
                L.divIcon({
                    iconSize: [30, 30],
                    html: '<i class="icon-map-bg bg-circle ' + type + ' selected"><i class="icon-' + type + ' report-icon"></i>'
                }),
            report_selected_with_url: (type, level, isPartnerCode) =>
                L.icon({
                    iconUrl: this.fetchIcon(type, level, isPartnerCode, true),
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                }),
            gauge_normal: url =>
                L.icon({
                    iconUrl: url,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                }),
            gauge_selected: L.icon({
                iconUrl: "assets/icons/floodgauge_selected.svg",
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }),
            flood_cluster: level =>
                L.divIcon({
                    iconSize: [30, 30],
                    html: '<i class="icon-map-bg bg-cluster cluster ' + level + '"><i class="icon-map-flood report-cluster">'
                }),
            disaster_cluster: (disaster, level, isPartnerCode) =>
                L.divIcon({
                    iconSize: [35, 35],
                    html: `<img src=${this.fetchClusterIcon(disaster, level, isPartnerCode)} />`
                }),
            disaster_cluster_with_url: (disaster, level, isPartnerCode) =>
                L.icon({
                    iconUrl: this.fetchClusterIcon(disaster, level, isPartnerCode),
                    iconSize: [35, 35],
                    iconAnchor: [15, 15],
                    className: "report-cluster " + level
                })
            // disaster_cluster_partner_icon: () =>
            //   L.divIcon({
            //     iconSize: [35, 35],
            //     html: `<img src="assets/icons/partner_icon.svg" />`,
            //   }),
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

    fetchIcon = (type, level, isPartnerIcon, isSelected = false) => {
        if (isPartnerIcon) {
            return isSelected
                ? `assets/icons/onselect/${type}_partnericon_${level}_select.svg`
                : `assets/icons/${type}_partnericon_${level}.svg`;
        }
        return isSelected ? `assets/icons/onselect/${type}_${level}_select.svg` : `assets/icons/${type}_${level}.svg`;
    };

    fetchClusterIcon = type => {
        return `assets/icons/${type}_cluster.svg`;
    };

    getDisasterClusterIcon(disasterType, subType, level, isPartnerCode) {
        switch (disasterType) {
            case "flood":
                return this.mapIcons.disaster_cluster(disasterType, level, isPartnerCode);
            case "earthquake":
                return this.mapIcons.disaster_cluster_with_url(subType, level, isPartnerCode);
            case "haze":
            case "wind":
            case "volcano":
            case "fire":
                return this.mapIcons.disaster_cluster_with_url(disasterType, level, isPartnerCode);
            case "partner":
                return this.mapIcons.disaster_cluster_partner_icon();
            default:
                return this.mapIcons.disaster_cluster(disasterType, level);
        }
    }

    getReportIcon(feature) {
        let disasterType = feature.properties.disaster_type;
        let isPartnerCode = !!feature.properties.partner_code;

        let level = "low";
        switch (disasterType) {
            case "flood":
                level = this.getDisasterSevearity(feature);
                return this.mapIcons.report_normal_with_url(disasterType, level, isPartnerCode);
            case "prep":
                let subType = feature.properties.report_data.report_type;
                return this.mapIcons.report_normal(subType, level);
            case "earthquake":
                let eqSubType = feature.properties.report_data.report_type;
                level = this.getDisasterSevearity(feature);
                return this.mapIcons.report_normal_with_url(eqSubType, level, isPartnerCode);
            case "haze":
            case "wind":
            case "volcano":
            case "fire":
                level = this.getDisasterSevearity(feature);
                return this.mapIcons.report_normal_with_url(disasterType, level, isPartnerCode);
            default:
                return this.mapIcons.report_normal(disasterType, level, isPartnerCode);
        }
    }
    getSelectedReportIcon(feature) {
        let disasterType = feature.properties.disaster_type;
        let isPartnerCode = !!feature.properties.partner_code;
        const reportData = feature.properties.report_data || {
            report_type: disasterType
        };
        let subType = reportData.report_type || disasterType;
        let level = "low";
        switch (disasterType) {
            case "flood":
                level = this.getDisasterSevearity(feature);
                return this.mapIcons.report_selected_with_url(disasterType, level, isPartnerCode);
            case "prep":
                return this.mapIcons.report_selected_with_url(subType, level, isPartnerCode);
            case "earthquake":
                level = this.getDisasterSevearity(feature);
                return this.mapIcons.report_selected_with_url(subType, level, isPartnerCode);
            case "haze":
            case "wind":
            case "volcano":
            case "fire":
                level = this.getDisasterSevearity(feature);
                return this.mapIcons.report_selected_with_url(disasterType, level, isPartnerCode);
            default:
                return this.mapIcons.report_selected_with_url(disasterType, level, isPartnerCode);
        }
    }

    // Get icon for flood gauge
    gaugeIconUrl(level) {
        switch (level) {
            case 1:
                return "assets/icons/floodgauge_1.svg";
            case 2:
                return "assets/icons/floodgauge_2.svg";
            case 3:
                return "assets/icons/floodgauge_3.svg";
            default:
                return "assets/icons/floodgauge_4.svg";
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
        let localTime = utc + -60 * new Date().getTimezoneOffset() * 1000;
        // Make string
        let timestring = new Date(localTime).toISOString(); // ISO string
        // Format string for output
        timestring = timestring.split("T");
        let t1 = timestring[1].slice(0, 5); // Extract HH:MM
        let d1 = timestring[0].split("-"); // Extract DD-MM-YY
        let d2 = d1[2] + "-" + d1[1] + "-" + d1[0]; // Reformat
        return t1 + " " + d2;
    }

    getStats(regionCode) {
        let self = this;
        let client = new HttpClient();
        const url = self.config.data_server + "stats/reportsSummary?city=" + regionCode;
        // + '&timeperiod=' + self.config.report_timeperiod;
        return new Promise((resolve, reject) => {
            client
                .get(url)
                .then(summary => {
                    let reports = JSON.parse(summary.response)["total number of reports"];
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
            client
                .get(url)
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

    revertIconToNormal(feature) {
        let icon = this.getReportIcon(feature);
        if (feature.properties.disaster_type == "fire" && !this.fireMarker)
            // this.selected_report.target.setStyle({ "className": "fire-distance" })
            this.selected_report.target.setStyle({ fillOpacity: 0.25 });
        else {
            this.selected_report.target.setIcon(icon);
            this.selected_report = null;
        }
    }

    isMobileDevice() {
        return window.matchMedia("only screen and (max-width: 768px)").matches;
    }

    markerClickHandler(e, feature, cityName, map, togglePane) {
        var self = this;
        map.panTo(e.latlng, 5);
        const isPartner = !!feature.properties.partner_code;
        // let reportIconNormal = self.getReportIcon(feature);
        // let reportIconSelected = self.getSelectedReportIcon(feature);
        if (self.selected_extent) {
            self.selected_extent.target.setStyle(self.mapPolygons.normal);
            self.selected_extent = null;
        }
        if (self.selected_gauge) {
            self.selected_gauge.target.setIcon(
                self.mapIcons.gauge_normal(
                    self.gaugeIconUrl(
                        self.selected_gauge.target.feature.properties.observations[
                            self.selected_gauge.target.feature.properties.observations.length - 1
                        ].f3
                    )
                )
            );
            self.selected_gauge = null;
        }
        if (!self.selected_report) {
            // Case 1 : no previous selection, click on report icon
            if (
                feature.properties.disaster_type == "fire" &&
                !this.fireCircle[feature.properties.pkey] &&
                (this.fireSingleFeature.hasOwnProperty("false") || this.fireSingleFeature.hasOwnProperty("true"))
            ) {
                if (this.fireMarker[feature.properties.pkey]) this.fireMarker[feature.properties.pkey].remove(map);
                const sevearity = self.getAvgDisasterSevearity("fire", "fire", [feature]);
                const icon = self.fetchIcon("fire", sevearity, isPartner, true);
                this.svgPathToImage(icon, 800).then(image => {
                    !map.hasImage("fire-selected-icon" + isPartner) && map.addImage("fire-selected-icon" + isPartner, image);
                    map.addLayer({
                        id: "fire-selected-icon" + isPartner,
                        type: "symbol",
                        source: `fire-${isPartner}`,
                        filter: ["all", ["==", "disasterLevel", "high"], ["==", "clicked", true]],
                        layout: {
                            "icon-image": "fire-selected-icon" + isPartner,
                            "icon-size": 0.05,
                            "text-allow-overlap": true,
                            "text-ignore-placement": true,
                            "icon-allow-overlap": true,
                            "icon-ignore-placement": true
                        }
                    });
                });
                // {e.target.setStyle({"className": "fire-distance-selected"}); e.target._updatePath()}
            } else if (
                feature.properties.disaster_type == "fire" &&
                !this.fireMarker[feature.properties.pkey] &&
                (this.fireSingleFeature.hasOwnProperty("false") || this.fireSingleFeature.hasOwnProperty("true"))
            ) {
                map.addLayer({
                    id: `circle-fire-${isPartner}-layer-selected`,
                    type: "circle",
                    source: `fire-${isPartner}`,
                    paint: {
                        "circle-radius": ["get", "fireDistance"],
                        "circle-opacity": 0.3,
                        "circle-color": "#223b53"
                    },
                    filter: ["all", ["==", "$type", "Point"], ["==", "disaster_type", "fire"], ["==", "clicked", true]]
                });
                map.on("click", `circle-fire-${isPartner}-layer-selected`, function (e) {
                    self.mapClickHandler(e, map, `circle-fire-${isPartner}-layer-selected`, `fire-${isPartner}`, togglePane, cityName);
                });
            }
            // else e.target.setIcon(reportIconSelected);
            self.popupContent = {};
            for (let prop in feature.properties) {
                self.popupContent[prop] = feature.properties[prop];
            }
            self.popupContent.sevearity = self.getDisasterSevearity(feature);
            self.popupContent.timestamp = self.formatTime(feature.properties.created_at);
            history.pushState(
                { city: cityName, report_id: feature.properties.pkey },
                "city",
                "map/" + cityName + "/" + feature.properties.pkey
            );
            if (self.isMobileDevice()) {
                togglePane("#infoPane", "show", true);
            } else {
                const coordinates = feature.geometry.coordinates.slice();
                togglePane("#infoPane", "hide", false);
                self.popupContainer = self.setPopup(coordinates, feature, map, isPartner);
            }
            self.selected_report = e;
        } else if (e.target === self.selected_report.target) {
            // Case 2 : clicked report icon same as selected report
            // console.log("Coming herre tooo" , map.getLayer("fire-selected-icon" + isPartner))
            // if (
            //     feature.properties.disaster_type == "fire" &&
            //     !this.fireCircle[feature.properties.pkey] &&
            //     (this.fireSingleFeature.hasOwnProperty("false") || this.fireSingleFeature.hasOwnProperty("true"))
            // ) {
            //     self.addFireMarker(feature, map, isPartner);
            //     map.removeLayer("fire-selected-icon" + isPartner);
            //     // e.target.setStyle ({ "className": "fire-distance" })
            //     // e.target.setStyle({ fillOpacity: 0.25 });
            // } else if (
            //     feature.properties.disaster_type == "fire" &&
            //     !this.fireMarker[feature.properties.pkey] &&
            //     (this.fireSingleFeature.hasOwnProperty("false") || this.fireSingleFeature.hasOwnProperty("true"))
            // ) {
            //     map.removeLayer(`circle-fire-${isPartner}-layer-selected`);
            //     self.addFireCircleLayer(map, `fire-${isPartner}`);
            // }
            // else e.target.setIc`on(reportIconNormal);
            history.pushState({ city: cityName, report_id: null }, "city", "map/" + cityName);
            if (self.isMobileDevice()) {
                togglePane("#infoPane", "hide", false);
            }
            self.selected_report = null;
        } else if (e.target !== self.selected_report.target) {
            // Case 3 : clicked new report icon, while previous selection needs to be reset
            if (feature.properties.disaster_type == "fire" && !this.fireMarker) {
            }
            // this.selected_report.target.setStyle({ "className": "fire-distance" })
            // this.selected_report.target.setStyle({ fillOpacity: 0.25 });
            if (feature.properties.disaster_type == "fire" && !self.fireMarker[feature.properties.pkey])
                // e.target.setStyle({ "className": "fire-distance-selected" })
                // e.target.setStyle({ fillOpacity: 0.5 });
                self.addFireCircleLayer(map, `fire-${isPartner}`);
            // else e.target.setIcon(reportIconSelected);
            self.popupContent = {};
            for (let prop in feature.properties) {
                self.popupContent[prop] = feature.properties[prop];
            }
            self.popupContent.sevearity = self.getDisasterSevearity(feature);
            self.popupContent.timestamp = self.formatTime(feature.properties.created_at);
            const coordinates = feature.geometry.coordinates.slice();
            if (self.isMobileDevice()) {
                togglePane("#infoPane", "show", true);
            } else {
                self.popupContainer = self.setPopup(coordinates, feature, map, isPartner);
                togglePane("#infoPane", "hide", false);
            }
            self.selected_report = e;
            history.pushState(
                { city: cityName, report_id: feature.properties.pkey },
                "city",
                "map/" + cityName + "/" + feature.properties.pkey
            );
        }
        //Set selReportType value from feature properties
        self.selReportType = "flood";
        if (feature.properties.report_data) {
            self.selReportType = feature.properties.report_data.report_type;
        }
    }

    setPopup(coordinates, feature, map, isPartner) {
        const div = document.createElement("div");
        let getReportInfoElement;
        let shareButton;
        let flagButton;
        let upvoteButton;
        let downvoteButton;
        let self = this;
        //* Timeout is set to wait for the DOM to load
        setTimeout(() => {
            getReportInfoElement = document.getElementsByClassName("infoWrapper");
            div.innerHTML = getReportInfoElement[1].innerHTML;
            shareButton = document.getElementById("shareButtonsshare");
            flagButton = document.getElementById("shareButtonsflag");
            upvoteButton = document.getElementById("upVoteButton");
            downvoteButton = document.getElementById("downVoteButton");
            upvoteButton.addEventListener("click", function () {
                self.voteHandler(1);
            });
            downvoteButton.addEventListener("click", function () {
                self.voteHandler(-1);
            });
            shareButton.addEventListener("click", function () {
                self.feedbackInteraction("share");
            });
            flagButton.addEventListener("click", function () {
                self.feedbackInteraction("flag");
            });
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
        }, 1000);
        const popupContainer = new mapboxgl.Popup({ closeButton: false })
            .setLngLat(coordinates)
            .setDOMContent(div)
            .addTo(map)
            .setMaxWidth("400px")
            .setOffset(20);
        popupContainer.on("close", () => {
                // feature.properties.clicked = false;
                if(feature.properties.disaster_type === "fire") {
                    if (map.getLayer("fire-selected-icon" + isPartner)) {
                        map.removeLayer("fire-selected-icon" + isPartner);
                    }
                    self.addFireMarker(feature, map, isPartner);
                }
        });

        return popupContainer;
    }

    voteHandler(vote) {
        const self = this;
        // Trigger getter to update disabled status
        self.popupContent.voteChanged = true;
        const reportId = self.popupContent.pkey;
        self.service.updatePoints(reportId, vote).then(points => {
            if (vote > 0) {
                // Upvote
                if (localStorage.getItem("id_" + reportId)) {
                    if (localStorage.getItem("id_" + reportId) === "down") {
                        // Case 1: already downvoted
                        localStorage.setItem("id_" + reportId, "none");
                    } else {
                        // Case 2: not downvoted
                        localStorage.setItem("id_" + reportId, "up");
                    }
                } else {
                    // Case 3: never voted for this report id
                    localStorage.setItem("id_" + reportId, "up");
                }

                // Trigger getter to update disabled status
                self.popupContent.voteChanged = true;
            } else {
                // Downvote
                if (localStorage.getItem("id_" + reportId)) {
                    if (localStorage.getItem("id_" + reportId) === "up") {
                        // Case 1: already upvoted
                        localStorage.setItem("id_" + reportId, "none");
                    } else {
                        // Case 2: not upvoted
                        localStorage.setItem("id_" + reportId, "down");
                    }
                } else {
                    // Case 3: never voted for this report id
                    localStorage.setItem("id_" + reportId, "down");
                }
            }
        });

        // Set voteChanged back to false to enable trigger on next button click
        self.popupContent.voteChanged = false;
    }

    feedbackInteraction(button) {
        if ($("#shareButtons" + button).hasClass("highlight")) {
            // if clicked button active
            // remove highlight class from all .shareButtons
            $(".shareButtons").removeClass("highlight");
            // hide all .interactionFlyer
            $(".interactionFlyer").hide();
        } else {
            // if selected button inactive
            // remove highlight class from all .shareButtons
            $(".shareButtons").removeClass("highlight");
            // add highlight class to clicked button
            $("#shareButtons" + button).addClass("highlight");
            // hide all .interactionFlyer
            $(".interactionFlyer").hide();
            // show selected interactionFlyer
            $("#" + button + "Flyer").show();
        }
    }

    reportInteraction(feature, layer, cityName, map, togglePane) {
        let self = this;
        self.activeReports[feature.properties.pkey] = layer;
        layer.on({
            click: e => {
                this.markerClickHandler(e, feature, cityName, map, togglePane);
            }
        });
    }

    floodExtentInteraction(e, feature, cityName, map, togglePane) {
        let self = this;
        e.clickOnLayer = !e.clickOnLayer;
        // Check for selected report, restore icon to normal, clear variable, update browser URL
        if (self.selected_report) {
            self.revertIconToNormal(self.selected_report.target.feature);
            history.pushState({ city: cityName, report_id: null }, "city", "map/" + cityName);
        }
        if (self.selected_gauge) {
            self.selected_gauge.target.setIcon(
                self.mapIcons.gauge_normal(
                    self.gaugeIconUrl(
                        self.selected_gauge.target.feature.properties.observations[
                            self.selected_gauge.target.feature.properties.observations.length - 1
                        ].f3
                    )
                )
            );
            self.selected_gauge = null;
        }
        if (!self.selected_extent) {
            // Case 1 : no previous selection, click on disaster extent polygon
            // Selection feedback, add stroke
            e.target.setStyle(self.mapPolygons.selected);
            // Reset and fill popupContent
            self.popupContent = {};
            for (let prop in feature.properties) {
                self.popupContent[prop] = feature.properties[prop];
            }
            // open infoPane, set 'clear_selection' var to true, to empty flood gauge chart
            togglePane("#infoPane", "show", true);
            // set local variable to target
            self.selected_extent = e;
        } else if (e.target === self.selected_extent.target) {
            // Case 2 : clicked polygon same as selected flood extent
            e.target.setStyle(self.mapPolygons.normal);
            self.popupContent = {};
            togglePane("#infoPane", "hide", false);
            self.selected_extent = null;
        } else if (e.target !== self.selected_extent.target) {
            // Case 3 : clicked new polygon, while previous selection needs to be reset
            self.selected_extent.target.setStyle(self.mapPolygons.normal);
            e.target.setStyle(self.mapPolygons.selected);
            self.popupContent = {};
            for (let prop in feature.properties) {
                self.popupContent[prop] = feature.properties[prop];
            }
            togglePane("#infoPane", "show", true);
            self.selected_extent = e;
        }
    }

    drawGaugeChart(feature) {
        $("#chart-pane").html('<canvas id="modalChart"></canvas>');
        let ctx = $("#modalChart").get(0).getContext("2d");
        let data = {
            labels: [],
            datasets: [
                {
                    label: "Tinggi Muka Air / Water Depth (cm)",
                    backgroundColor: "rgba(151,187,205,0.2)",
                    borderColor: "rgba(151,187,205,1)",
                    pointBackgroundColor: "rgba(151,187,205,1)",
                    pointBorderColor: "#fff",
                    pointRadius: 4,
                    data: []
                }
            ]
        };
        for (let i = 0; i < feature.properties.observations.length; i += 1) {
            data.labels.push(feature.properties.observations[i].f1);
            data.datasets[0].data.push(feature.properties.observations[i].f2);
        }
        // eslint-disable-next-line no-unused-vars
        let gaugeChart = new Chart(ctx, {
            type: "line",
            data: data,
            options: {
                bezierCurve: true,
                legend: { display: true },
                scaleLabel: "<%= ' ' + value%>",
                scales: {
                    xAxes: [
                        {
                            type: "time",
                            time: {
                                unit: "hour",
                                unitStepSize: 1,
                                displayFormats: {
                                    millisecond: "HH:mm",
                                    second: "HH:mm",
                                    minute: "HH:mm",
                                    hour: "HH:mm",
                                    day: "HH:mm",
                                    week: "HH:mm",
                                    month: "HH:mm",
                                    quarter: "HH:mm",
                                    year: "HH:mm"
                                }
                            }
                        }
                    ]
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
            click: e => {
                map.panTo(layer._latlng);
                $("#chart-pane").empty();
                if (self.selected_report) {
                    self.revertIconToNormal(self.selected_report.target.feature);
                    history.pushState({ city: cityName, report_id: null }, "city", "map/" + cityName);
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
                    togglePane("#infoPane", "show", false);
                    self.selected_gauge = e;
                } else if (e.target === self.selected_gauge.target) {
                    e.target.setIcon(
                        self.mapIcons.gauge_normal(
                            self.gaugeIconUrl(
                                e.target.feature.properties.observations[e.target.feature.properties.observations.length - 1].f3
                            )
                        )
                    );
                    togglePane("#infoPane", "hide", false);
                    self.selected_gauge = null;
                } else if (e.target !== self.selected_gauge.target) {
                    self.selected_gauge.target.setIcon(
                        self.mapIcons.gauge_normal(
                            self.gaugeIconUrl(
                                self.selected_gauge.target.feature.properties.observations[
                                    self.selected_gauge.target.feature.properties.observations.length - 1
                                ].f3
                            )
                        )
                    );
                    e.target.setIcon(self.mapIcons.gauge_selected);
                    self.popupContent = {};
                    self.popupContent.gauge_name = feature.properties.gaugenameid;
                    self.drawGaugeChart(feature);
                    togglePane("#infoPane", "show", false);
                    self.selected_gauge = e;
                }
            }
        });
    }

    appendData(endPoint, map) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.getData(endPoint)
                .then(data => {
                    if (!data) {
                        console.log("Could not load map layer");
                        resolve(data);
                    } else {
                        // localObj.addData(data);
                        // localObj.addTo(map);
                        resolve(data);
                    }
                })
                .catch(() => reject(null));
        });
    }

    addSingleReport(reportId) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.getData("reports/" + reportId)
                .then(data => {
                    self.reports.addData(data);
                    resolve(self.activeReports[data.features[0].properties.pkey]);
                })
                .catch(() => reject(null));
        });
    }

    addReports(cityName, cityRegion, map, togglePane) {
        let self = this;
        // map.addLayer('reports');
        // map.createPane("reports");
        // map.getPane("reports").style.zIndex = 700;
        // clear previous reports
        if (self.reports) {
            // map.removeLayer(self.reports);
            self.reports = null;
        }
        let endPoint = `reports/?admin=${cityRegion}&training=${self.config.environment === "training"}`;
        // add layer to map
        // return self.appendData('reports/?admin=' + cityRegion + '&timeperiod=' + self.config.report_timeperiod, self.reports, map);
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
                        let partnerFireEntries = data.features.filter(function (entry, index) {
                            return entry.properties.disaster_type === "fire" && entry.properties.partner_code != null;
                        });
                        let fireEntries = data.features.filter(function (entry, index) {
                            return entry.properties.disaster_type === "fire" && entry.properties.partner_code === null;
                        });
                        this.map = map;
                        data = this.addDisasterLevelsToData(data);
                        this.addDisasterIconLayers(map);
                        this.addCluster(data, cityName, map, togglePane, "haze", null, false);
                        this.addCluster(data, cityName, map, togglePane, "haze", null, true);
                        this.addCluster(data, cityName, map, togglePane, "flood", null, false);
                        this.addCluster(data, cityName, map, togglePane, "flood", null, true);
                        this.addCluster(data, cityName, map, togglePane, "volcano", null, false);
                        this.addCluster(data, cityName, map, togglePane, "volcano", null, true);
                        this.addCluster(data, cityName, map, togglePane, "wind", null, false);
                        this.addCluster(data, cityName, map, togglePane, "wind", null, true);
                        this.addCluster(data, cityName, map, togglePane, "earthquake", "structure", false);
                        this.addCluster(data, cityName, map, togglePane, "earthquake", "structure", true);
                        this.addCluster(data, cityName, map, togglePane, "earthquake", "road", false);
                        this.addCluster(data, cityName, map, togglePane, "earthquake", "road", true);
                        this.addFireEntryCluster(data, cityName, map, togglePane, fireEntries, false);
                        this.addFireEntryCluster(data, cityName, map, togglePane, partnerFireEntries, true);
                        resolve(data);
                    }
                    if (this.fireSingleFeature.hasOwnProperty("false") || this.fireSingleFeature.hasOwnProperty("true")) {
                        const fireFeature = this.fireSingleFeature;
                        map.on("zoomend", function (e) {
                            self.updateFireSingleMarker(fireFeature[false.toString()], map, cityName, togglePane, false);
                            self.updateFireSingleMarker(fireFeature[true.toString()], map, cityName, togglePane, true);
                        });
                    }
                })
                .catch(err => reject(err));
        });
    }

    svgPathToImage = (image_name, dimensions = 900) =>
        new Promise(resolve => {
            const image = new Image(dimensions, dimensions);
            image.addEventListener("load", () => resolve(image));
            image.src = image_name;
        });

    addIconLayer(map, image_name, layer_id, source, filter, icon_size) {
        let image_code = image_name.split("/").slice(-1)[0].split(".")[0];
        this.svgPathToImage(image_name).then(image => {
            map.addImage(image_code, image);
            map.addLayer({
                id: layer_id,
                type: "symbol",
                source: source,
                filter: filter,
                layout: {
                    "icon-image": image_code,
                    "icon-size": icon_size,
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                    "icon-allow-overlap": true,
                    "icon-ignore-placement": true
                }
            });
        });
    }

    addDisasterIconLayers(map) {
        let iconMap = {};
        let self = this;
        this.disasterMap.map(item => {
            iconMap[item.disaster] = item.levels.map(level => ({
                icon: self.fetchIcon(item.hasOwnProperty("type") ? item.type : item.disaster, level, false),
                filter: ["all", ["==", "disasterLevel", level], ["==", "clicked", false]],
                isPartner: false,
                size: 0.05,
                level: level
            }));
            if (iconMap.hasOwnProperty(item.disaster)) {
                let clickedPropertyObject = item.levels.map(level =>
                    // When the icon is clicked
                    ({
                        icon: self.fetchIcon(item.disaster, level, false, true),
                        filter: ["all", ["==", "disasterLevel", level], ["==", "clicked", true]],
                        isPartner: false,
                        size: 0.05,
                        level: `${level}_selected`
                    })
                );
                let isPartnerPropertyObject = item.levels.map(level =>
                    // When it is a partner icon
                    ({
                        icon: self.fetchIcon(item.disaster, level, true),
                        filter: ["all", ["==", "disasterLevel", level], ["==", "clicked", false]],
                        size: 0.05,
                        isPartner: true,
                        level: `${level}_partner`
                    })
                );
                let isPartnerClickedPropertyObject = item.levels.map(level =>
                    // When partner icon is clicked
                    ({
                        icon: self.fetchIcon(item.disaster, level, true, true),
                        filter: ["all", ["==", "disasterLevel", level], ["==", "clicked", true]],
                        size: 0.05,
                        isPartner: true,
                        level: `${level}_partner_selected`
                    })
                );
                iconMap[item.disaster] = [
                    ...iconMap[item.disaster],
                    ...clickedPropertyObject,
                    ...isPartnerPropertyObject,
                    ...isPartnerClickedPropertyObject
                ];
            }
        });
        Object.keys(iconMap).forEach(function (disaster) {
            iconMap[disaster].forEach(function (icon) {
                self.addIconLayer(map, icon.icon, disaster + "_" + icon.level, `${disaster}-${icon.isPartner}`, icon.filter, icon.size);
            });
        });
    }

    addFireCircleLayer(map, sourceCode) {
        map.addLayer({
            id: `circle-${sourceCode}-layer`,
            type: "circle",
            source: sourceCode,
            paint: {
                "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    10,
                    ["/", 50, ["get", "fireDistance"]],
                    15,
                    ["get", "fireDistance"],
                    18,
                    ["get", "fireDistance"]
                ],
                "circle-opacity": 0.3,
                "circle-color": "#B42222"
            },
            filter: ["all", ["==", "$type", "Point"], ["==", "disaster_type", "fire"]]
        });
    }

    mapClickHandler(e, map, layer_id, sourceCode, togglePane, cityName) {
        const self = this;
        const features = map.queryRenderedFeatures(e.point, {
            layers: [layer_id]
        });
        self.queriedReports[sourceCode].features.forEach(function (feature, index) {
            if (feature.properties.url === features[0].properties.url) {
                self.queriedReports[sourceCode].features[index].properties.clicked =
                    !self.queriedReports[sourceCode].features[index].properties.clicked;
                map.getSource(sourceCode).setData(self.queriedReports[sourceCode]);
            }
        });
        const feature = self.queriedReports[sourceCode].features.filter(feature => {
            return feature.properties.url === features[0].properties.url;
        });
        self.markerClickHandler(e, feature[0], cityName, map, togglePane);
    }

    updateFireSingleMarker(feature, map, cityName, togglePane, isPartner) {
        let self = this;
        let currentZoom = map.getZoom();
        console.log("🚀 ~ file: map-layers.js:951 ~ MapLayers ~ updateFireSingleMarker ~ currentZoom:", currentZoom);
        if (!feature) return;
        let fireMarker = this.fireMarker[feature.properties.pkey];
        let fireCircle = this.fireCircle[feature.properties.pkey];
        const sourceCode = `fire-${isPartner}`;
        if (currentZoom > 15) {
            if (feature && !fireCircle) {
                const fireLngLat = this.fireMarker[feature.properties.pkey].getLngLat();
                const fireCircle = {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [fireLngLat.lng, fireLngLat.lat]
                    }
                };
                this.addFireCircleLayer(map, sourceCode);
                this.fireCircle[feature.properties.pkey] = fireCircle;
                fireMarker.remove(this.map);
                map.removeLayer("unclustered-" + `fire-${isPartner}`);
                this.fireMarker[feature.properties.pkey] = null;
                map.on("click", `circle-${sourceCode}-layer`, function (e) {
                    self.mapClickHandler(e, map, `circle-${sourceCode}-layer`, sourceCode, togglePane, cityName);
                });
            }
        } else {
            if (feature && !fireMarker) {
                map.addLayer({
                    id: "unclustered-" + sourceCode,
                    source: sourceCode,
                    type: "circle",
                    filter: ["all", ["==", "disaster_type", "fire"], ["!has", "point_count"]],
                    paint: {
                        "circle-radius": 20,
                        "circle-opacity": 0
                    }
                });
                self.addFireMarker(feature, map, isPartner);
                this.map.removeLayer(`circle-${sourceCode}-layer`);
                this.fireCircle[feature.properties.pkey] = null;

                // map.on("click", `unclustered-fire-${isPartner}`, function (e) {
                //   const features = map.queryRenderedFeatures(e.point, {
                //     layers: [`unclustered-fire-${isPartner}`],
                //   });
                //   self.queriedReports[sourceCode].features.forEach(function (
                //     feature,
                //     index
                //   ) {
                //     if (feature.properties.url === features[0].properties.url) {
                //       self.queriedReports[sourceCode].features[
                //         index
                //       ].properties.clicked =
                //         !self.queriedReports[sourceCode].features[index].properties
                //           .clicked;
                //       map
                //         .getSource(sourceCode)
                //         .setData(self.queriedReports[sourceCode]);
                //     }
                //   });
                //   self.markerClickHandler(e, features[0], cityName, map, togglePane);
                // });
            }
        }
    }

    addFireEntryCluster(data, cityName, map, togglePane, fireEntries, isPartner) {
        var self = this;
        let reports = Object.assign({}, data);
        const sourceCode = `fire-${isPartner}`;
        if (!fireEntries || fireEntries.length === 0) return;
        if (fireEntries.length == 1) {
            this.fireSingleFeature[isPartner.toString()] = fireEntries[0];
            let filteredReports = Object.assign({}, reports);
            this.queriedReports[sourceCode] = filteredReports;
            self.addFireMarker(fireEntries[0], map, isPartner);

            // if (!this.map.getSource(sourceCode)) {
            //     map.addSource(sourceCode, {
            //         type: "geojson",
            //         data: filteredReports,
            //         cluster: false,
            //         clusterMaxZoom: 14
            //     });
            // } else {
            //     this.map.getSource(sourceCode).setData(filteredReports);
            // }

            // if (!this.map.getLayer("unclustered-" + sourceCode)) {
            //     map.addLayer({
            //         id: "unclustered-" + sourceCode,
            //         source: sourceCode,
            //         type: "circle",
            //         filter: ["all", ["==", "disaster_type", "fire"], ["!has", "point_count"]],
            //         paint: {
            //             "circle-radius": 20,
            //             "circle-opacity": 0
            //         }
            //     });
            // }

            // map.on("click", "unclustered-" + sourceCode, function (e) {
            //     // Ensure that if the map is zoomed out such that multiple
            //     // copies of the feature are visible, the popup appears
            //     // over the copy being pointed to.

            //     const features = map.queryRenderedFeatures(e.point, {
            //         layers: ["unclustered-" + sourceCode]
            //     });

            //     self.queriedReports[sourceCode].features.forEach(function (feature, index) {
            //         if (feature.properties.url === features[0].properties.url) {
            //             self.queriedReports[sourceCode].features[index].properties.clicked =
            //                 !self.queriedReports[sourceCode].features[index].properties.clicked;
            //             map.getSource(sourceCode).setData(self.queriedReports[sourceCode]);
            //         }
            //     });
            //     const feature = self.queriedReports[sourceCode].features.filter(
            //         feature => feature.properties.url === features[0].properties.url
            //     );
            //     self.markerClickHandler(e, feature[0], cityName, map, togglePane);
            // });

            // map.on("click", `unclustered-${sourceCode}`, function (e) {
            //     self.mapClickHandler(e, map, `unclustered-${sourceCode}`, sourceCode, togglePane, cityName);
            // });
            this.addCluster(data, cityName, map, togglePane, "fire", null, isPartner);
            return;
        }
        this.addCluster(data, cityName, map, togglePane, "fire", null, isPartner);
        // self.addIconLayer(
        //   map,
        //   this.fetchIcon("fire", "high", isPartner),
        //   "fire_high",
        //   `fire-${isPartner}`,
        //   ["all", ["==", "disasterLevel", "high"], ["==", "clicked", false]],
        //   0.05
        // );
        // self.addIconLayer(
        //   map,
        //   this.fetchIcon("fire", "high", isPartner, true),
        //   `fire_${"high"}`,
        //   `fire-${`${isPartner}`}`,
        //   ["all", ["==", "disasterLevel", "high"], ["==", "clicked", true]],
        //   0.05
        // );

        // self.fireMarker = null;
        // }
        // else {
        this.addFireCircleLayer(map, sourceCode);
        map.addLayer({
            id: `circle-${sourceCode}-layer-selected`,
            type: "circle",
            source: sourceCode,
            paint: {
                "circle-radius": ["get", "fireDistance"],
                "circle-opacity": 0.3,
                "circle-color": "#223b53"
            },
            filter: ["all", ["==", "$type", "Point"], ["==", "disaster_type", "fire"], ["==", "clicked", true]]
        });
        // map.addLayer({
        //   id: "unclustered-" + sourceCode,
        //   source: sourceCode,
        //   type: "circle",
        //   filter: [
        //     "!",
        //     ["has", "point_count"],
        //     "all",
        //     ["==", "disaster_type", "fire"],
        //   ],
        //   paint: {
        //     "circle-radius": 20,
        //     // "circle-opacity": 0,
        //     "circle-color": "#B42222",
        //   },
        // });

        // let feature = fireEntries[0];

        // this.fireSingleFeature[isPartner.toString()] = feature;
        // map.on("click", `unclustered-${sourceCode}`, function (e) {
        //   const features = map.queryRenderedFeatures(e.point, {
        //     layers: [`unclustered-${sourceCode}`],
        //   });
        //   self.queriedReports[sourceCode].features.forEach(function (
        //     feature,
        //     index
        //   ) {
        //     if (feature.properties.url === features[0].properties.url) {
        //       self.queriedReports[sourceCode].features[index].properties.clicked =
        //         !self.queriedReports[sourceCode].features[index].properties
        //           .clicked;
        //       map.getSource(sourceCode).setData(self.queriedReports[sourceCode]);
        //     }
        //   });
        //   const feature = self.queriedReports[sourceCode].features.filter((feature) => {
        //     return feature.properties.url === features[0].properties.url;
        //   });
        //   self.markerClickHandler(e, feature[0], cityName, map, togglePane);
        // });
        // }
    }

    addFireMarker(feature, map, isPartner) {
        const sevearity = this.getAvgDisasterSevearity("fire", "fire", null);
        const icon = this.fetchIcon("fire", sevearity, isPartner);
        const imageElement = document.createElement("div");
        imageElement.className = "marker";
        imageElement.style.backgroundImage = `url(${icon})`;
        imageElement.style.width = `45px`;
        imageElement.style.height = `45px`;
        imageElement.style["background-repeat"] = "no-repeat";
        imageElement.style.backgroundSize = "100%";

        // Add markers to the map.
        const marker = new mapboxgl.Marker({
            element: imageElement
        })
            .setLngLat([feature.geometry.coordinates[0], feature.geometry.coordinates[1]])
            .addTo(map);

        this.fireMarker[feature.properties.pkey] = marker;
    }

    addCluster(data, cityName, map, togglePane, disaster, reportType, isPartner) {
        try {
            let self = this;
            let reports = Object.assign({}, data);
            reports.features = data.features.filter(feature => {
                if (reportType) {
                    let reportData = feature.properties.report_data || {
                        report_type: ""
                    };
                    return (
                        (isPartner ? feature.properties.partner_code != null : feature.properties.partner_code == null) &&
                        reportData.report_type === reportType
                    );
                }
                return (
                    (isPartner ? feature.properties.partner_code != null : feature.properties.partner_code == null) &&
                    feature.properties.disaster_type === disaster
                );
            });
            const sourceCode = reportType ? reportType + "-" + isPartner : disaster + "-" + isPartner;
            let filteredReports = Object.assign({}, reports);
            // this.queriedReports[disaster] = this.queriedReports[disaster] ? this.queriedReports[disaster]['features'].append(reports['features']) : {...reports};
            this.queriedReports[sourceCode] = filteredReports;

            if (!this.map.getSource(sourceCode)) {
                map.addSource(sourceCode, {
                    type: "geojson",
                    data: filteredReports,
                    cluster: true,
                    clusterMaxZoom: 14
                });
            } else {
                this.map.getSource(sourceCode).setData(filteredReports);
            }

            if (!this.map.getLayer("unclustered-" + sourceCode)) {
                map.addLayer({
                    id: "unclustered-" + sourceCode,
                    source: sourceCode,
                    type: "circle",
                    filter: ["!", ["has", "point_count"]],
                    paint: {
                        "circle-radius": 20,
                        "circle-opacity": 0
                    }
                });
            }

            if (!this.map.getLayer("cluster-" + sourceCode)) {
                map.addLayer({
                    id: "cluster-" + sourceCode,
                    source: sourceCode,
                    type: "circle",
                    filter: ["has", "point_count"],
                    paint: {
                        "circle-radius": 20,
                        "circle-opacity": 0
                    }
                });
            }

            map.on("click", "cluster-" + sourceCode, function (e) {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ["cluster-" + sourceCode]
                });
                const clusterId = features[0].properties.cluster_id;
                //check to see if the marker we are clicking on is clustered or not by looking to see if it has a clusterID
                // if true use cluster expansion zoom to zoom in on cluster
                if (clusterId) {
                    map.getSource(sourceCode).getClusterExpansionZoom(clusterId, function (err, zoom) {
                        if (err) return;
                        map.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom: zoom
                        });
                    });
                }
                //if not a cluster just ease to the center of the clicked point
                else {
                    map.easeTo({ center: features[0].geometry.coordinates, zoom: 20 });
                }
            });

            map.on("click", "unclustered-" + sourceCode, function (e) {
                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.

                const features = map.queryRenderedFeatures(e.point, {
                    layers: ["unclustered-" + sourceCode]
                });

                self.queriedReports[sourceCode].features.forEach(function (feature, index) {
                    if (feature.properties.url === features[0].properties.url) {
                        self.queriedReports[sourceCode].features[index].properties.clicked =
                            !self.queriedReports[sourceCode].features[index].properties.clicked;
                        map.getSource(sourceCode).setData(self.queriedReports[sourceCode]);
                    }
                });
                const feature = self.queriedReports[sourceCode].features.filter(
                    feature => feature.properties.url === features[0].properties.url
                );
                self.markerClickHandler(e, feature[0], cityName, map, togglePane);
            });

            self.svgPathToImage(self.fetchClusterIcon(reportType ? reportType : disaster), 100).then(image => {
                map.addImage(sourceCode + "-marker", image);
            });

            map.addLayer({
                id: "cluster-count-" + sourceCode,
                type: "symbol",
                source: sourceCode,
                filter: ["has", "point_count"],
                layout: {
                    "icon-image": sourceCode + "-marker",
                    "icon-size": 0.45,
                    "text-field": "{point_count}",
                    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                    "text-size": 12,
                    "text-offset": [0.75, 0.8]
                }
            });

            map.on("mouseenter", "cluster-" + sourceCode, function () {
                map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "cluster-" + sourceCode, function () {
                map.getCanvas().style.cursor = "";
            });
        } catch (err) {
            console.log("Err", err);
        }
    }

    iconCreateFunction() {
        map.loadImage("assets/icons/Add_Report_Icon_Flood.png", function (error, image) {
            if (error) throw error;
            map.addImage(disaster + "-marker", image);
        });

        let self = this;

        return cluster => {
            let tooltip = L.tooltip({
                className: "cluster-count",
                permanent: true,
                direction: "right",
                offset: [7, 7],
                interactive: true
            }).setContent(cluster.getChildCount().toString());
            cluster.bindTooltip(tooltip);
            // cluster.getAllChildMarkers()[0].feature.properties.report_data['flood_depth']
            let children = cluster.getAllChildMarkers();
            let partnericons = children.filter(function (entry, index) {
                return entry.feature.properties.partner_code !== null;
            });
            const reportData = children[0].feature.properties.report_data || {
                report_type: type
            };
            const subType = reportData.report_type || type;
            const sevearity = self.getAvgDisasterSevearity(type, subType, children);
            self.getDisasterClusterIcon(type, subType, sevearity, partnericons.length > 0);
            const type = children[0].feature.properties.disaster_type;
            self.queriedReports[disaster].features.forEach(function (feature, index) {
                if (feature.properties.url === features[0].properties.url) {
                    self.queriedReports[disaster].features[index].properties.clicked =
                        !self.queriedReports[disaster].features[index].properties.clicked;
                    map.getSource(disaster).setData(self.queriedReports[disaster]);
                }
            });
            self.markerClickHandler(e, features[0], cityName, map, togglePane);
        };
    }

    _getWindSevearity(impact) {
        // eslint-disable-next-line default-case
        switch (String(impact)) {
            case "0":
                return "normal";
            case "1":
                return "medium";
            case "2":
                return "high";
        }
    }

    _getAQSevearity(aq) {
        // eslint-disable-next-line default-case
        switch (String(aq)) {
            case "0":
                return "low";
            case "1":
                return "low";
            case "2":
                return "normal";
            case "3":
                return "high";
            case "4":
                return "high";
        }
    }

    _getFloodSevearity(depth) {
        if (depth <= 70) {
            return "normal";
        } else if (depth <= 150) {
            return "medium";
        } else if (depth > 150) {
            return "high";
        }
    }

    _getAccessabilitySevearity(accessability) {
        // eslint-disable-next-line default-case
        switch (accessability) {
            case 0:
                return "high";
            case 1:
                return "medium";
            case 2:
                return "normal";
            case 3:
                return "normal";
            case 4:
                return "low";
        }
    }

    _getAccessabilitySevearityGroup(accessability) {
        if (accessability <= 0.5) {
            return "high";
        } else if (accessability > 0.5 && accessability <= 1.0) {
            return "medium";
        } else if (accessability > 1.0 && accessability <= 1.8) {
            return "normal";
        } else if (accessability > 1.8) {
            return "low";
        }
    }

    _getStructureFailureSevearity(structureFailure) {
        if (structureFailure < 1) {
            return "low";
        } else if (structureFailure >= 1 && structureFailure < 2) {
            return "medium";
        } else if (structureFailure >= 2) {
            return "high";
        }
    }

    getAvgDisasterSevearity(type, subType, reportMarkers) {
        switch (type) {
            case "flood":
                let avgDepth = this.getAverageFloodDepth(reportMarkers);
                return this._getFloodSevearity(avgDepth);
            case "earthquake":
                if (subType === "road") {
                    let avgAccessability = this.getAverageAccessability(reportMarkers);
                    return this._getAccessabilitySevearityGroup(avgAccessability);
                } else if (subType === "structure") {
                    let avgStructureFailure = this.getAvgStructureFailure(reportMarkers);
                    return this._getStructureFailureSevearity(avgStructureFailure);
                }
                break;
            case "wind":
                let avgImpact = this.getAverageWindImpact(reportMarkers);
                return this._getWindSevearity(avgImpact);
            case "haze":
                let avgAirQuality = this.getAverageAirQuality(reportMarkers);
                return this._getAQSevearity(avgAirQuality);
            case "fire":
                return "high";
            default:
                return "low";
        }
    }

    getDisasterSevearity(feature) {
        let disasterType = feature.properties.disaster_type;
        let level = "low";
        let reportData = feature.properties.report_data;
        switch (disasterType) {
            case "flood":
                reportData = reportData || { flood_depth: 0 };
                let depth = reportData.flood_depth || 0;
                level = this._getFloodSevearity(depth);
                break;
            case "earthquake":
                let subType = feature.properties.report_data.report_type;
                if (subType === "road") {
                    reportData = reportData || { accessabilityFailure: 0 };
                    let accessability = reportData.accessabilityFailure || 0;
                    level = this._getAccessabilitySevearity(accessability);
                } else if (subType === "structure") {
                    reportData = reportData || { structureFailure: 0 };
                    let structureFailure = reportData.structureFailure || 0;
                    level = this._getStructureFailureSevearity(structureFailure);
                }
                break;
            case "haze":
                switch (reportData.airQuality) {
                    case 0:
                        level = "low";
                        break;
                    case 1:
                        level = "low";
                        break;
                    case 2:
                        level = "normal";
                        break;
                    case 3:
                        level = "high";
                        break;
                    case 4:
                        level = "high";
                        break;
                    default:
                        level = "low";
                        break;
                }
                break;
            case "wind":
                reportData = reportData || { impact: 0 };
                let impact = reportData.impact || 0;
                level = this._getWindSevearity(impact);
                break;
            case "volcano":
                break;
            case "fire":
                level = "high";
                break;
            default:
                break;
        }
        return level;
    }

    getAvgStructureFailure(reportMarkers) {
        let totalStructureFailure = 0;
        reportMarkers.forEach(function (report, index) {
            const reportData = report.feature.properties.report_data || {
                structureFailure: 0
            };
            totalStructureFailure += reportData.structureFailure || 0;
        });
        return totalStructureFailure / reportMarkers.length;
    }

    getAverageAccessability(reportMarkers) {
        let totalAccessability = 0;
        reportMarkers.forEach(function (report, index) {
            let accessability = 0;
            const reportData = report.feature.properties.report_data || {
                accessabilityFailure: 0
            };
            accessability = reportData.accessabilityFailure || 0;
            switch (accessability) {
                case 0:
                    totalAccessability += 0.5;
                    break;
                case 1:
                    totalAccessability += 1.0;
                    break;
                case 2:
                    totalAccessability += 1.4;
                    break;
                case 3:
                    totalAccessability += 1.8;
                    break;
                case 4:
                    totalAccessability += 2.2;
                    break;
                default:
                    totalAccessability += 0;
                    break;
            }
        });
        return totalAccessability / reportMarkers.length;
    }

    getAverageFloodDepth(reportMarkers) {
        let depth = 0;
        reportMarkers.forEach(function (report, index) {
            const reportData = report.feature.properties.report_data || {
                flood_depth: 0
            };
            depth += reportData.flood_depth || 0;
        });
        // for (let report in report_markers) {
        //   depth += report.feature.properties.report_data['flood_depth'];
        // }
        return depth / reportMarkers.length;
    }

    getAverageAirQuality(reportMarkers) {
        let aq = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
        reportMarkers.forEach(function (report, index) {
            const reportData = report.feature.properties.report_data || {
                airQuality: 0
            };
            aq[reportData["airQuality"]] = aq[reportData["airQuality"]] + 1;
        });
        return Object.keys(aq).reduce((a, b) => (aq[a] > aq[b] ? a : b));
    }

    getAverageWindImpact(reportMarkers) {
        let impact = { 0: 0, 1: 0, 2: 0 };
        reportMarkers.forEach(function (report, index) {
            const reportData = report.feature.properties.report_data || { impact: 0 };
            impact[reportData["impact"]] = impact[reportData["impact"]] + 1;
        });
        return Object.keys(impact).reduce((a, b) => (impact[a] > impact[b] ? a : b));
    }

    addVolcanoLayerToMap(data, map, cityName, togglePane) {
        let self = this;
        if (!map.getSource("volcanoSource")) {
            map.addSource("volcanoSource", {
                type: "geojson",
                data: data
            });
        }
        if (!map.getLayer("volcanoSourceLayer")) {
            map.addLayer({
                id: "volcanoSourceLayer",
                source: "volcanoSource",
                type: "circle",
                filter: ["in", "activity_level", "4", "3"],
                paint: {
                    "circle-radius": 8,
                    "circle-opacity": 0
                }
            });
            self.VolcanoEruptionLevelsMap.map(level =>
                this.svgPathToImage(`assets/icons/volcano-eruption-${level}.svg`).then(image => {
                    map.addImage(`volcano-eruption-icon-${level}`, image);
                    map.addLayer({
                        id: `volcanoSource-icon-${level}`,
                        type: "symbol",
                        source: "volcanoSource",
                        filter: ["==", "activity_level", level],
                        layout: {
                            "icon-image": `volcano-eruption-icon-${level}`,
                            "icon-size": 0.05,
                            "text-allow-overlap": true,
                            "text-ignore-placement": true,
                            "icon-allow-overlap": true,
                            "icon-ignore-placement": true
                        }
                    });
                })
            );
        }
    }

    addVolcanoEruptionLayers(cityName, map, togglePane) {
        let self = this;
        self.appendData("volcanos/last-eruption").then(data => {
            self.addVolcanoLayerToMap(data, map, cityName, togglePane);
        });

        map.on("click", "volcanoSourceLayer", function (e) {
            if (e.clickOnLayer) {
                return;
            }
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["volcanoSourceLayer"]
            });
            self.floodExtentInteraction(e, features[0], cityName, map, togglePane);
        });
    }

    addEarthquakeLayersToMap(data, map, cityName, togglePane) {
        let self = this;
        if (!map.getSource("earthquakeSource")) {
            map.addSource("earthquakeSource", {
                type: "geojson",
                data: data
            });
        }
        if (!map.getLayer("earthquakeSource")) {
            map.addLayer({
                id: "earthquakeSource",
                source: "earthquakeSource",
                type: "circle",
                paint: {
                    "circle-radius": 8,
                    "circle-opacity": 0
                }
            });
            self.svgPathToImage(`assets/icons/Epicenter_icon.svg`, 900).then(image => {
                map.addImage("epicenter-icon", image);
                map.addLayer({
                    id: "earthquakeSource-icon",
                    type: "symbol",
                    source: "earthquakeSource",
                    layout: {
                        "icon-image": "epicenter-icon",
                        "icon-size": 0.05,
                        "text-allow-overlap": true,
                        "text-ignore-placement": true,
                        "icon-allow-overlap": true,
                        "icon-ignore-placement": true
                    }
                });
            });
        }
        map.on("click", "earthquakeSource", function (e) {
            if (e.clickOnLayer) {
                return;
            }
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["earthquakeSource"]
            });
            self.floodExtentInteraction(e, features[0], cityName, map, togglePane);
        });
    }

    addEarthquakeLayers(cityName, map, togglePane) {
        let self = this;
        self.appendData("earthquakes").then(data => {
            self.addEarthquakeLayersToMap(data, map, cityName, togglePane);
        });
    }

    addFloodExtents(cityName, cityRegion, map, togglePane) {
        let self = this;
        self.appendData("floods?admin=" + cityRegion + "&minimum_state=1", map).then(data => {
            self.flood_extents = map.addSource("floodExtents", {
                type: "geojson",
                data: data
            });
            map.addLayer({
                id: "floodExtents",
                source: "floodExtents",
                type: "fill",
                paint: {
                    "fill-color": ["interpolate", ["linear"], ["get", "state"], 1, "#A0A9F7", 2, "#FFFF00", 3, "#FF8300", 4, "#CC2A41"],
                    "fill-opacity": 0.7
                }
            });
        });
        map.on("click", "floodExtents", function (e) {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["floodExtents"]
            });
            self.floodExtentInteraction(e, features[0], cityName, map, togglePane);
        });
    }

    removeFloodExtents(map) {
        let self = this;
        if (self.flood_extents && map.getLayer("floodExtents")) {
            map.removeLayer("floodExtents");
            map.removeSource("floodExtents");
            self.flood_extents = null;
        }
    }

    addFloodGauges(cityName, cityRegion, map, togglePane) {
        let self = this;
        // map.createPane("gauges");
        // map.getPane("gauges").style.zIndex = 650;
        if (cityRegion === "ID-JK") {
            // Create flood gauge layer and add to the map
            self.gaugeLayer = L.geoJSON(null, {
                pointToLayer: (feature, latlng) => {
                    return L.marker(latlng, {
                        icon: self.mapIcons.gauge_normal(
                            self.gaugeIconUrl(feature.properties.observations[feature.properties.observations.length - 1].f3)
                        ),
                        pane: "gauges"
                    });
                },
                onEachFeature: (feature, layer) => {
                    self.gaugeInteraction(feature, layer, cityName, map, togglePane);
                }
            });
        }
        return self.appendData("floodgauges?admin=" + cityRegion, self.gaugeLayer, map);
    }

    removeFloodGauges(map) {
        let self = this;
        if (self.gaugeLayer) {
            map.removeLayer("floodGauges");
            map.removeSource("floodGauges");
            self.gaugeLayer = null;
        }
    }

    addDisasterLevelsToData(data) {
        let self = this;
        data.features = data.features.map(function (item) {
            item.properties.disasterLevel = self.getDisasterSevearity(item);
            item.properties.report_data.hasOwnProperty("fireDistance");
            item.properties.fireDistance = item.properties.report_data.fireDistance;
            item.properties.clicked = false;
            return item;
        });
        return data;
    }
}
