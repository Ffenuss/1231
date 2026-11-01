// Board definition: 7x7 ring of tiles (24 cells) + the board geometry used by the 3D scene.
export const BOARD_SIZE = 7; // cells per side of the ring grid
export const CELL = 5.2; // world units per cell
export const RING = 24;

// Ring order goes clockwise starting bottom-left corner.
// type: category; label: title; icon: short glyph; price: purchase price for property/business
export const TILES = [
  { i: 0, type: 'start', label: 'Старт', icon: '🏁', desc: 'Получите зарплату и бонус за круг' },
  { i: 1, type: 'education', label: 'Школа', icon: '📚', desc: 'Базовое образование' },
  { i: 2, type: 'education', label: 'Университет', icon: '🎓', desc: 'Высшее образование' },
  { i: 3, type: 'career', label: 'Биржа труда', icon: '💼', desc: 'Найти работу' },
  { i: 4, type: 'property', label: 'Квартира', icon: '🏢', desc: 'Студия у парка', price: 22000, rent: 420 },
  { i: 5, type: 'event', label: 'Событие', icon: '🎲', desc: 'Случайное событие' },
  { i: 6, type: 'casino', label: 'Казино', icon: '🎰', desc: 'Испытай удачу' },
  { i: 7, type: 'entertainment', label: 'Развлечения', icon: '🎡', desc: 'Парк аттракционов' },
  { i: 8, type: 'business', label: 'Кофейня', icon: '☕', desc: 'Стартовый бизнес', price: 18000, income: 950 },
  { i: 9, type: 'bank', label: 'Банк', icon: '🏦', desc: 'Кредиты и вклады' },
  { i: 10, type: 'life', label: 'Свидание', icon: '💕', desc: 'Личная жизнь' },
  { i: 11, type: 'tax', label: 'Налоговая', icon: '🧾', desc: 'Налоги и сборы' },
  { i: 12, type: 'jail', label: 'Тюрьма', icon: '🚔', desc: 'Пропуск хода' },
  { i: 13, type: 'property', label: 'Дом', icon: '🏠', desc: 'Загородный дом', price: 45000, rent: 900 },
  { i: 14, type: 'career', label: 'Офис', icon: '🏙️', desc: 'Повышение квалификации' },
  { i: 15, type: 'business', label: 'Магазин', icon: '🛍️', desc: 'Розничная сеть', price: 34000, income: 1750 },
  { i: 16, type: 'event', label: 'Событие', icon: '🎲', desc: 'Случайное событие' },
  { i: 17, type: 'property', label: 'Пентхаус', icon: '🌆', desc: 'Вид на весь город', price: 90000, rent: 1900 },
  { i: 18, type: 'entertainment', label: 'Кинотеатр', icon: '🎬', desc: 'Премьера фильма' },
  { i: 19, type: 'business', label: 'Тех-стартап', icon: '🚀', desc: 'Высокий риск, высокий доход', price: 60000, income: 3200 },
  { i: 20, type: 'life', label: 'Семья', icon: '👨‍👩‍👧', desc: 'Создать семью' },
  { i: 21, type: 'bank', label: 'Инвестиции', icon: '📈', desc: 'Фонд и акции' },
  { i: 22, type: 'casino', label: 'Лотерея', icon: '🎟️', desc: 'Джекпот' },
  { i: 23, type: 'career', label: 'Бизнес-центр', icon: '🧑‍💼', desc: 'Собеседование' },
];

export const TILE_BY_INDEX = TILES.reduce((acc, t) => {
  acc[t.i] = t;
  return acc;
}, {});

// Grid coordinates on a 7x7 ring (0..6). Bottom-left corner is (0,6) in grid terms;
// we convert to world coordinates where x goes right, z goes "down" (towards camera).
export function tileGridPos(i) {
  const n = BOARD_SIZE - 1; // 6
  const side = n; // cells per side segment
  if (i <= side) return { gx: i, gz: n }; // bottom row, left -> right
  if (i <= side * 2) return { gx: n, gz: n - (i - side) }; // right column, bottom -> top
  if (i <= side * 3) return { gx: n - (i - side * 2), gz: 0 }; // top row, right -> left
  return { gx: 0, gz: i - side * 3 }; // left column, top -> bottom
}

export function tileWorldPos(i) {
  const { gx, gz } = tileGridPos(i);
  const half = (BOARD_SIZE - 1) / 2;
  return {
    x: (gx - half) * CELL,
    z: (gz - half) * CELL,
  };
}

export function tileRotation(i) {
  // rotation so that the "front" of a tile faces the board centre
  const { gx, gz } = tileGridPos(i);
  const half = (BOARD_SIZE - 1) / 2;
  if (gz === BOARD_SIZE - 1) return 0; // bottom row faces up (-z)
  if (gx === BOARD_SIZE - 1) return Math.PI / 2;
  if (gz === 0) return Math.PI;
  return -Math.PI / 2;
}

export const BOARD_HALF = ((BOARD_SIZE - 1) * CELL) / 2;
