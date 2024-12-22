import { bindable, customElement, inject } from 'aurelia-framework';
import $ from 'jquery';
import { Config } from 'resources/config';
import { Locales } from 'resources/locales/locales';
import { HttpClient } from 'aurelia-http-client';

//start-aurelia-decorators
@customElement('side-pane')
@inject(Locales, Config)
//end-aurelia-decorators
export class SidePane {
  //@bindable attributes do not work with camelCase...
  //start-aurelia-decorators
  @bindable cities;
  @bindable selcity;
  @bindable changeCity;
  @bindable closePane;
  @bindable reportId;
  @bindable querylanguage;
  //end-aurelia-decorators

  accordionOpenElement = null;
  hasInitiatedReport = false;

  constructor(Locales, Config) {
    this.config = Config;
    this.languages = this.config.supported_languages;

    this.lang_obj = {};
    for (let lang of this.languages) {
      if (Locales.languages.hasOwnProperty(lang.key)) {
        this.lang_obj[lang.key] = Locales.languages[lang.key];
      }
    }
    this.locale = {};
    this.currentLanguage = '';

    this.menuList = ['report', 'legend', 'about'];
    // this.seltab = 'about'; //default tab to open
    this.switchTab(this.seltab);

    this.selLegend = '';
    // this.switchLegend('floods_legend');

    this.vidWrapperOpened = true;
    this.youtube_video = {
      id: 'https://www.youtube.com/embed/B6tXP4wBoiI',
      en: 'https://www.youtube.com/embed/_A53C84wF7Y',
      icon: 'deployment_specific/pb/ds_assets/icons/youtube.png'
    };
    this.report_methods = [
      {
        platform: 'facebook',
        icon: 'deployment_specific/pb/ds_assets/icons/facebook.png'
      },
      {
        platform: 'web',
        icon: 'deployment_specific/pb/ds_assets/icons/web_report.png'
      }
    ];

    //this needs to be dynamicaly populated from backend data
    this.last_report_received_on = [
      { en: 'Reports remain active for 3 hours', ur: 'رپورٹس 3 گھنٹے تک فعال رہتی ہیں۔', id: 'Masa aktif laporan: 3 jam' },
      { en: 'Reports remain active for 12 hours', id: 'Masa aktif laporan: 12 jam' },
      { en: 'Reports remain active for 12 hours', id: 'Masa aktif laporan: 12 jam' },
      { en: 'Reports remain active for 2 hours', id: 'Masa aktif laporan: 2 jam' },
      { en: 'Reports remain active for 6 hours', id: 'Masa aktif laporan: 6 jam' },
      { en: 'Reports remain active for 6 hours', id: 'Masa aktif laporan: 6 jam' },
      { en: 'Reports remain active for 12 hours', id: 'Masa aktif laporan: 12 jam' }
    ];

    //legends data
    this.all_legends_data = [
      //floods
      {
        legend_name: 'floods',
        legend_title: { en: 'floods', ur: 'سیلاب', id: 'banjir' },
        legend_title_icon: 'deployment_specific/pb/ds_assets/icons/Add_Report_Icon_Flood.png',
        col_1_title: { en: 'Flood Gauges', ur: 'فلڈ گیجز', id: 'Tinggi Muka Air' },
        col_2_title: { en: 'Flood Depth (cm)', ur: 'سیلاب کی گہرائی (سینٹی میٹر)', id: 'Tinggi Banjir (cm)' },
        legend_data: [
          {
            col_1: {
              text: { en: 'Alert Level 1', ur: 'الرٹ لیول 1', id: 'Siaga 1' },
              icon: 'assets/icons/floodgauge_1.svg',
              color: '#CC2A41' //red
            },
            col_2: {
              text: { en: '> 150', ur: '>۱۵۰', id: '> 150' },
              color: '#CC2A41' //red
            }
          },
          {
            col_1: {
              text: { en: 'Alert Level 2', ur: 'الرٹ لیول 2', id: 'Siaga 2' },
              icon: 'assets/icons/floodgauge_2.svg',
              color: '#FF8300' //orange
            },
            col_2: {
              text: { en: '71 - 150', ur: '71 - 150', id: '71 - 150' },
              color: '#FF8300' //orange
            }
          },
          {
            col_1: {
              text: { en: 'Alert Level 3', ur: 'الرٹ لیول 3', id: 'Siaga 3' },
              icon: 'assets/icons/floodgauge_3.svg',
              color: '#FFFF00' //yellow
            },
            col_2: {
              text: { en: '10 - 70', ur: '10 - 70', id: '10 - 70' },
              color: '#FFFF00' //yellow
            }
          },
          {
            col_1: {
              text: { en: 'Alert Level 4', ur: 'الرٹ لیول 4', id: 'Siaga 4' },
              icon: 'assets/icons/floodgauge_4.svg',
              color: '#9ce233' //green
            },
            col_2: {
              text: { en: 'Use Caution', ur: 'احتیاط برتیں۔', id: 'Hati-hati' },
              color: '#A0A9F7' //purple
            }
          }
        ]
      }
    ];
    //end legends data array
  }

