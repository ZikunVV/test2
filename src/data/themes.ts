import { ThemeConfig } from '../types';

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
