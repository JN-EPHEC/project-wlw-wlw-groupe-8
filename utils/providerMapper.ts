import { Provider, ProviderService } from '@/constants/providers';

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

const normalizeNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
    const numericValue = Number(cleaned);
    return Number.isNaN(numericValue) ? null : numericValue;
  }
  return null;
};

const normalizeServices = (value: unknown): ProviderService[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): ProviderService | null => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (!trimmed) return null;
        return { name: trimmed };
      }
      if (item && typeof item === 'object') {
        const nameCandidate =
          typeof (item as any).name === 'string' && (item as any).name.trim()
            ? (item as any).name.trim()
            : typeof (item as any).title === 'string' && (item as any).title.trim()
            ? (item as any).title.trim()
            : '';
        if (!nameCandidate) return null;
        const durationValue = normalizeNumber(
          (item as any).durationHours ?? (item as any).duration ?? (item as any).hours,
        );
        const priceValue =
          normalizeNumber(
            (item as any).priceFrom ??
              (item as any).price ??
              (item as any).priceMin ??
              (item as any).minPrice,
          ) ?? undefined;
        return {
          name: nameCandidate,
          durationHours: durationValue ?? undefined,
          priceFrom: priceValue,
        };
      }
      return null;
    })
    .filter((service): service is ProviderService => Boolean(service));
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
  const services = normalizeServices(data.services);
  const fallbackPricing = data.pricing ?? {};
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
  const servicePriceCandidates = services
    .map((service) => (typeof service.priceFrom === 'number' ? service.priceFrom : null))
    .filter((value): value is number => value !== null);
  const bestServicePrice =
    servicePriceCandidates.length > 0 ? Math.min(...servicePriceCandidates) : null;
  const fallbackPriceSource =
    bestServicePrice ??
    normalizeNumber(fallbackPricing.min ?? fallbackPricing.price) ??
    normalizeNumber(data.price);
  return {
    id,
    name: fullName || data.company || data.job || 'Prestataire SpeedEvent',
    category: data.job ?? 'Prestataire',
    city: cities.length ? cities.join(', ') : 'Ville à préciser',
    rating: data.rating ? String(data.rating) : '5.0',
    price: fallbackPriceSource !== null ? formatPrice(fallbackPriceSource) : formatPrice(data.price),
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
    responseTime: data.responseTime ?? 'Répond généralement sous 24h',
    description,
    services,
    gallery,
    availability:
      data.availability ?? 'Disponibilités communiquées après prise de contact.',
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
  };
};
