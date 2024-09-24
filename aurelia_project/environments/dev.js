export default {
  debug: true,
  testing: true,

  //deployment specific env params

  riskmap_us: {
    title: 'RiskMap.us',
    report_timeperiod: 43200,
    default_language: 'en',
    tile_layer:
      'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidXJiYW5yaXNrbWFwIiwiYSI6ImNqMnFraWVzYzAyd24ycXRqMmpvbmhyZ2QifQ.xc_v7umok760t2q6NZK1RA',
    data_server: 'https://data-dev.riskmap.us/',
    app: 'https://broward-dev.riskmap.us/',
    deep_links: [
      { name: 'facebook', link: 'http://m.me/1747847428843379' }, //FB page id is used as no username is allowd at this point.
      //TODO after the twitter dev bot is registered
      {
        name: 'twitter',
        link: 'https://twitter.com/messages/compose?recipient_id=905602080252977152&welcome_message_id=905919155492331523&text=/flood'
      } /*,
      //Disable telegram button for US deployment
      {name: 'telegram', link: 'https://telegram.me/CognicityUS_bot'}*/
    ]
  },
  petabencana: {
    title: 'Petabencana.id',
    report_timeperiod: 43200,
    default_language: 'id',
    environment: 'development',
    tile_layer:
      'https://api.mapbox.com/styles/v1/petabencana/ckq0nc6hp01vw17p9n17yxue2/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGV0YWJlbmNhbmEiLCJhIjoiY2s2MjF1cnZmMDlxdzNscWc5MGVoMTRkeCJ9.PGcoQqU6lBrcLfBmvTrWrQ',
    // data_server: 'http://localhost:8001/',
    data_server: 'https://dev-api.petabencana.id/',
    data_server_key: '{data_server_key}',
    cards_server: 'https://cards-dev.petabencana.id/',
    // cards_server: 'http://localhost:4200/',
    app: 'https://dev.petabencana.id/',
    deep_links: [
      { name: 'facebook', link: 'http://m.me/CognicityDev.id' },
      { name: 'twitter', link: 'https://twitter.com/intent/tweet?text=Laporkan+banjir&via=petabencana' }, //TODO : fill after twitter DM bot is created for Petabencana.
      { name: 'telegram', link: 'https://telegram.me/CognicityDevBot' },
      { name: 'telegram', link: 'https://telegram.me/CognicityDevBot' }
    ]
  },
  mapakalamidad: {
    title: 'Mapakalamidad.ph',
    report_timeperiod: 43200,
    default_language: 'tl',
    tile_layer:
      'https://api.mapbox.com/styles/v1/petabencana/ckq0nc6hp01vw17p9n17yxue2/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGV0YWJlbmNhbmEiLCJhIjoiY2s2MjF1cnZmMDlxdzNscWc5MGVoMTRkeCJ9.PGcoQqU6lBrcLfBmvTrWrQ',
    data_server: 'http://localhost:8001/',
    cards_server: 'http://localhost:4200/',
    app: 'https://dev.petabencana.id/',
    deep_links: [
      { name: 'facebook', link: 'http://m.me/CognicityDev.id' },
      { name: 'twitter', link: 'https://twitter.com/intent/tweet?text=Laporkan+banjir&via=petabencana' }, //TODO : fill after twitter DM bot is created for Petabencana.
      { name: 'telegram', link: 'https://telegram.me/CognicityDevBot' },
      { name: 'telegram', link: 'https://telegram.me/CognicityDevBot' }
    ],
    data_server_key: '{data_server_key}'
  },
  riskmap_in: {
    title: 'RiskMap.in',
    report_timeperiod: 129600,
    default_language: 'en',
    tile_layer:
      'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidXJiYW5yaXNrbWFwIiwiYSI6ImNqMnFraWVzYzAyd24ycXRqMmpvbmhyZ2QifQ.xc_v7umok760t2q6NZK1RA',
    data_server: 'https://data-dev.riskmap.in/',
    app: 'https://dev.riskmap.in/',
    deep_links: [
      { name: 'facebook', link: 'http://m.me/CognicityDevIndia' },
      { name: 'twitter', link: 'https://twitter.com/intent/tweet?text=Report+flood&via=CognicityDev_IN' },
      { name: 'telegram', link: 'https://telegram.me/CognicityIN_bot' }
    ]
  },
  aafatinfo: {
    title: 'AafatInfo.pk',
    report_timeperiod: 129600,
    default_language: 'en',
    tile_layer:
      'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidXJiYW5yaXNrbWFwIiwiYSI6ImNqMnFraWVzYzAyd24ycXRqMmpvbmhyZ2QifQ.xc_v7umok760t2q6NZK1RA',
    data_server: 'https://dev-api.aafatinfo.pk/',
    cards_server: 'https://cards-dev.aafatinfo.pk/',
    app: 'https://dev.aafatinfo.pk/',
    deep_links: []
  }
};
