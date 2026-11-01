// Static content: careers, education, businesses, properties, stocks, events, casino games.
export const EDU_LEVELS = [
  { id: 'none', name: 'Без образования', salaryMult: 1, minSalary: 900 },
  { id: 'school', name: 'Школа', salaryMult: 1.35, minSalary: 1500 },
  { id: 'college', name: 'Колледж', salaryMult: 1.8, minSalary: 2400 },
  { id: 'university', name: 'Университет', salaryMult: 2.5, minSalary: 4200 },
  { id: 'mba', name: 'MBA', salaryMult: 3.4, minSalary: 7000 },
];

export const EDU_COST = {
  school: { cost: 0, months: 2, title: 'Школа' },
  college: { cost: 4000, months: 3, title: 'Колледж' },
  university: { cost: 12000, months: 5, title: 'Университет' },
  mba: { cost: 26000, months: 6, title: 'MBA' },
};

export const CAREERS = [
  { id: 'barista', name: 'Бариста', base: 1500, edu: 'none', icon: '☕', mini: 'coffee' },
  { id: 'courier', name: 'Курьер', base: 1300, edu: 'none', icon: '🛵', mini: 'coffee' },
  { id: 'teacher', name: 'Учитель', base: 2600, edu: 'college', icon: '🧑‍🏫', mini: 'quiz' },
  { id: 'nurse', name: 'Медсестра', base: 2800, edu: 'college', icon: '🩺', mini: 'quiz' },
  { id: 'engineer', name: 'Инженер', base: 4600, edu: 'university', icon: '⚙️', mini: 'code' },
  { id: 'developer', name: 'Разработчик', base: 5200, edu: 'university', icon: '💻', mini: 'code' },
  { id: 'designer', name: 'Дизайнер', base: 4200, edu: 'college', icon: '🎨', mini: 'code' },
  { id: 'chef', name: 'Шеф-повар', base: 3800, edu: 'college', icon: '👨‍🍳', mini: 'coffee' },
  { id: 'broker', name: 'Брокер', base: 6000, edu: 'university', icon: '📊', mini: 'trade' },
  { id: 'director', name: 'Директор', base: 9000, edu: 'mba', icon: '🧑‍💼', mini: 'trade' },
  { id: 'ceo', name: 'CEO корпорации', base: 15000, edu: 'mba', icon: '👑', mini: 'trade' },
];

export const CAREER_BY_ID = CAREERS.reduce((a, c) => ((a[c.id] = c), a), {});

export const BUSINESSES = {
  coffee: { id: 'coffee', name: 'Кофейня', icon: '☕', price: 18000, income: 950, upkeep: 300, risk: 0.15, color: '#c98a4b' },
  shop: { id: 'shop', name: 'Магазин', icon: '🛍️', price: 34000, income: 1750, upkeep: 600, risk: 0.18, color: '#5aa9e6' },
  startup: { id: 'startup', name: 'Тех-стартап', icon: '🚀', price: 60000, income: 3200, upkeep: 1400, risk: 0.35, color: '#9b6bff' },
  gym: { id: 'gym', name: 'Фитнес-клуб', icon: '🏋️', price: 42000, income: 2100, upkeep: 800, risk: 0.2, color: '#ff7a59' },
  restaurant: { id: 'restaurant', name: 'Ресторан', icon: '🍽️', price: 70000, income: 3600, upkeep: 1500, risk: 0.25, color: '#e8b04b' },
  techpark: { id: 'techpark', name: 'Технопарк', icon: '🏗️', price: 120000, income: 6800, upkeep: 2600, risk: 0.3, color: '#4dd2ff' },
};

export const PROPERTIES = {
  studio: { id: 'studio', name: 'Студия', icon: '🏢', price: 22000, rent: 420, color: '#8e7cc3' },
  house: { id: 'house', name: 'Загородный дом', icon: '🏠', price: 45000, rent: 900, color: '#7cb342' },
  penthouse: { id: 'penthouse', name: 'Пентхаус', icon: '🌆', price: 90000, rent: 1900, color: '#4fc3f7' },
  villa: { id: 'villa', name: 'Вилла у моря', icon: '🏖️', price: 160000, rent: 3400, color: '#ffb74d' },
};

export const STOCKS = [
  { id: 'tech', name: 'NEXUS Tech', volatility: 0.16, base: 120, color: '#4dd2ff' },
  { id: 'energy', name: 'Volt Energy', volatility: 0.11, base: 85, color: '#ffd166' },
  { id: 'food', name: 'FreshFood', volatility: 0.07, base: 60, color: '#8cff8c' },
  { id: 'space', name: 'Orbit Space', volatility: 0.24, base: 210, color: '#c9a0ff' },
];

export const EVENTS = [
  { id: 'bonus', text: 'Премия от руководства!', money: 2500 },
  { id: 'fine', text: 'Штраф за парковку', money: -600 },
  { id: 'found', text: 'Нашёл кошелёк на улице', money: 900 },
  { id: 'repair', text: 'Сломался телефон', money: -1200 },
  { id: 'gift', text: 'Родственники подарили деньги', money: 1800 },
  { id: 'medical', text: 'Счёт из клиники', money: -1500 },
  { id: 'royalty', text: 'Авторские отчисления', money: 3200 },
  { id: 'tax', text: 'Доплата по налогам', money: -2000 },
  { id: 'lottery', text: 'Мелкий выигрыш в лотерею', money: 1400 },
  { id: 'invest', text: 'Удачная инвестиция друга', money: 2200 },
  { id: 'theft', text: 'Украли велосипед', money: -800 },
  { id: 'party', text: 'Вечеринка удалась, но дорого', money: -1000 },
];

export const CASINO_GAMES = [
  { id: 'slots', name: 'Слоты', icon: '🎰', desc: '3 барабана, до x20' },
  { id: 'roulette', name: 'Рулетка', icon: '🎡', desc: 'Красное / чёрное / число' },
  { id: 'dice', name: 'Кости', icon: '🎲', desc: 'Больше / меньше 7' },
  { id: 'blackjack', name: 'Блэкджек', icon: '🃏', desc: 'Набери 21' },
];

export const ENTERTAINMENT = [
  { id: 'cinema', name: 'Кино', icon: '🎬', cost: 400, happiness: 8 },
  { id: 'park', name: 'Парк аттракционов', icon: '🎡', cost: 700, happiness: 12 },
  { id: 'spa', name: 'СПА', icon: '💆', cost: 1200, happiness: 16 },
  { id: 'concert', name: 'Концерт', icon: '🎤', cost: 900, happiness: 14 },
];

export const AVATARS = ['🧑‍💼', '👩‍💼', '🧑‍🎤', '👨‍🎨', '👩‍🔬', '🧑‍🚀', '👩‍🍳', '🧑‍🌾'];

export const NAMES = ['Алекс', 'Мария', 'Тимур', 'Дина', 'Игорь', 'Айгуль', 'Марк', 'Лейла'];
