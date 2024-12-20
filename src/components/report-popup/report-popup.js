import { inject, customElement } from 'aurelia-framework';
import { MapLayers } from '../disaster-map/map-layers';

@customElement('report-popup')
// @inject(MapLayers)
export class ReportPopup {
  // mapLayers;
  disasterType = 'flood';
  disasterSeverity = 'normal';
  disasterText = 'no text';
  disasterTime = new Date().toLocaleDateString();
  disasterImage = 'https://placehold.co/400';
  disasterChecklist = [];
  floodDepth = 0;
  reportIcon = `assets/icons/onselect/${this.disasterType}_${this.disasterSeverity}_select.svg`;

  constructor() {}

  getDepthInFeet(depth) {
    const feetInches = (depth * 2) / 33.33;
    const inString = feetInches.toString();
    const splitted = inString.split('.');
    const feet = splitted[0];
    const inches = splitted[1][0];
    return `${feet} ft. ${inches} in.`;
  }

  getReportIcon() {
    return `assets/icons/onselect/${this.disasterType}_${this.disasterSeverity}_select.svg`;
  }

  setReport(report) {
    this.disasterType = report.properties.disaster_type;
    this.disasterSeverity = report.properties.disasterLevel;
    this.disasterText = report.properties.text;
    this.disasterTime = new Date(report.properties.created_at).toLocaleDateString();
    this.disasterImage = report.properties.image_url;
    this.disasterChecklist = report.properties.report_data.flood_checklist;
    this.floodDepth = this.getDepthInFeet(report.properties.report_data.flood_depth);
    this.reportIcon = this.getReportIcon();
  }

  open() {
    const popUp = document.getElementById('report-popup');

    if (popUp) {
      popUp.classList.add('popup-open');
    }
  }

  getIcon() {
    let dType = 'flood';
    let severity = 'normal';
    if (this.mapLayers.popupContent) {
      dType = this.mapLayers.popupContent.disaster_type;
      severity = this.mapLayers.popupContent.sevearity;
    }

    return `assets/icons/onselect/${dType}_${severity}_select.svg`;
  }

  closeReportPopUp() {
    const popUp = document.getElementById('report-popup');

    if (popUp) {
      popUp.classList.remove('popup-open');
    }
  }
}
