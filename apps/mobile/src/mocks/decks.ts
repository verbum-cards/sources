import type { DeckContext, Deck as DeckMeta } from '@cards/contracts';

import { wordByLemma, type MockWord } from './words';

// Колоды под жизненные ситуации (docs/product.md, skill deck-authoring).
// Настоящего словаря и конвейера колод ещё нет (data/ и apps/api удалены,
// см. docs/decisions.md) — набор придуман вручную, по тому же принципу, что и
// mocks/words.ts. Из списка 7 колод беты (skill deck-authoring →
// «Колоды беты», ADR-22 — «Такси» перенесено туда из «к публичному релизу»)
// здесь шесть: «Ресторан и кафе», «Отель», «Аэропорт и перелёт», «Такси»,
// «Как пройти», «Знакомство и small talk» (в скилле это одна колода, не две —
// разделять «знакомство» и «small talk» не стали, слишком тесно связаны). Не
// хватает только «Мнение и обсуждение». Меньше элементов на колоду, чем
// полный чек-лист скилла (25–50, доля выражений ≥30%) — осознанное сокращение
// для первой версии, не ошибка: 12–15 на колоду, доля выражений всё равно
// держится ≥30%.
//
// goalTags (ADR-24, decks.screen.tsx группирует каталог по ним) — не только
// «travel»: у всех ситуационных колод добавлен «work» там, где это реальный
// сценарий (деловая поездка — тот же ресторан/отель/аэропорт/такси, что и в
// отпуске), «move» — там, где лексика нужна переехавшему (ориентация в новом
// городе, знакомство с соседями). Без искусственных тегов ради разнообразия
// групп — «games»/«tech»/«exam»/«media» этим колодам не подходят.
export interface DeckWord extends MockWord {
  importance: 1 | 2 | 3;
}

export type MockDeck = DeckMeta & { items: readonly DeckWord[] };

interface DeckItemRef {
  lemma: string;
  importance: 1 | 2 | 3;
}

// Разворачивает ссылки {lemma, importance} в полные DeckWord — слово само по
// себе описано один раз в WORDS (mocks/words.ts), колода лишь ссылается на
// него по лемме и добавляет свой вес важности внутри этой конкретной колоды.
function resolveDeckItems(refs: readonly DeckItemRef[]): readonly DeckWord[] {
  return refs.map((ref) => ({ ...wordByLemma(ref.lemma), importance: ref.importance }));
}

const restaurantContext: DeckContext = {
  situation: 'Ужин в ресторане среднего уровня, вечер',
  roles: {
    learner: 'гость',
    partner: 'официант',
    learnerGoal: 'заказать, уточнить про аллергию, расплатиться',
    partnerGoal: 'обслужить и предложить блюда',
  },
  register: 'polite',
  branches: ['заказ', 'аллергия', 'ошибка в счёте', 'разделить счёт'],
  cultureNotes: [
    'В США чаевые 15–20% ожидаются, в Великобритании часто уже включены в счёт как service charge',
  ],
};

const hotelContext: DeckContext = {
  situation: 'Заселение и проживание в отеле, стандартный номер',
  roles: {
    learner: 'гость',
    partner: 'администратор',
    learnerGoal: 'заселиться, решить вопрос с номером, продлить или вовремя выехать',
    partnerGoal: 'заселить гостя и решить его вопросы',
  },
  register: 'polite',
  branches: [
    'заселение',
    'проблема с номером',
    'просьба о позднем выезде',
    'дополнительные услуги',
  ],
  cultureNotes: [
    'В США чаевые горничной — обычно $1–2 за ночь, оставляют наличными в номере',
    'В Великобритании завтрак часто указывается отдельно от стоимости номера («room only» vs «bed and breakfast»)',
  ],
};

const airportContext: DeckContext = {
  situation: 'Регистрация на рейс, посадка и перелёт',
  roles: {
    learner: 'пассажир',
    partner: 'сотрудник авиакомпании',
    learnerGoal: 'пройти регистрацию, найти выход на посадку, решить проблему с багажом',
    partnerGoal: 'оформить пассажира и обеспечить посадку по расписанию',
  },
  register: 'polite',
  branches: [
    'регистрация и посадочный талон',
    'багаж потерян или повреждён',
    'задержка или отмена рейса',
    'просьба о другом месте',
  ],
  cultureNotes: [
    'На международный рейс на регистрацию обычно приходят за 2–3 часа до вылета',
    'При пересадке с международного рейса в США часто нужно заново пройти паспортный контроль и сдать багаж',
  ],
};

