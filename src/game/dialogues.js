// NPC dialogue trees for the walkable interiors.
// Each node: { text, options: [{ label, reply, effect }] }.
// effect: { happiness, health, experience, money, log } — applied to the current player.
export const NPC_ROLES = {
  bank: [
    { name: 'Клиент', avatar: '🧑‍💼' },
    { name: 'Менеджер', avatar: '👔' },
    { name: 'Курьер', avatar: '🛵' },
    { name: 'Инвестор', avatar: '🕴️' },
  ],
  office: [
    { name: 'Коллега', avatar: '🧑‍💻' },
    { name: 'Начальник', avatar: '👨‍💼' },
    { name: 'Стажёр', avatar: '🧑‍🎓' },
    { name: 'Клиент', avatar: '🧑‍💼' },
  ],
  casino: [
    { name: 'Крупье', avatar: '🎩' },
    { name: 'Игрок', avatar: '🤑' },
    { name: 'Охранник', avatar: '💪' },
    { name: 'Официантка', avatar: '🍸' },
  ],
  property: [
    { name: 'Супруг(а)', avatar: '💑' },
    { name: 'Ребёнок', avatar: '🧒' },
    { name: 'Сосед', avatar: '🧓' },
    { name: 'Гость', avatar: '🧑‍🤝‍🧑' },
  ],
  business: [
    { name: 'Менеджер', avatar: '👔' },
    { name: 'Клиент', avatar: '🧑‍💼' },
    { name: 'Поставщик', avatar: '🚚' },
    { name: 'Стажёр', avatar: '🧑‍🎓' },
  ],
};

const COMMON = [
  {
    text: 'Привет! Как дела на работе?',
    options: [
      {
        label: 'Всё отлично, двигаюсь вверх',
        reply: 'Молодец! Держи контакт — пригодится.',
        effect: { experience: 1, log: 'полезный контакт (+1 опыт)' },
      },
      {
        label: 'Тяжело, но держусь',
        reply: 'Держись. Иногда главное — просто выспаться.',
        effect: { happiness: 3, health: 1, log: 'поддержка коллеги (+3 счастья)' },
      },
    ],
  },
  {
    text: 'Слышал, ты ищешь новые возможности?',
    options: [
      {
        label: 'Да, расскажи подробнее',
        reply: 'Есть вариант подзаработать. Держи немного за наводку.',
        effect: { money: 600, log: 'подработка по наводке (+$600)' },
      },
      {
        label: 'Нет, мне и так хорошо',
        reply: 'Уважаю. Стабильность тоже сила.',
        effect: { happiness: 2, log: 'спокойный разговор (+2 счастья)' },
      },
    ],
  },
  {
    text: 'Совет бесплатно: не забывай про здоровье.',
    options: [
      {
        label: 'Спасибо, пойду прогуляюсь',
        reply: 'Вот и правильно!',
        effect: { health: 3, happiness: 2, log: 'прогулка (+3 здоровья)' },
      },
      {
        label: 'Мне некогда',
        reply: 'Как знаешь…',
        effect: { happiness: -1, log: 'разговор на бегу (-1 счастье)' },
      },
    ],
  },
];

