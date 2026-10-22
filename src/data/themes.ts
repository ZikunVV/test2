import { ThemeConfig, GradientId, BackgroundMode } from '../types';

export const LIGHT_LAVENDER_THEME: ThemeConfig = {
  id: 'light_lavender',
  number: 1,
  name: 'Светлая лаванда',
  nameEn: 'Light Lavender Scandinavian',
  badge: 'Выбранный базовый стиль',
  paletteRef: 'Образец №1 из фото 2 (#E9E1F7, #B79BE8, #7652B5)',
  description: 'Чистый, воздушный скандинавский интерфейс со светло-лавандовым сайдбаром, белоснежными карточками и акцентными градиентами от светлого к тёмному.',
  hexCodes: ['#F3EEFA', '#B79BE8', '#7652B5', '#FFFFFF'],
  keyColors: {
    sidebarBg: '#F3EEFA',
    sidebarText: '#4A3D63',
    sidebarHover: '#ECE3F8',
    accent: '#7652B5',
    canvasBg: '#FAF8FD',
    cardBg: '#FFFFFF',
    cardBorder: '#EBE3F7',
    textPrimary: '#251B38',
    textSecondary: '#6B5E83',
  },
  stylingPhilosophy:
    'Светлый лавандовый сайдбар (#F3EEFA) снимает ощущение тяжести черного цвета. Активные элементы теперь выделены не плоским одним цветом, а градиентом от светлого к тёмному, придающим объем и глубину.',
  improvementsOverOriginal: [
    'Сайдбар оформлен в легкой воздушной лаванде (#F3EEFA) вместо грубого черного блока',
    'Кнопка «+ Заявка» и активный пункт меню переливаются от светлого к тёмному',
    'Улучшен визуальный объем: мягкие тени и деликатные градиентные переходы',
    'Превосходная дневная читаемость данных и статусов ЖКХ',
  ],
};