const taxiContext: DeckContext = {
  situation: 'Поездка на такси — заказ, объяснение маршрута, оплата',
  roles: {
    learner: 'пассажир',
    partner: 'водитель такси',
    learnerGoal: 'заказать такси, назвать адрес, уточнить цену, расплатиться',
    partnerGoal: 'довезти до места и получить оплату',
  },
  register: 'polite',
  branches: ['заказ такси', 'объяснение маршрута или адреса', 'обсуждение цены', 'оплата и чаевые'],
  cultureNotes: [
    'В США принято округлять оплату такси в большую сторону и добавлять чаевые 10–15%',
    'В Великобритании чёрные такси (black cabs) можно останавливать прямо на улице, а не только заказывать заранее',
  ],
};

const directionsContext: DeckContext = {
  situation: 'Спросить дорогу на улице у прохожего и понять объяснение маршрута пешком',
  roles: {
    learner: 'прохожий, который спрашивает дорогу',
    partner: 'местный житель',
    learnerGoal: 'узнать, как дойти до места, понять объяснение и переспросить, если не понял',
    partnerGoal: 'объяснить маршрут понятно',
  },
  register: 'polite',
  branches: [
    'спросить дорогу',
    'не понял объяснение, переспросить',
    'ориентиры (памятники, магазины)',
    'пешком или на транспорте',
  ],
  cultureNotes: [
    'В англоязычных странах расстояние часто объясняют в минутах ходьбы, а не в километрах',
    'Попросить повторить объяснение («Could you repeat that?») — это нормально, а не невежливо',
  ],
};

const smallTalkContext: DeckContext = {
  situation: 'Знакомство с новым человеком и лёгкий разговор ни о чём (small talk)',
  roles: {
    learner: 'один из собеседников',
    partner: 'новый знакомый',
    learnerGoal: 'представиться, поддержать лёгкий разговор, вежливо завершить беседу',
    partnerGoal: 'познакомиться и поддержать беседу',
  },
  register: 'neutral',
  branches: [
    'представиться',
    'спросить, откуда собеседник или чем занимается',
    'разговор о погоде или поездке',
    'вежливо попрощаться',
  ],
  cultureNotes: [
    'В англоязычной культуре small talk о погоде — совершенно обычная тема для начала разговора',
    'Личные вопросы (зарплата, возраст, вес) при первом знакомстве считаются неуместными',
  ],
};

