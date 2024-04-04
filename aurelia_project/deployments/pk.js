export default {
  id: 'pk',
  name: 'tabahinaqsha',
  height_units: 'cm',
  supported_languages: [
    { key: 'en', name: 'English', code: 'EN' }
  ],
  map: {
    'instance_regions': {
      // Malir
      'Malir': {
        'region': 'PK-S-MAL',
        'bounds': { 'sw': [24.811208, 67.086688], 'ne': [25.642592, 67.352494] },
        'center': [25.138454, 67.280905]
      },
      // Korangi
      'Korangi': {
        'region': 'PK-S-KOR',
        'bounds': { 'sw': [24.798979, 67.14263], 'ne': [24.91271, 67.222945] },
        'center': [24.850520, 67.165811]
      },
      // Karachi East
      'Karachi East': {
        'region': 'PK-S-KHIE',
        'bounds': { 'sw': [24.829469, 67.080423], 'ne': [25.024959, 67.159137] },
        'center': [24.921981, 67.108781]
      },
      // Karachi Central
      'Karachi Central': {
        'region': 'PK-S-KHIC',
        'bounds': { 'sw': [24.888542, 67.02663], 'ne': [25.005585, 67.091812] },
        'center': [24.946948, 67.058504]
      },
      // Karachi South
      'Karachi South': {
        'region': 'PK-S-KHIS',
        'bounds': { 'sw': [24.813293, 66.97441], 'ne': [24.87541, 67.027639] },
        'center': [24.818637, 67.042508]
      },
      // Karachi West
      'Karachi West': {
        'region': 'PK-S-KHIW',
        'bounds': { 'sw': [24.916091, 66.9903], 'ne': [25.054236, 67.168061] },
        'center': [25.013915, 67.052148]
      },
      // Kemari
      'Kemari': {
        'region': 'PK-S-KEA',
        'bounds': { 'sw': [24.825111, 66.669523], 'ne': [25.031625, 66.941936] },
        'center': [24.909454, 66.855275]
      }
    },
    'default_region': {
      'region': 'PK-S-MAL',
      'bounds': {
        'sw': [24.811208, 67.086688], // [ymin , xmin]
        'ne': [25.642592, 67.352494] // [ymax, xmax]
      },
      'center': [25.138454, 67.280905]
    },
    'initial_load': ['PK-S-MAL'],
    'sub_regions': {},
    'region_center': [25.138454, 67.280905],
    'start_city_center': [25.138454, 67.280905],
    'starting_zoom': 8.75,
    'minimum_zoom': 8
  }
};
