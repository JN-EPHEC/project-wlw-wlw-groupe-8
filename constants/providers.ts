export type ProviderReview = {
  author: string;
  date: string;
  rating: number;
  comment: string;
};

export type ProviderService = {
  name: string;
  priceFrom?: number | null;
  durationHours?: number | null;
};

export type Provider = {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: string;
  price: string;
  image: string;
  phone: string;
  stats: {
    reviews: number;
    experienceYears: number;
    events: number;
  };
  location: string;
  responseTime: string;
  description: string;
  services: ProviderService[];
  gallery: string[];
  availability: string;
  reviews: ProviderReview[];
};

export const providers: Provider[] = [
  {
    id: '1',
    name: 'Photos PRO',
    category: 'Photographe',
    city: 'Anvers',
    rating: '4.9',
    price: '450 €',
    image:
      'https://images.pexels.com/photos/1484793/pexels-photo-1484793.jpeg?auto=compress&cs=tinysrgb&w=600',
    phone: '+32485123450',
    stats: {
      reviews: 132,
      experienceYears: 8,
      events: 210,
    },
    location: 'Anvers, Belgique',
    responseTime: 'Répond en moins de 2h',
    description:
      'Collectif de photographes spécialisés dans les mariages modernes et les événements privés raffinés. Nous privilégions les détails élégants et les émotions authentiques.',
    services: [
      { name: 'Reportage photo complet', priceFrom: 450, durationHours: 8 },
      { name: 'Retouches sous 48h', priceFrom: 120, durationHours: 2 },
      { name: 'Album prestige', priceFrom: 180, durationHours: 3 },
      { name: 'Photobooth', priceFrom: 220, durationHours: 5 },
    ],
    gallery: [
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/265947/pexels-photo-265947.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/302743/pexels-photo-302743.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    availability: 'Disponible du mardi au samedi. Lundi réservé à la post-production.',
    reviews: [
      {
        author: 'Sofia',
        date: 'Mai 2024',
        rating: 5,
        comment: 'Une équipe très attentive, les photos sont sublimes et livrées en avance.',
      },
      {
        author: 'Thomas',
        date: 'Décembre 2023',
        rating: 4.8,
        comment: 'Très pro, ils ont su capturer l’ambiance de notre gala.',
      },
    ],
  },
  {
    id: '2',
    name: 'Traiteur Gourmet',
    category: 'Traiteur',
    city: 'Liège',
    rating: '4.8',
    price: '35 €/pers',
    image:
      'https://images.pexels.com/photos/3184194/pexels-photo-3184194.jpeg?auto=compress&cs=tinysrgb&w=600',
    phone: '+32497888991',
    stats: {
      reviews: 98,
      experienceYears: 12,
      events: 320,
    },
    location: 'Liège, Belgique',
    responseTime: 'Répond sous 3h',
    description:
      'Cuisine généreuse et savoir-faire gastronomique belge. Saveurs locales, produits de saison et dressages créatifs.',
    services: [
      { name: 'Cocktails dînatoires', priceFrom: 32, durationHours: 2 },
      { name: 'Buffets thématiques', priceFrom: 38, durationHours: 3 },
      { name: 'Menu gastronomique', priceFrom: 55, durationHours: 4 },
      { name: 'Service en salle', priceFrom: 25, durationHours: 5 },
    ],
    gallery: [
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/5938/food-salad-healthy-lunch.jpg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    availability: 'Disponible tous les jours. Réservation 3 semaines à l’avance recommandée.',
    reviews: [
      {
        author: 'Camille',
        date: 'Janvier 2024',
        rating: 4.9,
        comment: 'Cuisine excellente, équipe discrète et efficace.',
      },
      {
        author: 'Luca',
        date: 'Septembre 2023',
        rating: 4.7,
        comment: 'Menus très créatifs et adaptés aux régimes spéciaux.',
      },
    ],
  },
  {
    id: '3',
    name: 'DJ Pulse',
    category: 'DJ',
    city: 'Bruxelles',
    rating: '5.0',
    price: '780 €',
    image:
      'https://images.pexels.com/photos/1596431/pexels-photo-1596431.jpeg?auto=compress&cs=tinysrgb&w=600',
    phone: '+32477880001',
    stats: {
      reviews: 76,
      experienceYears: 10,
      events: 260,
    },
    location: 'Bruxelles, Belgique',
    responseTime: 'Répond en moins de 1h',
    description:
      'DJ résident sur Bruxelles avec une forte expérience corporate et nightlife. Mixs personnalisés, lumière intelligente et show interactif.',
    services: [
      { name: 'Mix live', priceFrom: 650, durationHours: 4 },
      { name: 'Light show', priceFrom: 240, durationHours: 2 },
      { name: 'Playlists sur-mesure', priceFrom: 120, durationHours: 3 },
      { name: 'Coordination technique', priceFrom: 180, durationHours: 5 },
    ],
    gallery: [
      'https://images.pexels.com/photos/1699168/pexels-photo-1699168.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1449791/pexels-photo-1449791.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    availability: 'Soirées du jeudi au dimanche, autres jours sur demande.',
    reviews: [
      {
        author: 'Amandine',
        date: 'Mars 2024',
        rating: 5,
        comment: 'Ambiance incroyable, dancefloor plein toute la nuit.',
      },
    ],
  },
  {
    id: '4',
    name: 'Fleurs Bloom',
    category: 'Fleuriste',
    city: 'Namur',
    rating: '4.7',
    price: '220 €',
    image:
      'https://images.pexels.com/photos/931167/pexels-photo-931167.jpeg?auto=compress&cs=tinysrgb&w=600',
    phone: '+32467223390',
    stats: {
      reviews: 64,
      experienceYears: 7,
      events: 150,
    },
    location: 'Namur, Belgique',
    responseTime: 'Répond sous 4h',
    description:
      'Studio floral créatif spécialisé dans les mariages intimistes. Style naturel, matières locales et palettes sur-mesure.',
    services: [
      { name: 'Bouquets mariée', priceFrom: 180, durationHours: 2 },
      { name: 'Décors de table', priceFrom: 220, durationHours: 3 },
      { name: 'Mur floral', priceFrom: 450, durationHours: 4 },
      { name: 'Livraison et installation', priceFrom: 90, durationHours: 1 },
    ],
    gallery: [
      'https://images.pexels.com/photos/931162/pexels-photo-931162.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1019470/pexels-photo-1019470.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/931154/pexels-photo-931154.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    availability: 'Atelier ouvert du mardi au samedi, livraison possible le dimanche.',
    reviews: [
      {
        author: 'Manon',
        date: 'Août 2023',
        rating: 4.8,
        comment: 'Les compositions florales étaient délicates et parfaitement dans le thème.',
      },
    ],
  },
];