const PALETTE_THEMES: Record<GradientId, {
  name: string;
  nameEn: string;
  keyColors: ThemeConfig['keyColors'];
  hexCodes: string[];
}> = {
  amethyst_dawn: {
    name: 'Аметистовый рассвет',
    nameEn: 'Orchid Glow to Royal Plum',
    keyColors: {
      sidebarBg: '#F3E8FF',
      sidebarText: '#3B0764',
      sidebarHover: '#E9D5FF',
      accent: '#9333EA',
      canvasBg: '#FAF5FF',
      cardBg: '#FFFFFF',
      cardBorder: '#E9D5FF',
      textPrimary: '#2E1065',
      textSecondary: '#6B21A8',
    },
    hexCodes: ['#F3E8FF', '#9333EA', '#FAF5FF', '#2E1065'],
  },
  soft_to_deep: {
    name: 'Лавандовый бархат',
    nameEn: 'Soft Lilac to Deep Violet',
    keyColors: {
      sidebarBg: '#F3EEFA',
      sidebarText: '#4A3D63',
      sidebarHover: '#ECE3F8',
      accent: '#7652B5',
      canvasBg: '#FAF8FD',
      cardBg: '#FFFFFF',
      cardBorder: '#EBE3F7',
      textPrimary: '#251B38',
      textSecondary: '#6B5E83',
    },
    hexCodes: ['#F3EEFA', '#7652B5', '#FAF8FD', '#251B38'],
  },
  lavender_indigo: {
    name: 'Лазурная лаванда в Индиго',
    nameEn: 'Sky Lavender to Tech Indigo',
    keyColors: {
      sidebarBg: '#EAEFFE',
      sidebarText: '#1E1B4B',
      sidebarHover: '#DDE5FD',
      accent: '#4F46E5',
      canvasBg: '#F4F6FF',
      cardBg: '#FFFFFF',
      cardBorder: '#D5DEFC',
      textPrimary: '#1E1B4B',
      textSecondary: '#3730A3',
    },
    hexCodes: ['#EAEFFE', '#4F46E5', '#F4F6FF', '#1E1B4B'],
  },
  pearl_ombre: {
    name: 'Перламутровый омбре',
    nameEn: 'Soft Mist to Rich Violet',
    keyColors: {
      sidebarBg: '#F1EFF8',
      sidebarText: '#362C4A',
      sidebarHover: '#E7E3F2',
      accent: '#6B539A',
      canvasBg: '#F9F8FC',
      cardBg: '#FFFFFF',
      cardBorder: '#E6E1F2',
      textPrimary: '#221932',
      textSecondary: '#5A4D73',
    },
    hexCodes: ['#F1EFF8', '#6B539A', '#F9F8FC', '#221932'],
  },
  emerald_mint: {
    name: 'Изумрудная мята',
    nameEn: 'Emerald Mint to Forest Teal',
    keyColors: {
      sidebarBg: '#DCFCE7',
      sidebarText: '#064E3B',
      sidebarHover: '#BBF7D0',
      accent: '#059669',
      canvasBg: '#F0FDF4',
      cardBg: '#FFFFFF',
      cardBorder: '#BBF7D0',
      textPrimary: '#022C22',
      textSecondary: '#047857',
    },
    hexCodes: ['#DCFCE7', '#059669', '#F0FDF4', '#022C22'],
  },
  amber_sunset: {
    name: 'Янтарный закат',
    nameEn: 'Warm Amber to Coral Flame',
    keyColors: {
      sidebarBg: '#FEF3C7',
      sidebarText: '#78350F',
      sidebarHover: '#FDE68A',
      accent: '#D97706',
      canvasBg: '#FFFBEB',
      cardBg: '#FFFFFF',
      cardBorder: '#FDE68A',
      textPrimary: '#451A03',
      textSecondary: '#92400E',
    },
    hexCodes: ['#FEF3C7', '#D97706', '#FFFBEB', '#451A03'],
  },
  night_sapphire: {
    name: 'Ночной сапфир',
    nameEn: 'Sky Blue to Deep Sapphire',
    keyColors: {
      sidebarBg: '#E0F2FE',
      sidebarText: '#0C4A6E',
      sidebarHover: '#BAE6FD',
      accent: '#2563EB',
      canvasBg: '#F0F9FF',
      cardBg: '#FFFFFF',
      cardBorder: '#BAE6FD',
      textPrimary: '#082F49',
      textSecondary: '#0369A1',
    },
    hexCodes: ['#E0F2FE', '#2563EB', '#F0F9FF', '#082F49'],
  },
  ruby_crimson: {
    name: 'Рубиновый рассвет',
    nameEn: 'Rose Glow to Crimson Ruby',
    keyColors: {
      sidebarBg: '#FFE4E6',
      sidebarText: '#881337',
      sidebarHover: '#FECDD3',
      accent: '#E11D48',
      canvasBg: '#FFF1F2',
      cardBg: '#FFFFFF',
      cardBorder: '#FECDD3',
      textPrimary: '#4C0519',
      textSecondary: '#9F1239',
    },
    hexCodes: ['#FFE4E6', '#E11D48', '#FFF1F2', '#4C0519'],
  },
  arctic_teal: {
    name: 'Арктическая бирюза',
    nameEn: 'Aqua Mint to Deep Ocean',
    keyColors: {
      sidebarBg: '#CCFBF1',
      sidebarText: '#134E4A',
      sidebarHover: '#99F6E4',
      accent: '#0D9488',
      canvasBg: '#F0FDFA',
      cardBg: '#FFFFFF',
      cardBorder: '#99F6E4',
      textPrimary: '#042F2E',
      textSecondary: '#115E59',
    },
    hexCodes: ['#CCFBF1', '#0D9488', '#F0FDFA', '#042F2E'],
  },
  nordic_slate: {
    name: 'Скандинавский графит',
    nameEn: 'Silver Mist to Nordic Slate',
    keyColors: {
      sidebarBg: '#F1F5F9',
      sidebarText: '#0F172A',
      sidebarHover: '#E2E8F0',
      accent: '#475569',
      canvasBg: '#F8FAFC',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textPrimary: '#020617',
      textSecondary: '#334155',
    },
    hexCodes: ['#F1F5F9', '#475569', '#F8FAFC', '#020617'],
  },
  royal_purple: {
    name: 'Королевский пурпур',
    nameEn: 'Lilac Frost to Imperial Purple',
    keyColors: {
      sidebarBg: '#F3E8FF',
      sidebarText: '#3B0764',
      sidebarHover: '#E9D5FF',
      accent: '#7E22CE',
      canvasBg: '#FAF5FF',
      cardBg: '#FFFFFF',
      cardBorder: '#D8B4FE',
      textPrimary: '#240046',
      textSecondary: '#581C87',
    },
    hexCodes: ['#F3E8FF', '#7E22CE', '#FAF5FF', '#240046'],
  },
  warm_sand: {
    name: 'Золотой песок и кофе',
    nameEn: 'Sand Gold to Deep Espresso',
    keyColors: {
      sidebarBg: '#F2EAE1',
      sidebarText: '#3D2710',
      sidebarHover: '#E7DAD0',
      accent: '#9A6A38',
      canvasBg: '#FAF7F2',
      cardBg: '#FFFFFF',
      cardBorder: '#E4D5C5',
      textPrimary: '#281708',
      textSecondary: '#6B4D2E',
    },
    hexCodes: ['#F2EAE1', '#9A6A38', '#FAF7F2', '#281708'],
  },
  dark_night: {
    name: 'Тёмная ночь (Dark Mode)',
    nameEn: 'Electric Indigo to Midnight Obsidian',
    keyColors: {
      sidebarBg: '#111827',
      sidebarText: '#F3F4F6',
      sidebarHover: '#1F2937',
      accent: '#6366F1',
      canvasBg: '#0B0F19',
      cardBg: '#1F2937',
      cardBorder: '#374151',
      textPrimary: '#F9FAFB',
      textSecondary: '#9CA3AF',
    },
    hexCodes: ['#111827', '#6366F1', '#0B0F19', '#F9FAFB'],
  },
  mint_lime: {
    name: 'Мятный лайм и цитрус',
    nameEn: 'Fresh Mint to Bright Citrus',
    keyColors: {
      sidebarBg: '#D1FAE5',
      sidebarText: '#064E3B',
      sidebarHover: '#A7F3D0',
      accent: '#059669',
      canvasBg: '#ECFDF5',
      cardBg: '#FFFFFF',
      cardBorder: '#A7F3D0',
      textPrimary: '#022C22',
      textSecondary: '#047857',
    },
    hexCodes: ['#D1FAE5', '#059669', '#ECFDF5', '#022C22'],
  },
  ocean_azure: {
    name: 'Океаническая лазурь',
    nameEn: 'Azure Wave to Deep Abyss',
    keyColors: {
      sidebarBg: '#E0F2FE',
      sidebarText: '#082F49',
      sidebarHover: '#BAE6FD',
      accent: '#0284C7',
      canvasBg: '#F0F9FF',
      cardBg: '#FFFFFF',
      cardBorder: '#BAE6FD',
      textPrimary: '#082F49',
      textSecondary: '#0369A1',
    },
    hexCodes: ['#E0F2FE', '#0284C7', '#F0F9FF', '#082F49'],
  },
  marsala_wine: {
    name: 'Винная марсала и бордо',
    nameEn: 'Rose Quartz to Royal Marsala',
    keyColors: {
      sidebarBg: '#FFE4E6',
      sidebarText: '#4C0519',
      sidebarHover: '#FECDD3',
      accent: '#BE123C',
      canvasBg: '#FFF1F2',
      cardBg: '#FFFFFF',
      cardBorder: '#FECDD3',
      textPrimary: '#4C0519',
      textSecondary: '#9F1239',
    },
    hexCodes: ['#FFE4E6', '#BE123C', '#FFF1F2', '#4C0519'],
  },
  aurora_green: {
    name: 'Северное сияние',
    nameEn: 'Neon Aurora to Celestial Violet',
    keyColors: {
      sidebarBg: '#E0E7FF',
      sidebarText: '#1E1B4B',
      sidebarHover: '#C7D2FE',
      accent: '#6366F1',
      canvasBg: '#F5F3FF',
      cardBg: '#FFFFFF',
      cardBorder: '#C7D2FE',
      textPrimary: '#1E1B4B',
      textSecondary: '#4338CA',
    },
    hexCodes: ['#E0E7FF', '#6366F1', '#F5F3FF', '#1E1B4B'],
  },
  honey_caramel: {
    name: 'Медовый янтарь и карамель',
    nameEn: 'Golden Honey to Rich Caramel',
    keyColors: {
      sidebarBg: '#FEF9C3',
      sidebarText: '#713F12',
      sidebarHover: '#FEF08A',
      accent: '#CA8A04',
      canvasBg: '#FEFCE8',
      cardBg: '#FFFFFF',
      cardBorder: '#FEF08A',
      textPrimary: '#422006',
      textSecondary: '#854D0E',
    },
    hexCodes: ['#FEF9C3', '#CA8A04', '#FEFCE8', '#422006'],
  },
  pine_forest: {
    name: 'Малахитовая хвоя',
    nameEn: 'Spring Sage to Deep Pine',
    keyColors: {
      sidebarBg: '#DCFCE7',
      sidebarText: '#14532D',
      sidebarHover: '#BBF7D0',
      accent: '#16A34A',
      canvasBg: '#F0FDF4',
      cardBg: '#FFFFFF',
      cardBorder: '#BBF7D0',
      textPrimary: '#052E16',
      textSecondary: '#15803D',
    },
    hexCodes: ['#DCFCE7', '#16A34A', '#F0FDF4', '#052E16'],
  },
  coral_peach: {
    name: 'Коралловый персик',
    nameEn: 'Pastel Peach to Coral Terracotta',
    keyColors: {
      sidebarBg: '#FFEDD5',
      sidebarText: '#7C2D12',
      sidebarHover: '#FED7AA',
      accent: '#EA580C',
      canvasBg: '#FFF7ED',
      cardBg: '#FFFFFF',
      cardBorder: '#FED7AA',
      textPrimary: '#431407',
      textSecondary: '#C2410C',
    },
    hexCodes: ['#FFEDD5', '#EA580C', '#FFF7ED', '#431407'],
  },
  smoky_rose: {
    name: 'Дымчатая роза и кварц',
    nameEn: 'Powder Rose to Deep Amethyst',
    keyColors: {
      sidebarBg: '#FCE7F3',
      sidebarText: '#701A75',
      sidebarHover: '#FBCFE8',
      accent: '#C026D3',
      canvasBg: '#FDF2F8',
      cardBg: '#FFFFFF',
      cardBorder: '#FBCFE8',
      textPrimary: '#4A044E',
      textSecondary: '#A21CAF',
    },
    hexCodes: ['#FCE7F3', '#C026D3', '#FDF2F8', '#4A044E'],
  },
  cyber_violet: {
    name: 'Неоновый киберпанк',
    nameEn: 'Electric Cyan to Neon Violet',
    keyColors: {
      sidebarBg: '#F3E8FF',
      sidebarText: '#3B0764',
      sidebarHover: '#E9D5FF',
      accent: '#9333EA',
      canvasBg: '#FAF5FF',
      cardBg: '#FFFFFF',
      cardBorder: '#D8B4FE',
      textPrimary: '#2E1065',
      textSecondary: '#6B21A8',
    },
    hexCodes: ['#F3E8FF', '#9333EA', '#FAF5FF', '#2E1065'],
  },
  platinum_steel: {
    name: 'Платина и титановый сланец',
    nameEn: 'Pure Platinum to Titanium Slate',
    keyColors: {
      sidebarBg: '#F1F5F9',
      sidebarText: '#0F172A',
      sidebarHover: '#E2E8F0',
      accent: '#475569',
      canvasBg: '#F8FAFC',
      cardBg: '#FFFFFF',
      cardBorder: '#CBD5E1',
      textPrimary: '#020617',
      textSecondary: '#334155',
    },
    hexCodes: ['#F1F5F9', '#475569', '#F8FAFC', '#020617'],
  },
};