const BY_ROOM = {
  bank: [
    {
      text: 'Хотите открыть вклад под хороший процент?',
      options: [
        {
          label: 'Да, расскажите',
          reply: 'Оформляйте у стойки — там всё посчитают.',
          effect: { experience: 1, log: 'консультация по вкладам (+1 опыт)' },
        },
        {
          label: 'Я больше про кредиты',
          reply: 'Тогда вам к менеджеру за стойкой.',
          effect: { log: 'узнал про кредиты' },
        },
      ],
    },
    {
      text: 'Очередь сегодня огромная, да?',
      options: [
        {
          label: 'Да, стою уже полчаса',
          reply: 'Терпение — тоже капитал.',
          effect: { happiness: -1, experience: 1, log: 'очередь в банке (+1 опыт)' },
        },
        {
          label: 'Я по записи',
          reply: 'А, тогда вам повезло!',
          effect: { happiness: 1 },
        },
      ],
    },
  ],
  office: [
    {
      text: 'Совещание в три. Придёшь?',
      options: [
        {
          label: 'Конечно, буду',
          reply: 'Отлично, начальник оценит.',
          effect: { experience: 2, happiness: -1, log: 'совещание (+2 опыта)' },
        },
        {
          label: 'У меня дедлайн',
          reply: 'Понимаю. Работа важнее.',
          effect: { experience: 1, log: 'работа над задачей (+1 опыт)' },
        },
      ],
    },
    {
      text: 'Не хочешь помочь с отчётом?',
      options: [
        {
          label: 'Помогу, конечно',
          reply: 'Спасибо! С меня кофе.',
          effect: { experience: 1, happiness: 2, log: 'помог коллеге (+1 опыт)' },
        },
        {
          label: 'В другой раз',
          reply: 'Ладно, справлюсь сам.',
          effect: { happiness: -1 },
        },
      ],
    },
  ],
  casino: [
    {
      text: 'Делаете ставку? Удача сегодня на вашей стороне!',
      options: [
        {
          label: 'Рискну по-крупному',
          reply: 'Смело! Фортуна любит смелых.',
          effect: { money: -400, happiness: 3, log: 'крупная ставка (-$400)' },
        },
        {
          label: 'Лучше понаблюдаю',
          reply: 'Мудро. Бережёте деньги.',
          effect: { happiness: 1, log: 'наблюдение за игрой (+1 счастье)' },
        },
      ],
    },
    {
      text: 'Тут недавно кто-то сорвал джекпот!',
      options: [
        {
          label: 'Правда? Хочу попробовать',
          reply: 'Попробуйте автомат у стены!',
          effect: { money: -200, happiness: 2, log: 'ставка на автомате (-$200)' },
        },
        {
          label: 'Мне и так везёт',
          reply: 'Тогда удача с вами.',
          effect: { happiness: 2 },
        },
      ],
    },
  ],
  property: [
    {
      text: 'Как прошёл день, дорогой?',
      options: [
        {
          label: 'Отлично, много успел',
          reply: 'Я тобой горжусь!',
          effect: { happiness: 5, log: 'семейный вечер (+5 счастья)' },
        },
        {
          label: 'Устал, но рад тебя видеть',
          reply: 'Иди отдохни, я всё сделаю.',
          effect: { happiness: 4, health: 2, log: 'забота близких (+4 счастья)' },
        },
      ],
    },
    {
      text: 'Может, устроим ужин вместе?',
      options: [
        {
          label: 'Давай! Закажем что-нибудь',
          reply: 'Уже заказываю!',
          effect: { money: -300, happiness: 6, log: 'семейный ужин (-$300, +6 счастья)' },
        },
        {
          label: 'Давай просто погуляем',
          reply: 'Хорошо, свежий воздух полезен.',
          effect: { health: 3, happiness: 3, log: 'прогулка с семьёй (+3 здоровья)' },
        },
      ],
    },
  ],
  business: [
    {
      text: 'Клиенты жалуются на сроки. Что делаем?',
      options: [
        {
          label: 'Ускоряемся, беру на себя',
          reply: 'Вот это по-нашему!',
          effect: { experience: 2, happiness: -2, log: 'разрулил сроки (+2 опыта)' },
        },
        {
          label: 'Наймём подрядчика',
          reply: 'Дорого, но качественно.',
          effect: { money: -500, happiness: 2, log: 'нанял подрядчика (-$500)' },
        },
      ],
    },
    {
      text: 'Поставщик предлагает скидку на партию.',
      options: [
        {
          label: 'Берём, конечно',
          reply: 'Отличное решение, сэкономим!',
          effect: { money: 700, log: 'скидка на партию (+$700)' },
        },
        {
          label: 'Сначала проверим качество',
          reply: 'Осторожность — тоже добродетель.',
          effect: { experience: 1, log: 'проверка поставщика (+1 опыт)' },
        },
      ],
    },
  ],
};

export function npcDialogue(roomType, index) {
  const pool = (BY_ROOM[roomType] || BY_ROOM.office).concat(COMMON);
  const node = pool[index % pool.length];
  const role = (NPC_ROLES[roomType] || NPC_ROLES.office)[index % 4];
  return { ...node, name: role.name, avatar: role.avatar };
}

export function applyDialogueEffect(player, effect = {}) {
  const p = { ...player };
  if (effect.money) p.money = Math.round((p.money || 0) + effect.money);
  if (effect.happiness) p.happiness = Math.max(0, Math.min(100, (p.happiness || 0) + effect.happiness));
  if (effect.health) p.health = Math.max(0, Math.min(100, (p.health || 0) + effect.health));
  if (effect.experience) p.experience = (p.experience || 0) + effect.experience;
  return p;
}
