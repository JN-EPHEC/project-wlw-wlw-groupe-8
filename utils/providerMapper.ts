import { Provider } from '@/constants/providers';

export const PLACEHOLDER_AVATAR_URI = 'https://placehold.co/400x400/E7E3FF/6D5BFF?text=SE';

export const getInitials = (name: string) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || 'SE';
};

export const toStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
};

export const formatPrice = (price: unknown) => {
  const formatWithCurrency = (value: number) => {
    const rounded = Number.isFinite(value) ? value : 0;
    return `${rounded.toFixed(2).replace('.', ',')} €`;
  };

  if (typeof price === 'number' && !Number.isNaN(price)) {
    return formatWithCurrency(price);
  }

  if (typeof price === 'string' && price.trim()) {
    const cleaned = price.replace(/[^\d.,-]/g, '').replace(',', '.');
    const numericValue = cleaned ? Number(cleaned) : NaN;
    if (!Number.isNaN(numericValue)) {
      return formatWithCurrency(numericValue);
    }
    return price.trim();
  }

  return 'Tarif sur demande';
};

export const mapContactToProvider = (id: string, data: Record<string, any>): Provider => {
  const cities = toStringArray(data.cities);
  const services = toStringArray(data.services);
  const gallery = toStringArray(data.gallery);
  const fullName = `${data.firstname ?? ''} ${data.lastname ?? ''}`.trim();
  const description =
    typeof data.description === 'string' && data.description.trim()
      ? data.description.trim()
      : "Ce prestataire n'a pas encore ajouté de description.";

  const profilePhoto =
    typeof data.profilePhoto === 'string' && data.profilePhoto.trim().length > 0
      ? data.profilePhoto.trim()
      : undefined;
  const legacyImage =
    typeof data.image === 'string' && data.image.trim().length > 0 ? data.image.trim() : undefined;
  const galleryImage = gallery.length ? gallery[0] : undefined;
  const resolvedImage = profilePhoto ?? legacyImage ?? galleryImage ?? PLACEHOLDER_AVATAR_URI;

  return {
    id,
    name: fullName || data.company || data.job || 'Prestataire SpeedEvent',
    category: data.job ?? 'Prestataire',
    city: cities.length ? cities.join(', ') : 'Ville à préciser',
    rating: data.rating ? String(data.rating) : '5.0',
    price: formatPrice(data.price),
    image: resolvedImage,
    phone: data.phone ?? '',
    stats: {
      reviews:
        typeof data.reviewsCount === 'number'
          ? data.reviewsCount
          : Number(data.reviewsCount) || 0,
      experienceYears:
        typeof data.experienceYears === 'number'
          ? data.experienceYears
          : Number(data.experienceYears) || 0,
      events:
        typeof data.eventsCount === 'number' ? data.eventsCount : Number(data.eventsCount) || 0,
    },
    location: cities.length ? cities.join(', ') : 'Belgique',
    priceRange: data.priceRange ?? formatPrice(data.price),
    responseTime: data.responseTime ?? 'Répond généralement sous 24h',
    description,
    services: services.length ? services : ['Services à définir'],
    gallery,
    availability:
      data.availability ?? 'Disponibilités communiquées après prise de contact.',
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
  };
};