export const DECKS: readonly MockDeck[] = [
  {
    id: '0195d000-0000-7000-8000-000000000001',
    lang: 'en',
    nativeLang: 'ru',
    title: 'Ресторан и кафе',
    goalTags: ['travel', 'self'],
    type: 'official',
    context: restaurantContext,
    items: resolveDeckItems([
      { lemma: 'menu', importance: 3 },
      { lemma: 'waiter', importance: 2 },
      { lemma: 'reservation', importance: 3 },
      { lemma: 'Could I get...?', importance: 3 },
      { lemma: "I'm allergic to...", importance: 3 },
      { lemma: 'bill', importance: 3 },
      { lemma: 'to split the bill', importance: 2 },
      { lemma: 'tip', importance: 2 },
      { lemma: 'to recommend', importance: 3 },
      { lemma: 'appetizer', importance: 2 },
      { lemma: 'Is this dish spicy?', importance: 2 },
      { lemma: 'to pay by card', importance: 3 },
      { lemma: 'delicious', importance: 1 },
    ]),
  },
  {
    id: '0195d000-0000-7000-8000-000000000002',
    lang: 'en',
    nativeLang: 'ru',
    title: 'Отель',
    goalTags: ['travel', 'work'],
    type: 'official',
    context: hotelContext,
    items: resolveDeckItems([
      { lemma: 'check-in', importance: 3 },
      { lemma: 'check-out', importance: 3 },
      { lemma: 'booking', importance: 3 },
      { lemma: 'Could I have a wake-up call?', importance: 2 },
      { lemma: 'Is breakfast included?', importance: 3 },
      { lemma: 'key card', importance: 2 },
      { lemma: 'to check in late', importance: 2 },
      { lemma: 'to extend the stay', importance: 2 },
      { lemma: 'room service', importance: 2 },
      { lemma: 'blanket', importance: 2 },
      { lemma: "There's a problem with my room", importance: 3 },
      { lemma: 'to leave luggage at reception', importance: 2 },
      { lemma: 'receptionist', importance: 2 },
    ]),
  },
  {
    id: '0195d000-0000-7000-8000-000000000003',
    lang: 'en',
    nativeLang: 'ru',
    title: 'Аэропорт и перелёт',
    goalTags: ['travel', 'work'],
    type: 'official',
    context: airportContext,
    items: resolveDeckItems([
      { lemma: 'boarding pass', importance: 3 },
      { lemma: 'gate', importance: 3 },
      { lemma: 'check-in counter', importance: 2 },
      { lemma: 'Where is the check-in counter?', importance: 3 },
      { lemma: 'luggage', importance: 2 },
      { lemma: 'My luggage is missing', importance: 3 },
      { lemma: 'delayed flight', importance: 3 },
      { lemma: 'Could I have a window seat?', importance: 2 },
      { lemma: 'security check', importance: 2 },
      { lemma: 'passport control', importance: 2 },
      { lemma: 'to miss a flight', importance: 2 },
      { lemma: 'layover', importance: 2 },
      { lemma: 'Is this flight on time?', importance: 2 },
      { lemma: 'wander', importance: 2 },
    ]),
  },
  {
    id: '0195d000-0000-7000-8000-000000000004',
    lang: 'en',
    nativeLang: 'ru',
    title: 'Такси',
    goalTags: ['travel', 'self'],
    type: 'official',
    context: taxiContext,
    items: resolveDeckItems([
      { lemma: 'taxi rank', importance: 2 },
      { lemma: 'fare', importance: 3 },
      { lemma: 'driver', importance: 1 },
      { lemma: 'Could you take me to...?', importance: 3 },
      { lemma: 'How much will it cost?', importance: 3 },
      { lemma: 'meter', importance: 2 },
      { lemma: 'to book a taxi', importance: 3 },
      { lemma: 'Can you drop me here?', importance: 2 },
      { lemma: 'change', importance: 2 },
      { lemma: 'to be stuck in traffic', importance: 2 },
      { lemma: 'address', importance: 3 },
      { lemma: 'Is this the shortest way?', importance: 1 },
      { lemma: 'receipt', importance: 2 },
    ]),
  },
  {
    id: '0195d000-0000-7000-8000-000000000005',
    lang: 'en',
    nativeLang: 'ru',
    title: 'Как пройти',
    goalTags: ['travel', 'self'],
    type: 'official',
    context: directionsContext,
    items: resolveDeckItems([
      { lemma: 'Excuse me, how do I get to...?', importance: 3 },
      { lemma: 'street', importance: 2 },
      { lemma: 'corner', importance: 2 },
      { lemma: 'to turn left / right', importance: 3 },
      { lemma: 'to go straight', importance: 3 },
      { lemma: 'block', importance: 2 },
      { lemma: 'intersection', importance: 2 },
      { lemma: 'Is it far from here?', importance: 3 },
      { lemma: 'Could you repeat that, please?', importance: 2 },
      { lemma: 'landmark', importance: 1 },
      { lemma: 'to be lost', importance: 2 },
      { lemma: 'Which way is...?', importance: 3 },
      { lemma: 'on foot', importance: 2 },
    ]),
  },
  {
    id: '0195d000-0000-7000-8000-000000000006',
    lang: 'en',
    nativeLang: 'ru',
    title: 'Знакомство и small talk',
    goalTags: ['self', 'travel', 'work'],
    type: 'official',
    context: smallTalkContext,
    items: resolveDeckItems([
      { lemma: 'Nice to meet you', importance: 3 },
      { lemma: 'What do you do?', importance: 3 },
      { lemma: 'Where are you from?', importance: 3 },
      { lemma: 'colleague', importance: 2 },
      { lemma: 'to have something in common', importance: 1 },
      { lemma: 'weather', importance: 2 },
      { lemma: 'to catch up', importance: 1 },
      { lemma: "How's it going?", importance: 3 },
      { lemma: 'acquaintance', importance: 1 },
      { lemma: 'It was nice talking to you', importance: 3 },
      { lemma: 'hobby', importance: 2 },
      { lemma: 'to keep in touch', importance: 2 },
      { lemma: 'friendly', importance: 1 },
    ]),
  },
];
