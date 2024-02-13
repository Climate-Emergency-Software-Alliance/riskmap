export default {
  id: 'pk',
  name: 'tabahinaqsha',
  height_units: 'cm',
  supported_languages: [
    { key: 'en', name: 'English', code: 'EN' }
  ],
  map: {
    'instance_regions': {
      'Malir': {
        'region': '0',
        'bounds': { 'sw': [12.027, 118.015], 'ne': [17.303, 123.677] },
        'center': [14.8, 121.107]
      }
    },
    'default_region': {
      'region': 'Malir',
      'bounds': {
        'sw': [24.825002, 67.092749], // [ymin , xmin]
        'ne': [15.303, 121.677] // [ymax, xmax]
      },
      'center': [14.8, 121.107]
    },
    'initial_load': ['Malir'],
    'sub_regions': {},
    'region_center': [14.8, 121.107],
    'start_city_center': [14.8, 121.107],

    'starting_zoom': 8.75,
    'minimum_zoom': 8
  }
};
