export const CAMPAIGN_CATEGORIES = [
  { id: 'theatre', label: 'Theatre' },
  { id: 'concerts', label: 'Concerts' },
  { id: 'events', label: 'Events' },
  { id: 'art_exhibition', label: 'Art Exhibition' },
  { id: 'film_video', label: 'Film & Video' },
  { id: 'music', label: 'Music' },
  { id: 'photography', label: 'Photography' },
  { id: 'art_design', label: 'Art & Design' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'food_craft', label: 'Food & Craft' },
  { id: 'comics', label: 'Comics' },
] as const;

export type CampaignCategory = typeof CAMPAIGN_CATEGORIES[number]['id'];

export const CATEGORY_LABELS = Object.fromEntries(
  CAMPAIGN_CATEGORIES.map((cat) => [cat.id, cat.label])
);