  //on the fly language change
  changeLanguage(language) {
    this.locale = this.lang_obj[language];
    this.currentLanguage = language;

    $('li p').click(function () {
      // reset all
      $('ul.tabs p').removeClass('activelanguage');
      $(this).addClass('activelanguage');
      $(this)
        .parents('li')
        .find('p')
        .filter(function () {
          return !$(this).closest('p').hasClass('tabs-nav');
        })
        .addClass('activelanguage');
    });
  }

  //get language object from key
  getLangObj(key) {
    let selLang;
    for (let lang of this.languages) {
      if (key === lang.key) {
        selLang = lang;
      } else {
        selLang = this.config.default_language;
      }
    }
    return selLang;
  }

  attached() {
    this.selLanguage = this.querylanguage ? this.getLangObj(this.querylanguage) : this.config.default_language;
    this.changeLanguage(this.selLanguage.key);
  }

  switchTab(tab) {
    this.seltab = tab;
    $('.panel:not(#vid_' + tab + ')').slideUp('fast');
    $('#vid_' + tab).slideToggle('fast');
    $('.accordion:not(#label_' + tab + ')')
      .parent()
      .removeClass('active');
    $('#label_' + tab)
      .parent()
      .toggleClass('active');
    $('#down_' + tab + ', #up_' + tab).toggle();
    $('.up:not(#up_' + tab + ')').hide();
    $('.down:not(#down_' + tab + ')').show();
  }

  switchLegend(legendId) {
    if (this.selLegend !== legendId) {
      this.selLegend = legendId;
    } else {
      this.selLegend = null;
    }
  }

  collabsibleItemClicked($event, id) {
    $event.preventDefault();
    $event.stopImmediatePropagation();
    const collapsibleIndicatorquery = `#${this.accordionOpenElement} .collapsibleItem-label-indicator`;
    const collapsibleContentquery = `#${this.accordionOpenElement} .collapsibleItem-content`;
    const upIcon = `assets/graphics/ChevronUp.svg`;
    const downIcon = `assets/graphics/ChevronDown.svg`;

    if (this.accordionOpenElement) {
      $(collapsibleIndicatorquery).attr('src', downIcon);
      $(collapsibleContentquery).css('display', 'none');

      if (id === this.accordionOpenElement) {
        this.accordionOpenElement = null;
        return;
      }
    }

    this.accordionOpenElement = id;
    $(`#${id} .collapsibleItem-label-indicator`).attr('src', upIcon);
    $(`#${id} .collapsibleItem-content`).css('display', 'flex');
  }

  switchCity(city) {
    this.changeCity(city, true);
    this.reportId = null;
    this.closePane();
  }

  showVideo(video) {
    $('.videoWrapper:not(#vid_' + video + ')').slideUp('fast');
    $('#vid_' + video).slideToggle('fast');
    $('.labelRow:not(#label_' + video + ')').removeClass('active');
    $('#label_' + video).toggleClass('active');
    $('#down_' + video + ', #up_' + video).toggle();
    $('.up:not(#up_' + video + ')').hide();
    $('.down:not(#down_' + video + ')').show();
  }

  // When the user clicks on div, open the popup
  openTermsPopup() {
    this.closePane();
    $('#screen').show();
    $('#termsPopup').show();
  }

  async initiateFloodReport() {
    if (this.hasInitiatedReport) return;
    this.hasInitiatedReport = true;

    const client = new HttpClient();

    const url = `${this.config.map.data_server}cards/`;
    const body = {
      username: 'web_guest',
      language: this.config.default_language.key,
      network: 'website'
    };

    try {
      const data = await client.post(url, body);
      if (data.statusCode && data.statusCode === 200) {
        const createdCard = JSON.parse(data.response);
        let CARD_TYPE = 'flood';

        if ('cardId' in createdCard) {
          window.location = `${this.config.map.cards_server}${createdCard.cardId}/${CARD_TYPE}`;
        }
      }
    } catch (error) {
      console.error(error);
      this.hasInitiatedReport = false;
    }
  }
}
