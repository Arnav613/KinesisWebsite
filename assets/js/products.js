/* Product catalogue: shared by the home carousel, the order section and the shop.
   Prices are in rupees. `img: null` renders an image placeholder. */
window.KINESIS = window.KINESIS || {};

KINESIS.formatINR = function (n) {
  return '₹' + n.toLocaleString('en-IN');
};

KINESIS.products = [
  /* ---------- Instrumented ---------- */
  {
    id: 'impact',
    group: 'instrumented',
    sport: 'Boxing',
    name: 'Impact',
    type: 'Smart boxing gloves',
    price: 5999,
    img: 'assets/img/shop-impact.jpg',
    hero: 'assets/img/shop-impact-hero.jpg',
    heroPos: 'center',
    blurb: 'Training gloves in premium synthetic leather with a sealed sensor in the cuff. It records which punch you threw, how fast it was and how hard it landed.',
    options: [
      { label: 'Weight', values: ['10 oz', '12 oz', '14 oz', '16 oz'], def: 2 }
    ],
    measures: [
      'Punch type: jab, cross, hook, uppercut',
      'Hand speed and impact force per punch',
      'Output volume by round',
      'Guard position between punches',
      'Defensive movement: slips, blocks, parries'
    ],
    specs: [
      ['Sensors', 'One motion and impact sensor per glove, in the cuff'],
      ['Range', 'Motion up to 16 g, impacts up to 320 g'],
      ['Charging', 'Magnetic cable'],
      ['Connectivity', 'Bluetooth'],
      ['Shell', 'Premium synthetic leather, triple-density foam']
    ],
    inBox: 'Pair of gloves · magnetic charging cable · 3 months of Kinesis Coach'
  },
  {
    id: 'vortex',
    group: 'instrumented',
    sport: 'Tennis',
    name: 'Vortex',
    type: 'Smart tennis racket',
    price: 13999,
    img: 'assets/img/shop-vortex.jpg',
    hero: 'assets/img/shop-vortex-hero.jpg',
    heroPos: 'center',
    blurb: 'A 100 sq in graphite racket with two strain sensors in the frame and a motion sensor in the butt cap. It records your swing path, where the ball hits the strings and how much spin you put on it.',
    options: [
      { label: 'Grip size', values: ['G1 · 4 1/8"', 'G2 · 4 1/4"', 'G3 · 4 3/8"', 'G4 · 4 1/2"'], def: 1 },
      { label: 'Weight', values: ['285 g', '300 g'], def: 1 },
      { label: 'Stringing', values: ['Unstrung', 'Strung · 52 lbs'], def: 1 }
    ],
    measures: [
      'Swing path and racket-head speed',
      'Contact point on the string bed',
      'Spin generation per stroke',
      'Stroke mix: forehand, backhand, slice, volley, serve',
      'Consistency across a session'
    ],
    specs: [
      ['Head size', '100 sq in · 16×19 pattern'],
      ['Sensors', 'Motion sensor in the butt cap + 2 frame strain sensors'],
      ['Sampling', '1,000 Hz'],
      ['Battery', 'Up to 12 h · USB-C'],
      ['Length', '27 in']
    ],
    inBox: 'Racket · USB-C cable · 3 months of Kinesis Coach'
  },
  {
    id: 'titan',
    group: 'instrumented',
    sport: 'Pickleball',
    name: 'Titan',
    type: 'Smart pickleball paddle',
    price: 9999,
    img: 'assets/img/shop-titan.jpg',
    hero: 'assets/img/shop-titan-hero.jpg',
    heroPos: 'center',
    blurb: 'A carbon-face paddle with a 16 mm honeycomb core and a grid of strain sensors under the face. It tracks where the ball hits the paddle and which shot you played.',
    options: [
      { label: 'Weight', values: ['Lite · 7.4 oz', 'Standard · 7.9 oz'], def: 1 },
      { label: 'Grip', values: ['4.125"', '4.25"'], def: 1 }
    ],
    measures: [
      'Shot type: dink, drive, drop, volley, serve',
      'Contact heatmap across the face',
      'Paddle face angle at contact',
      'Reset timing at the kitchen line'
    ],
    specs: [
      ['Face', 'Raw T700 carbon'],
      ['Core', '16 mm polymer honeycomb'],
      ['Sensors', 'Strain sensor grid + motion sensor in the handle'],
      ['Battery', 'Up to 14 h · USB-C'],
      ['Sampling', '1,000 Hz']
    ],
    inBox: 'Paddle · cover · USB-C cable · 3 months of Kinesis Coach'
  },
  {
    id: 'scythe',
    group: 'instrumented',
    sport: 'Golf',
    name: 'Scythe',
    type: 'Smart driver',
    price: 19999,
    img: 'assets/img/shop-scythe.jpg',
    hero: 'assets/img/shop-scythe-hero.jpg',
    heroPos: 'center',
    blurb: 'A 460cc titanium driver with sensors in the grip cap, along the shaft and behind the face. It measures your swing plane, tempo and face angle on every swing.',
    options: [
      { label: 'Hand', values: ['Right', 'Left'], def: 0 },
      { label: 'Loft', values: ['9°', '10.5°', '12°'], def: 1 },
      { label: 'Shaft flex', values: ['Regular', 'Stiff', 'X-Stiff'], def: 1 }
    ],
    measures: [
      'Swing plane, backswing to follow-through',
      'Tempo ratio (backswing : downswing)',
      'Face angle at impact',
      'Strike location on the face',
      'Shot-to-shot repeatability'
    ],
    specs: [
      ['Head', '460cc forged titanium'],
      ['Sensors', 'Motion sensor in the grip cap, strain sensors on the shaft, impact sensors behind the face'],
      ['Battery', 'Up to 18 h (about 5 rounds)'],
      ['Sampling', '1,000 Hz'],
      ['Connectivity', 'Bluetooth 5.3']
    ],
    inBox: 'Driver · head cover · USB-C cable · 3 months of Kinesis Coach'
  },

  /* ---------- Essentials ---------- */
  {
    id: 'wraps', group: 'essentials', sport: 'Boxing', name: 'Hand Wraps', type: 'Elastic cotton wraps',
    price: 799, img: 'assets/img/shop-wraps.jpg', hero: 'assets/img/shop-wraps-hero.jpg', heroPos: 'center',
    blurb: 'Semi-elastic cotton wraps with a thumb loop and velcro closure. They fit comfortably under the Impact gloves.',
    options: [
      { label: 'Length', values: ['120 in', '180 in'], def: 1 }
    ],
    specs: [['Material', 'Cotton / elastane'], ['Closure', 'Hook and loop'], ['Care', 'Machine wash cold']],
    inBox: 'One pair'
  },
  {
    id: 'tee', group: 'essentials', sport: 'Apparel', name: 'Training Tee', type: 'Performance T-shirt',
    price: 1999, img: 'assets/img/shop-tee.jpg', hero: 'assets/img/shop-tee-hero.jpg', heroPos: 'center',
    blurb: 'A heavy training tee that dries quickly and keeps its shape after washing. Small KINESIS print on the chest.',
    options: [
      { label: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'], def: 1 }
    ],
    specs: [['Fabric', '180 gsm recycled poly blend'], ['Fit', 'Regular'], ['Care', 'Machine wash cold']],
    inBox: 'One tee'
  },
  {
    id: 'balls', group: 'essentials', sport: 'Tennis', name: 'Match Balls', type: 'Pressurised tennis balls',
    price: 649, img: 'assets/img/shop-tennis-balls.jpg', hero: 'assets/img/shop-tennis-balls-hero.jpg', heroPos: 'center',
    blurb: 'Pressurised tennis balls with tough felt that lasts through long practice sessions on hard courts.',
    options: [{ label: 'Pack', values: ['Can of 3', '4 cans'], def: 0 }],
    specs: [['Type', 'Pressurised'], ['Surface', 'All-court']],
    inBox: 'As selected'
  },
  {
    id: 'pickleballs', group: 'essentials', sport: 'Pickleball', name: 'Outdoor Balls', type: '40-hole outdoor pickleballs',
    price: 899, img: 'assets/img/shop-pickleballs.jpg', hero: 'assets/img/shop-pickleballs-hero.jpg', heroPos: 'center',
    blurb: 'Seamless outdoor pickleballs with 40 drilled holes. They fly straight and hold up well on rough courts.',
    options: [
      { label: 'Pack', values: ['6 balls', '12 balls'], def: 0 }
    ],
    specs: [['Holes', '40'], ['Construction', 'Seamless, single piece']],
    inBox: 'As selected'
  },
  {
    id: 'golfglove', group: 'essentials', sport: 'Golf', name: 'Tour Glove', type: 'Cabretta leather golf glove',
    price: 1499, img: 'assets/img/shop-golf-glove.jpg', hero: 'assets/img/shop-golf-glove-hero.jpg', heroPos: 'center',
    blurb: 'A thin cabretta leather glove with perforated fingers, so you can feel the grip properly.',
    options: [
      { label: 'Hand', values: ['Left (for right-handed)', 'Right (for left-handed)'], def: 0 },
      { label: 'Size', values: ['S', 'M', 'ML', 'L', 'XL'], def: 2 }
    ],
    specs: [['Material', 'Cabretta leather'], ['Closure', 'Adjustable tab']],
    inBox: 'One glove'
  }
];

KINESIS.byId = function (id) {
  return KINESIS.products.find(function (p) { return p.id === id; });
};

/* Callouts for the 3D hero. Each anchor is either a ray cast onto the model
   (ray: [origin x, y, z, direction x, y, z] in the model's own space) or a named
   internal part (pt). `n` optionally overrides the surface direction used to
   decide when the point is facing the viewer. */
KINESIS.hero = [
  {
    id: 'impact',
    label: 'Boxing',
    callouts: [
      { ray: [0, 5, -0.12, 0, -1, 0], t: 'Punch ID', d: 'Tells a jab, cross, hook and uppercut apart from how the glove moves.' },
      { ray: [0, 1.25, 5, 0, 0, -1], t: 'Impact force', d: 'Hand speed and force for every punch that lands.' },
      { ray: [-5, 0.45, -0.2, 1, 0, 0], t: 'Guard discipline', d: 'Notices when your hands drop between punches.' },
      { ray: [0, -1.05, 5, 0, 0, -1], t: 'Round output', d: 'Punches per round, and how much you slow down as you tire.' }
    ],
    exo: [
      { pt: 'pads', t: 'Impact array', d: '12 force sensors over the knuckles that show where each punch lands.' },
      { pt: 'flex', t: 'Flex harness', d: 'A flexible circuit that bends with the glove and links the sensors.' },
      { pt: 'imu', t: 'Motion core', d: 'Accelerometer and gyroscope, read 1,000 times a second.' },
      { pt: 'cell', t: 'Cell + coil', d: '20-hour battery with wireless charging in the cuff.' }
    ]
  },
  {
    id: 'vortex',
    label: 'Tennis',
    callouts: [
      { ray: [0, 5, 0, 0, -1, 0], n: [0, 0.6, 1], t: 'Swing path', d: 'Tracks how the racket head moves through each stroke.' },
      { ray: [0.13, 0.95, 5, 0, 0, -1], n: [0, 0, 1], t: 'Contact map', d: 'Shows where the ball hits the strings on every shot.' },
      { ray: [5, 1.05, 0, -1, 0, 0], n: [1, 0, 0.4], t: 'Spin estimate', d: 'Works out topspin and slice from how the face turns at contact.' },
      { ray: [0, -1.35, 5, 0, 0, -1], t: 'Stroke mix', d: 'Counts your forehands, backhands, volleys and serves.' }
    ],
    exo: [
      { pt: 'strain', t: 'Strain sensors', d: 'Sensors in the frame that pick up how it flexes when you hit.' },
      { pt: 'harness', t: 'Harness', d: 'Wiring built into the throat, hidden from view.' },
      { pt: 'cell', t: 'Cell', d: '12-hour battery in the handle, charges over USB-C.' },
      { pt: 'imu', t: 'Motion core', d: 'Motion sensor and Bluetooth chip in the butt cap.' }
    ]
  },
  {
    id: 'titan',
    label: 'Pickleball',
    callouts: [
      { ray: [0.08, 0.95, 5, 0, 0, -1], t: 'Contact heatmap', d: 'Maps where each ball hits the face, so you find your real sweet spot.' },
      { ray: [5, 1.35, 0, -1, 0, 0], n: [1, 0.3, 0.4], t: 'Face angle', d: 'The angle of the paddle face when it meets the ball.' },
      { ray: [-5, 0.5, 0, 1, 0, 0], n: [-1, 0, 0.4], t: 'Shot ID', d: 'Recognises dinks, drives, drops, volleys and serves.' },
      { ray: [0, -0.85, 5, 0, 0, -1], t: 'Reset timing', d: 'How quickly your paddle gets back up at the kitchen line.' }
    ],
    exo: [
      { pt: 'grid', t: 'Strain-gauge grid', d: 'Sensors under the carbon face that measure where and how hard the ball hit.' },
      { pt: 'core', t: 'Honeycomb core', d: '16 mm polymer core with channels for the sensor wiring.' },
      { pt: 'imu', t: 'Motion core', d: 'Motion sensor and Bluetooth chip at the top of the handle.' },
      { pt: 'cell', t: 'Cell', d: '14-hour battery in the grip, charges over USB-C.' }
    ]
  },
  {
    id: 'scythe',
    label: 'Golf',
    callouts: [
      { ray: [0, 1.55, 5, 0, 0, -1], t: 'Tempo ratio', d: 'Backswing time compared with downswing time. Around 3 : 1 is a good target.' },
      { ray: [0, 0.2, 5, 0, 0, -1], t: 'Swing plane', d: 'The angle of the shaft from takeaway to follow-through.' },
      { pt: 'face', t: 'Face control', d: 'Whether the face is open, square or closed at impact.' },
      { pt: 'toe', t: 'Repeatability', d: 'How similar each swing is to your best one.' }
    ],
    exo: [
      { pt: 'imu', t: 'Motion core', d: 'Motion sensor in the grip cap, at the end of the club.' },
      { pt: 'cell', t: 'Cell', d: '18-hour battery in the grip, around five rounds of golf.' },
      { pt: 'bands', t: 'Shaft strain bands', d: 'Measure how the shaft bends and releases through impact.' },
      { pt: 'facearray', t: 'Face impact array', d: 'Shows whether you hit it on the heel, centre or toe.' }
    ]
  }
];

/* Subscription plans shown on the App page. */
KINESIS.plans = [
  {
    name: 'Track', price: 'Free', per: '', note: 'Included with every Kinesis product',
    items: ['Session stats and rep counts', 'Movement classification', 'Progress over time', 'Leaderboards and challenges with friends']
  },
  {
    name: 'Coach', price: 299, per: '/ month', note: 'or ₹2,499 a year · first 3 months free with gear', featured: true,
    items: ['Everything in Track', 'AI coach feedback after every session', 'Pattern and habit detection', 'Fatigue and form-decay alerts', 'Personal drill plans', 'Covers all your Kinesis gear']
  },
  {
    name: 'Coach+', price: 1999, per: '/ month', note: 'For athletes who want a person as well as the AI',
    items: ['Everything in Coach', 'Monthly video review by a certified coach who has seen your data']
  },
  {
    name: 'Academy', price: 2499, per: '/ month', note: 'Per gym, academy or team · 20 athletes included, then ₹99 each',
    items: ['Coach for every athlete', 'Dashboard for the gym\'s trainers', 'Gym leaderboards', '10% off gear']
  }
];
