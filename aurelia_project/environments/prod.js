export default {
  debug: false,
  testing: false,

  //deployment specific env params
  riskmap_us: {
    title: 'RiskMap.us',
    report_timeperiod: 3600,
    default_language: 'en',
    tile_layer:
      'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidXJiYW5yaXNrbWFwIiwiYSI6ImNqMnFraWVzYzAyd24ycXRqMmpvbmhyZ2QifQ.xc_v7umok760t2q6NZK1RA',
    data_server: 'https://data.riskmap.us/',
    app: 'https://broward.riskmap.us/',
    deep_links: [
      { name: 'facebook', link: 'http://m.me/riskmapUS' },
      //TODO after the twitter dev bot is registered
      {
        name: 'twitter',
        link: 'https://twitter.com/messages/compose?recipient_id=905602080252977152&welcome_message_id=905919155492331523&text=/flood'
      } /*,
      //Disable telegram button for US deployment
      {name: 'telegram', link: 'https://telegram.me/riskmapus_bot'}*/
    ]
  },
  petabencana: {
    title: 'Petabencana.id',
    report_timeperiod: 3600,
    default_language: 'id',
    environment: 'production',
    tile_layer:
      'https://api.mapbox.com/styles/v1/petabencana/ckq0nc6hp01vw17p9n17yxue2/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGV0YWJlbmNhbmEiLCJhIjoiY2s2MjF1cnZmMDlxdzNscWc5MGVoMTRkeCJ9.PGcoQqU6lBrcLfBmvTrWrQ',
    data_server: 'https://api.petabencana.id/',
    data_server_key: '{data_server_key}',
    cards_server: 'https://cards.petabencana.id/',
    app: 'https://petabencana.id/',
    deep_links: [
      { name: 'facebook', link: 'http://m.me/petabencana.id' },
      { name: 'twitter', link: 'https://twitter.com/intent/tweet?text=Laporkan+banjir&via=petabencana' },
      { name: 'telegram', link: 'https://telegram.me/BencanaBot' }
    ]
  },
  mapakalamidad: {
    title: 'Mapakalamidad.ph',
    report_timeperiod: 3600,
    default_language: 'tl',
    tile_layer:
      'https://api.mapbox.com/styles/v1/petabencana/ckq0nc6hp01vw17p9n17yxue2/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGV0YWJlbmNhbmEiLCJhIjoiY2s2MjF1cnZmMDlxdzNscWc5MGVoMTRkeCJ9.PGcoQqU6lBrcLfBmvTrWrQ',
    data_server: 'https://data.mapakalamidad.ph/',
    data_server_key: '{data_server_key}',
    cards_server: 'https://cards.mapakalamidad.ph/',
    app: 'https://mapakalamidad.ph/',
    deep_links: [
      { name: 'facebook', link: 'http://m.me/petabencana.id' },
      { name: 'twitter', link: 'https://twitter.com/intent/tweet?text=Laporkan+banjir&via=petabencana' },
      { name: 'telegram', link: 'https://telegram.me/BencanaBot' }
    ]
  },
  riskmap_in: {
    title: 'RiskMap.in',
    report_timeperiod: 43200, //12 hrs
    default_language: 'en',
    tile_layer:
      'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidXJiYW5yaXNrbWFwIiwiYSI6ImNqMnFraWVzYzAyd24ycXRqMmpvbmhyZ2QifQ.xc_v7umok760t2q6NZK1RA',
    data_server: 'https://data.riskmap.in/',
    app: 'https://riskmap.in/',
    deep_links: [
      { name: 'facebook', link: 'http://m.me/riskmapbot' },
      { name: 'twitter', link: 'https://twitter.com/intent/tweet?text=Report+flood&via=riskmapindia' },
      { name: 'telegram', link: 'https://telegram.me/riskmapbot' }
    ]
  },
  aafatinfo: {
    title: 'AafatInfo.pk',
    report_timeperiod: 129600,
    default_language: 'en',
    tile_layer:
      'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidXJiYW5yaXNrbWFwIiwiYSI6ImNqMnFraWVzYzAyd24ycXRqMmpvbmhyZ2QifQ.xc_v7umok760t2q6NZK1RA',
    data_server: 'https://api.aafatinfo.pk/',
    cards_server: 'https://cards.aafatinfo.pk/',
    app: 'https://www.aafatinfo.pk/',
    deep_links: []
  }
};
