// suggestedPct = % recomandat din bugetul lunar total
export const CATEGORIES = [
  { id: 'mancare',       name: 'Mâncare',       icon: '🍔', color: '#f97316', suggestedPct: 25 },
  { id: 'transport',     name: 'Transport',      icon: '🚗', color: '#3b82f6', suggestedPct: 15 },
  { id: 'facturi',       name: 'Facturi',        icon: '🏠', color: '#8b5cf6', suggestedPct: 20 },
  { id: 'cumparaturi',   name: 'Cumpărături',    icon: '🛍️', color: '#ec4899', suggestedPct: 10 },
  { id: 'divertisment',  name: 'Divertisment',   icon: '🎬', color: '#14b8a6', suggestedPct: 8  },
  { id: 'sanatate',      name: 'Sănătate',       icon: '💊', color: '#ef4444', suggestedPct: 5  },
  { id: 'educatie',      name: 'Educație',       icon: '📚', color: '#06b6d4', suggestedPct: 5  },
  { id: 'sport',         name: 'Sport',          icon: '🏋️', color: '#22c55e', suggestedPct: 4  },
  { id: 'economii',      name: 'Economii',       icon: '💰', color: '#eab308', suggestedPct: 0  },
  { id: 'altele',        name: 'Altele',         icon: '✨', color: '#6b7280', suggestedPct: 8  },
];

export const INCOME_CATEGORIES = [
  { id: 'salariu',    name: 'Salariu',      icon: '💼', color: '#22c55e' },
  { id: 'freelance',  name: 'Freelance',    icon: '💻', color: '#14b8a6' },
  { id: 'investitii', name: 'Investiții',   icon: '📈', color: '#3b82f6' },
  { id: 'cadou',      name: 'Cadou',        icon: '🎁', color: '#ec4899' },
  { id: 'altele_v',   name: 'Altele',       icon: '✨', color: '#6b7280' },
];

export function getCategoryById(id) {
  return (
    CATEGORIES.find((c) => c.id === id) ||
    INCOME_CATEGORIES.find((c) => c.id === id) ||
    { id, name: id, icon: '❓', color: '#6b7280' }
  );
}
