export interface Photo {
  id: string;
  src: string;
  caption: string;
}

export interface City {
  name: string;
  photos: Photo[];
}

export interface Country {
  id: string;
  name: string;
  thumbnail: string;
  cities: City[];
}

export const countries: Country[] = [
  {
    id: "united-kingdom",
    name: "United Kingdom",
    thumbnail:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80",
    cities: [
      {
        name: "London",
        photos: [
          {
            id: "lon-1",
            src: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=1600&q=80",
            caption: "Big Ben at dusk",
          },
          {
            id: "lon-2",
            src: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80",
            caption: "London skyline from the Thames",
          },
          {
            id: "lon-3",
            src: "https://images.unsplash.com/photo-1481833761867-72db824f5c38?w=1600&q=80",
            caption: "Tower Bridge at sunrise",
          },
          {
            id: "lon-4",
            src: "https://images.unsplash.com/photo-1486299267345-b9c6cbcc4aa5?w=1600&q=80",
            caption: "Westminster at night",
          },
          {
            id: "lon-5",
            src: "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=1600&q=80",
            caption: "St Paul's Cathedral",
          },
        ],
      },
      {
        name: "Edinburgh",
        photos: [
          {
            id: "edi-1",
            src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=80",
            caption: "Edinburgh Castle over the city",
          },
          {
            id: "edi-2",
            src: "https://images.unsplash.com/photo-1467269204519-bed5e04e4e55?w=1600&q=80",
            caption: "The Royal Mile",
          },
          {
            id: "edi-3",
            src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
            caption: "Arthur's Seat at dawn",
          },
          {
            id: "edi-4",
            src: "https://images.unsplash.com/photo-1477519242566-6ae87c31d212?w=1600&q=80",
            caption: "Calton Hill panorama",
          },
        ],
      },
    ],
  },
  {
    id: "france",
    name: "France",
    thumbnail:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80",
    cities: [
      {
        name: "Paris",
        photos: [
          {
            id: "par-1",
            src: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80",
            caption: "Eiffel Tower at golden hour",
          },
          {
            id: "par-2",
            src: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&q=80",
            caption: "Seine at night",
          },
          {
            id: "par-3",
            src: "https://images.unsplash.com/photo-1471874708374-8ab8edc5d9c9?w=1600&q=80",
            caption: "Montmartre streets",
          },
          {
            id: "par-4",
            src: "https://images.unsplash.com/photo-1431274172761-fcdca2d233dd?w=1600&q=80",
            caption: "Notre-Dame cathedral",
          },
          {
            id: "par-5",
            src: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=1600&q=80",
            caption: "Louvre pyramid",
          },
        ],
      },
      {
        name: "Nice",
        photos: [
          {
            id: "nic-1",
            src: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1600&q=80",
            caption: "Promenade des Anglais",
          },
          {
            id: "nic-2",
            src: "https://images.unsplash.com/photo-1504608524841-42785f5bfdc8?w=1600&q=80",
            caption: "Old Town rooftops",
          },
          {
            id: "nic-3",
            src: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1600&q=80",
            caption: "Azure coastline",
          },
          {
            id: "nic-4",
            src: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600&q=80",
            caption: "Cours Saleya market",
          },
        ],
      },
    ],
  },
  {
    id: "italy",
    name: "Italy",
    thumbnail:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80",
    cities: [
      {
        name: "Rome",
        photos: [
          {
            id: "rom-1",
            src: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80",
            caption: "The Colosseum",
          },
          {
            id: "rom-2",
            src: "https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=1600&q=80",
            caption: "Trevi Fountain",
          },
          {
            id: "rom-3",
            src: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1600&q=80",
            caption: "Spanish Steps at dawn",
          },
          {
            id: "rom-4",
            src: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&q=80",
            caption: "Vatican domes",
          },
          {
            id: "rom-5",
            src: "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?w=1600&q=80",
            caption: "Roman Forum at dusk",
          },
        ],
      },
      {
        name: "Florence",
        photos: [
          {
            id: "flo-1",
            src: "https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=1600&q=80",
            caption: "Santa Maria del Fiore",
          },
          {
            id: "flo-2",
            src: "https://images.unsplash.com/photo-1571442728895-28c98b8e9aff?w=1600&q=80",
            caption: "Ponte Vecchio",
          },
          {
            id: "flo-3",
            src: "https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?w=1600&q=80",
            caption: "View from Piazzale Michelangelo",
          },
          {
            id: "flo-4",
            src: "https://images.unsplash.com/photo-1516108158a00d0e3abe3eb76e3c5?w=1600&q=80",
            caption: "Uffizi Gallery courtyard",
          },
          {
            id: "flo-5",
            src: "https://images.unsplash.com/photo-1543429776-5d3e2d3e7c17?w=1600&q=80",
            caption: "Tuscan hills at sunset",
          },
        ],
      },
    ],
  },
  {
    id: "spain",
    name: "Spain",
    thumbnail:
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1600&q=80",
    cities: [
      {
        name: "Barcelona",
        photos: [
          {
            id: "bar-1",
            src: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1600&q=80",
            caption: "Sagrada Família",
          },
          {
            id: "bar-2",
            src: "https://images.unsplash.com/photo-1570168007204-ec17d2b2d9e2?w=1600&q=80",
            caption: "La Barceloneta beach",
          },
          {
            id: "bar-3",
            src: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1600&q=80",
            caption: "Park Güell mosaics",
          },
          {
            id: "bar-4",
            src: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1600&q=80",
            caption: "Gothic Quarter streets",
          },
          {
            id: "bar-5",
            src: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80",
            caption: "Las Ramblas",
          },
        ],
      },
      {
        name: "Seville",
        photos: [
          {
            id: "sev-1",
            src: "https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=1600&q=80",
            caption: "Real Alcázar gardens",
          },
          {
            id: "sev-2",
            src: "https://images.unsplash.com/photo-1559674436-33e3b7bc1b3b?w=1600&q=80",
            caption: "Plaza de España",
          },
          {
            id: "sev-3",
            src: "https://images.unsplash.com/photo-1532635241-17e820acc59f?w=1600&q=80",
            caption: "Seville cathedral tower",
          },
          {
            id: "sev-4",
            src: "https://images.unsplash.com/photo-1543747579-795b9c2c3ada?w=1600&q=80",
            caption: "Barrio Santa Cruz alleyway",
          },
        ],
      },
    ],
  },
];
