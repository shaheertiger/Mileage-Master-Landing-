/* ============================================================
   MILEAGE MASTER — CONTENT DATA
   All text content & placeholder copy | content.js
   ============================================================ */

export const CONTENT = {

  brand: {
    name:    'Mileage Master',
    tagline: 'Power Under The Hood',
    cta:     'Find Your Oil',
  },

  nav: {
    links: [
      { id: 'story',    label: 'The Story' },
      { id: 'engine',   label: 'Engine Science' },
      { id: 'products', label: 'Products' },
      { id: 'contact',  label: 'Contact' },
    ],
  },

  hero: {
    stages: [
      {
        id:       'arrival',
        chapter:  '00',
        pre:      'Mileage Master — Est. 2024',
        headline: ['POWER', 'UNDER', 'THE HOOD'],
        sub:      'Full Synthetic Engine Oil',
      },
      {
        id:       'opening',
        chapter:  '01',
        tag:      'Enter the engine',
        headline: 'ENGINEERED\nTO DOMINATE',
        note:     'Precision-formulated for peak protection',
      },
      {
        id:       'explore',
        chapter:  '02',
        tag:      'Engine Science',
        stats: [
          { value: '5W',   unit: '',   label: 'Cold Start Viscosity' },
          { value: '30',   unit: '',   label: 'Hot Operating Grade' },
          { value: '100%', unit: '',   label: 'Full Synthetic Base' },
        ],
      },
      {
        id:       'oil',
        chapter:  '03',
        headline: ['LIQUID', 'GOLD'],
        desc:     'A precision-engineered synthetic formula. Designed to flow instantly, protect completely, and perform at every temperature extreme.',
      },
      {
        id:       'lube',
        chapter:  '04',
        label:    'Extended Life Technology',
        headline: 'COAT.\nPROTECT.\nENDURE.',
        features: [
          'Wear protection on first start',
          'Thermal stability across all conditions',
          'Sludge & deposit resistance',
          'High-mileage engine conditioning',
        ],
      },
      {
        id:       'ignition',
        chapter:  '05',
        rpm:      'Engine Alive',
        headline: ['MASTER', 'EVERY MILE'],
        cta:      [
          { label: 'Shop Products', primary: true  },
          { label: 'Learn More',    primary: false },
        ],
      },
    ],
  },

};