export function getThemeForPalette(
  gradientId: GradientId,
  bgMode: BackgroundMode = 'palette'
): ThemeConfig {
  const base = PALETTE_THEMES[gradientId] || PALETTE_THEMES.amethyst_dawn;

  let keyColors = { ...base.keyColors };

  // Allow customized or fixed site background modes
  if (bgMode === 'lavender') {
    keyColors.canvasBg = '#FAF8FD';
    keyColors.sidebarBg = '#F3EEFA';
    keyColors.cardBg = '#FFFFFF';
    keyColors.cardBorder = '#EBE3F7';
  } else if (bgMode === 'scandinavian') {
    keyColors.canvasBg = '#F8FAFC';
    keyColors.cardBg = '#FFFFFF';
    keyColors.cardBorder = '#E2E8F0';
  } else if (bgMode === 'warm_ivory') {
    keyColors.canvasBg = '#FAF6F0';
    keyColors.sidebarBg = '#F5EFE6';
    keyColors.cardBg = '#FFFFFF';
    keyColors.cardBorder = '#EDE4D8';
  } else if (bgMode === 'soft_mint') {
    keyColors.canvasBg = '#F0FDF4';
    keyColors.sidebarBg = '#DCFCE7';
    keyColors.cardBg = '#FFFFFF';
    keyColors.cardBorder = '#BBF7D0';
  } else if (bgMode === 'ice_sky') {
    keyColors.canvasBg = '#F0F9FF';
    keyColors.sidebarBg = '#E0F2FE';
    keyColors.cardBg = '#FFFFFF';
    keyColors.cardBorder = '#BAE6FD';
  } else if (bgMode === 'dark_slate' || gradientId === 'dark_night') {
    keyColors.canvasBg = '#0B0F19';
    keyColors.sidebarBg = '#111827';
    keyColors.sidebarHover = '#1F2937';
    keyColors.sidebarText = '#F3F4F6';
    keyColors.cardBg = '#1F2937';
    keyColors.cardBorder = '#374151';
    keyColors.textPrimary = '#F9FAFB';
    keyColors.textSecondary = '#9CA3AF';
  }

  return {
    id: `theme_${gradientId}_${bgMode}`,
    number: 1,
    name: base.name,
    nameEn: base.nameEn,
    badge: 'Адаптивный стиль палитры',
    paletteRef: `${base.name} (${bgMode})`,
    description: `Цветовой режим с фоном ${keyColors.canvasBg} и акцентами ${keyColors.accent}`,
    hexCodes: base.hexCodes,
    keyColors,
    stylingPhilosophy: 'Гармоничное сочетание фона сайта, сайдбара и карточек с выбранной палитрой.',
    improvementsOverOriginal: [
      'Полная синхронизация фона сайта с палитрой',
      'Высокая контрастность для защиты зрения',
      'Плавные переходы и мягкие тени',
    ],
  };
}
