import type { Cefr, Goal, ItemType, Uuid } from '@cards/contracts';

// Единый список слов и выражений мок-словаря — общий источник для
// mocks/fsrs-debug-words.ts (первая сессия онбординга, F1, и дебаг-экран FSRS)
// и mocks/decks.ts (ситуационные колоды): каждое слово описано здесь ровно
// один раз, кто на него ссылается — решают DEBUG_WORDS/DECKS через wordByLemma,
// а не копированием полей. Настоящего словаря ещё нет (T1.6) — тот же временный
// приём, что и раньше, просто без дублирования содержимого между двумя файлами.
export interface MockWord {
  itemId: Uuid;
  itemType: ItemType;
  lemma: string;
  pos?: string;
  // Только у itemType 'sense' — транскрипция целой фразы (itemType
  // 'expression') не в общей практике словарных приложений, не добавляем.
  ipa?: string;
  translation: string;
  // Два примера на слово, каждый со своим переводом (не один общий) — так
  // видно слово в разных контекстах, а не в одной и той же фразе.
  examples: readonly { text: string; translation: string }[];
  // Для itemType 'sense' — определение слова на английском; для 'expression' —
  // пояснение, когда и как применяется фраза (тоже на английском, см.
  // word-study-card.tsx).
  definition: string;
  cefr: Cefr;
  // Только у слов, участвующих в подборе первой сессии онбординга (F1,
  // onboarding-logic.ts::getFirstSessionWords) — временная ручная разметка;
  // в настоящем словаре (T1.6) это будет sense_tag/deck_goal_tag, не поле на слове.
  goals?: readonly Goal[];
}

export const WORDS: readonly MockWord[] = [
  // --- Первая сессия онбординга / дебаг-экран FSRS (было mocks/fsrs-debug-words.ts) ---
  {
    itemId: '0195c000-0000-7000-8000-000000000001',
    itemType: 'sense',
    lemma: 'wander',
    pos: 'verb',
    ipa: 'ˈwɒndə',
    translation: 'бродить, странствовать',
    examples: [
      {
        text: 'She loves to wander through the old town.',
        translation: 'Она любит бродить по старому городу.',
      },
      {
        text: 'After retiring, he spent his days wandering along the coastline.',
        translation: 'Выйдя на пенсию, он проводил дни, бродя вдоль побережья.',
      },
    ],
    definition: 'To walk around slowly without a fixed direction or purpose.',
    cefr: 'B1',
    goals: ['travel'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000002',
    itemType: 'sense',
    lemma: 'fierce',
    pos: 'adjective',
    ipa: 'fɪəs',
    translation: 'свирепый, яростный',
    examples: [
      {
        text: 'The fierce storm knocked down several trees.',
        translation: 'Свирепый шторм повалил несколько деревьев.',
      },
      {
        text: 'Competition between the two companies has become fierce.',
        translation: 'Конкуренция между двумя компаниями стала ожесточённой.',
      },
    ],
    definition: 'Very intense, aggressive, or powerful.',
    cefr: 'B1',
    goals: ['media', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000003',
    itemType: 'sense',
    lemma: 'tenant',
    pos: 'noun',
    ipa: 'ˈtenənt',
    translation: 'арендатор, жилец',
    examples: [
      {
        text: 'The new tenant moved in last week.',
        translation: 'Новый арендатор въехал на прошлой неделе.',
      },
      {
        text: 'The landlord raised the rent, and the tenant complained.',
        translation: 'Арендодатель поднял арендную плату, и арендатор пожаловался.',
      },
    ],
    definition: 'A person who pays rent to live in a property owned by someone else.',
    cefr: 'B1',
    goals: ['move'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000004',
    itemType: 'sense',
    lemma: 'borrow',
    pos: 'verb',
    ipa: 'ˈbɒrəʊ',
    translation: 'одалживать, брать взаймы',
    examples: [
      {
        text: 'Can I borrow your pen for a minute?',
        translation: 'Можно одолжить твою ручку на минуту?',
      },
      {
        text: 'I had to borrow some money from my parents last month.',
        translation: 'В прошлом месяце мне пришлось занять немного денег у родителей.',
      },
    ],
    definition: 'To take something from someone with the intention of returning it.',
    cefr: 'A2',
    goals: ['work', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000005',
    itemType: 'sense',
    lemma: 'crowded',
    pos: 'adjective',
    ipa: 'ˈkraʊdɪd',
    translation: 'переполненный, многолюдный',
    examples: [
      {
        text: 'The train was too crowded to sit down.',
        translation: 'Поезд был слишком переполнен, чтобы сесть.',
      },
      {
        text: 'The beach gets very crowded in the summer.',
        translation: 'Летом пляж становится очень многолюдным.',
      },
    ],
    definition: 'Full of people, with little space to move.',
    cefr: 'A2',
    goals: ['travel'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000006',
    itemType: 'sense',
    lemma: 'neighbor',
    pos: 'noun',
    ipa: 'ˈneɪbə',
    translation: 'сосед',
    examples: [
      {
        text: 'Our neighbor waters our plants when we travel.',
        translation: 'Наш сосед поливает наши растения, когда мы путешествуем.',
      },
      {
        text: "My neighbor's dog barks all night.",
        translation: 'Собака моего соседа лает всю ночь.',
      },
    ],
    definition: 'A person who lives near you.',
    cefr: 'A1',
    goals: ['move', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000007',
    itemType: 'sense',
    lemma: 'suddenly',
    pos: 'adverb',
    ipa: 'ˈsʌdənli',
    translation: 'внезапно',
    examples: [
      { text: 'Suddenly, the lights went out.', translation: 'Внезапно погас свет.' },
      {
        text: 'Suddenly, she remembered she had left the oven on.',
        translation: 'Внезапно она вспомнила, что оставила включённую духовку.',
      },
    ],
    definition: 'Happening quickly and unexpectedly.',
    cefr: 'A2',
    goals: ['media', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000008',
    itemType: 'sense',
    lemma: 'improve',
    pos: 'verb',
    ipa: 'ɪmˈpruːv',
    translation: 'улучшать',
    examples: [
      {
        text: 'He wants to improve his English this year.',
        translation: 'Он хочет улучшить свой английский в этом году.',
      },
      {
        text: 'The new manager helped improve team communication.',
        translation: 'Новый руководитель помог улучшить общение в команде.',
      },
    ],
    definition: 'To make something better than it was before.',
    cefr: 'A2',
    goals: ['work', 'exam', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000009',
    itemType: 'sense',
    lemma: 'exhausted',
    pos: 'adjective',
    ipa: 'ɪɡˈzɔːstɪd',
    translation: 'изнурённый, измотанный',
    examples: [
      {
        text: 'After the hike, we were completely exhausted.',
        translation: 'После похода мы были совершенно измотаны.',
      },
      {
        text: 'She felt exhausted after working a double shift.',
        translation: 'Она чувствовала себя измотанной после двойной смены.',
      },
    ],
    definition: 'Extremely tired, with no energy left.',
    cefr: 'B1',
    goals: ['work', 'travel'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000000a',
    itemType: 'sense',
    lemma: 'deadline',
    pos: 'noun',
    ipa: 'ˈdedlaɪn',
    translation: 'крайний срок',
    examples: [
      {
        text: 'The deadline for the report is Friday.',
        translation: 'Крайний срок сдачи отчёта — пятница.',
      },
      {
        text: 'We missed the deadline because of the delay.',
        translation: 'Мы пропустили крайний срок из-за задержки.',
      },
    ],
    definition: 'The latest time or date by which something must be finished.',
    cefr: 'B1',
    goals: ['work', 'exam'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000000b',
    itemType: 'sense',
    lemma: 'rely',
    pos: 'verb',
    ipa: 'rɪˈlaɪ',
    translation: 'полагаться',
    examples: [
      {
        text: 'You can always rely on your family.',
        translation: 'Ты всегда можешь полагаться на свою семью.',
      },
      {
        text: 'The company relies heavily on foreign investors.',
        translation: 'Компания сильно полагается на иностранных инвесторов.',
      },
    ],
    definition: 'To depend on someone or something with trust or confidence.',
    cefr: 'B1',
    goals: ['work', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000000c',
    itemType: 'sense',
    lemma: 'sincere',
    pos: 'adjective',
    ipa: 'sɪnˈsɪə',
    translation: 'искренний',
    examples: [
      { text: 'She gave a sincere apology.', translation: 'Она принесла искренние извинения.' },
      {
        text: 'His sincere interest in the project impressed everyone.',
        translation: 'Его искренний интерес к проекту впечатлил всех.',
      },
    ],
    definition: 'Honest and genuine, without pretending.',
    cefr: 'B1',
    goals: ['self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000000d',
    itemType: 'sense',
    lemma: 'gather',
    pos: 'verb',
    ipa: 'ˈɡæðə',
    translation: 'собирать(ся)',
    examples: [
      {
        text: "We gather at grandma's house every Sunday.",
        translation: 'Мы собираемся в доме у бабушки каждое воскресенье.',
      },
      {
        text: 'Reporters gathered outside the courthouse.',
        translation: 'Репортёры собрались у здания суда.',
      },
    ],
    definition: 'To come together in one place, or to collect things.',
    cefr: 'A2',
    goals: ['self', 'work'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000000e',
    itemType: 'sense',
    lemma: 'stubborn',
    pos: 'adjective',
    ipa: 'ˈstʌbən',
    translation: 'упрямый',
    examples: [
      {
        text: 'My little brother is very stubborn.',
        translation: 'Мой младший брат очень упрямый.',
      },
      {
        text: 'Despite everyone’s advice, he remained stubborn about his decision.',
        translation: 'Несмотря на советы всех, он оставался непреклонен в своём решении.',
      },
    ],
    definition: "Refusing to change one's mind or actions despite good reasons to do so.",
    cefr: 'B2',
    goals: ['self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000000f',
    itemType: 'sense',
    lemma: 'threat',
    pos: 'noun',
    ipa: 'θret',
    translation: 'угроза',
    examples: [
      {
        text: 'Pollution is a serious threat to the ocean.',
        translation: 'Загрязнение — серьёзная угроза для океана.',
      },
      {
        text: 'Losing his job felt like a real threat to their finances.',
        translation: 'Потеря работы стала настоящей угрозой для их финансов.',
      },
    ],
    definition: 'A statement or sign of possible danger or harm.',
    cefr: 'B1',
    goals: ['media', 'work'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000010',
    itemType: 'sense',
    lemma: 'whisper',
    pos: 'verb',
    ipa: 'ˈwɪspə',
    translation: 'шептать',
    examples: [
      {
        text: 'She whispered the secret to her friend.',
        translation: 'Она прошептала секрет подруге.',
      },
      { text: "Don't whisper during the exam.", translation: 'Не шепчитесь во время экзамена.' },
    ],
    definition: 'To speak very quietly, using breath rather than a full voice.',
    cefr: 'B1',
    goals: ['media', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000011',
    itemType: 'sense',
    lemma: 'generous',
    pos: 'adjective',
    ipa: 'ˈdʒenərəs',
    translation: 'щедрый',
    examples: [
      {
        text: 'He is generous with his time and money.',
        translation: 'Он щедр своим временем и деньгами.',
      },
      {
        text: 'The host was generous, offering us extra food and drinks.',
        translation: 'Хозяин был щедрым, предложив нам ещё еды и напитков.',
      },
    ],
    definition: 'Willing to give more of something, such as time or money, than is expected.',
    cefr: 'A2',
    goals: ['self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000012',
    itemType: 'sense',
    lemma: 'journey',
    pos: 'noun',
    ipa: 'ˈdʒɜːni',
    translation: 'путешествие, поездка',
    examples: [
      {
        text: 'Our journey across the country took five days.',
        translation: 'Наше путешествие через страну заняло пять дней.',
      },
      {
        text: 'Learning a language is a long journey, not a quick fix.',
        translation: 'Изучение языка — это долгий путь, а не быстрое решение.',
      },
    ],
    definition: 'An act of travelling from one place to another.',
    cefr: 'A2',
    goals: ['travel'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000013',
    itemType: 'sense',
    lemma: 'avoid',
    pos: 'verb',
    ipa: 'əˈvɔɪd',
    translation: 'избегать',
    examples: [
      {
        text: 'Try to avoid sugar before bedtime.',
        translation: 'Старайся избегать сахара перед сном.',
      },
      {
        text: 'He tried to avoid eye contact during the meeting.',
        translation: 'Он старался избегать зрительного контакта во время встречи.',
      },
    ],
    definition: 'To stay away from something or prevent it from happening.',
    cefr: 'A2',
    goals: ['work', 'exam', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000014',
    itemType: 'sense',
    lemma: 'curious',
    pos: 'adjective',
    ipa: 'ˈkjʊəriəs',
    translation: 'любопытный',
    examples: [
      {
        text: 'The curious cat explored every corner of the room.',
        translation: 'Любопытный кот исследовал каждый угол комнаты.',
      },
      {
        text: 'Children are naturally curious about the world around them.',
        translation: 'Дети от природы любопытны к окружающему миру.',
      },
    ],
    definition: 'Eager to learn or know more about something.',
    cefr: 'A2',
    goals: ['exam', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000015',
    itemType: 'sense',
    lemma: 'handle',
    pos: 'verb',
    ipa: 'ˈhændl',
    translation: 'справляться, обращаться',
    examples: [
      {
        text: 'She can handle stressful situations calmly.',
        translation: 'Она умеет спокойно справляться со стрессовыми ситуациями.',
      },
      {
        text: 'Could you handle this customer complaint for me?',
        translation: 'Не мог бы ты разобраться с этой жалобой клиента вместо меня?',
      },
    ],
    definition: 'To deal with a situation, task, or object.',
    cefr: 'B1',
    goals: ['work', 'exam'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000016',
    itemType: 'sense',
    lemma: 'narrow',
    pos: 'adjective',
    ipa: 'ˈnærəʊ',
    translation: 'узкий',
    examples: [
      {
        text: 'The narrow street was hard to drive through.',
        translation: 'По узкой улице было трудно проехать.',
      },
      {
        text: 'The path became so narrow that we had to walk in single file.',
        translation: 'Тропа стала такой узкой, что нам пришлось идти друг за другом.',
      },
    ],
    definition: 'Having a small distance from one side to the other.',
    cefr: 'A2',
    goals: ['travel', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000017',
    itemType: 'sense',
    lemma: 'thrive',
    pos: 'verb',
    ipa: 'θraɪv',
    translation: 'процветать',
    examples: [
      {
        text: 'Small businesses thrive in this neighborhood.',
        translation: 'Малый бизнес процветает в этом районе.',
      },
      {
        text: 'Some plants thrive in shade, while others need full sun.',
        translation: 'Некоторые растения хорошо растут в тени, другим нужно много солнца.',
      },
    ],
    definition: 'To grow, develop, or succeed very well.',
    cefr: 'B2',
    goals: ['work', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000018',
    itemType: 'sense',
    lemma: 'reluctant',
    pos: 'adjective',
    ipa: 'rɪˈlʌktənt',
    translation: 'неохотный, не желающий',
    examples: [
      {
        text: 'He was reluctant to leave the party early.',
        translation: 'Он неохотно уходил с вечеринки раньше времени.',
      },
      {
        text: 'She was reluctant to share her true opinion in front of the boss.',
        translation: 'Она неохотно делилась своим настоящим мнением при начальнике.',
      },
    ],
    definition: 'Unwilling to do something and hesitant about it.',
    cefr: 'B2',
    goals: ['work', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000019',
    itemType: 'sense',
    lemma: 'achieve',
    pos: 'verb',
    ipa: 'əˈtʃiːv',
    translation: 'достигать',
    examples: [
      {
        text: 'She worked hard to achieve her goals.',
        translation: 'Она усердно работала, чтобы достичь своих целей.',
      },
      {
        text: 'The team achieved better results than expected this quarter.',
        translation: 'В этом квартале команда достигла результатов лучше ожидаемых.',
      },
    ],
    definition: 'To successfully reach a goal or result through effort.',
    cefr: 'A2',
    goals: ['work', 'exam', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000001a',
    itemType: 'sense',
    lemma: 'brief',
    pos: 'adjective',
    ipa: 'briːf',
    translation: 'краткий',
    examples: [
      {
        text: "Let's keep the meeting brief today.",
        translation: 'Давайте сегодня проведём встречу кратко.',
      },
      {
        text: 'He gave a brief summary of the project before lunch.',
        translation: 'Перед обедом он дал краткое резюме проекта.',
      },
    ],
    definition: 'Lasting only a short time, or using few words.',
    cefr: 'B1',
    goals: ['work', 'exam'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000001b',
    itemType: 'sense',
    lemma: 'cozy',
    pos: 'adjective',
    ipa: 'ˈkəʊzi',
    translation: 'уютный',
    examples: [
      {
        text: 'Their cabin felt cozy in the winter.',
        translation: 'Их домик казался уютным зимой.',
      },
      {
        text: 'We found a cozy little café near the station.',
        translation: 'Мы нашли уютное маленькое кафе рядом со станцией.',
      },
    ],
    definition: 'Warm, comfortable, and pleasant to be in.',
    cefr: 'B1',
    goals: ['move', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000001c',
    itemType: 'sense',
    lemma: 'valuable',
    pos: 'adjective',
    ipa: 'ˈvæljuəbl',
    translation: 'ценный',
    examples: [
      { text: 'Time is a valuable resource.', translation: 'Время — ценный ресурс.' },
      {
        text: 'Her feedback was valuable for improving the product.',
        translation: 'Её отзыв оказался ценным для улучшения продукта.',
      },
    ],
    definition: 'Worth a lot, either in money or importance.',
    cefr: 'A2',
    goals: ['work', 'self'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000001d',
    itemType: 'sense',
    lemma: 'level',
    pos: 'noun',
    ipa: 'ˈlevl',
    translation: 'уровень',
    examples: [
      {
        text: 'She finally reached the last level of the game.',
        translation: 'Она наконец дошла до последнего уровня игры.',
      },
      {
        text: 'His English is at an intermediate level.',
        translation: 'Его английский на среднем уровне.',
      },
    ],
    definition: 'A stage, standard, or position on a scale.',
    cefr: 'A2',
    goals: ['games', 'tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000001e',
    itemType: 'sense',
    lemma: 'opponent',
    pos: 'noun',
    ipa: 'əˈpəʊnənt',
    translation: 'соперник',
    examples: [
      {
        text: 'He beat his opponent in the final round.',
        translation: 'Он победил соперника в финальном раунде.',
      },
      {
        text: 'Her opponent made a mistake in the last move.',
        translation: 'Её соперник допустил ошибку в последнем ходу.',
      },
    ],
    definition: 'A person who competes against you in a game or contest.',
    cefr: 'B1',
    goals: ['games'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000001f',
    itemType: 'sense',
    lemma: 'controller',
    pos: 'noun',
    ipa: 'kənˈtrəʊlə',
    translation: 'геймпад',
    examples: [
      {
        text: 'My little brother dropped the controller again.',
        translation: 'Мой младший брат снова уронил геймпад.',
      },
      {
        text: 'The controller needs new batteries.',
        translation: 'В геймпад нужно поставить новые батарейки.',
      },
    ],
    definition: 'A device used to operate a game or machine.',
    cefr: 'A2',
    goals: ['games'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000020',
    itemType: 'sense',
    lemma: 'score',
    pos: 'noun',
    ipa: 'skɔː',
    translation: 'счёт',
    examples: [
      {
        text: 'Try to beat your best score this time.',
        translation: 'Постарайся побить свой лучший счёт в этот раз.',
      },
      { text: 'The final score was three to one.', translation: 'Итоговый счёт был три к одному.' },
    ],
    definition: 'The number of points earned in a game or test.',
    cefr: 'A2',
    goals: ['games'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000025',
    itemType: 'sense',
    lemma: 'player',
    pos: 'noun',
    ipa: 'ˈpleɪə',
    translation: 'игрок',
    examples: [
      { text: 'Each player gets three cards.', translation: 'Каждый игрок получает три карты.' },
      {
        text: 'Only one player can win this round.',
        translation: 'Только один игрок может выиграть в этом раунде.',
      },
    ],
    definition: 'A person who takes part in a game or sport.',
    cefr: 'A1',
    goals: ['games'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000026',
    itemType: 'sense',
    lemma: 'team',
    pos: 'noun',
    ipa: 'tiːm',
    translation: 'команда',
    examples: [
      {
        text: 'Our team won the last match.',
        translation: 'Наша команда выиграла последний матч.',
      },
      {
        text: 'The whole team celebrated together after the game.',
        translation: 'Вся команда праздновала вместе после игры.',
      },
    ],
    definition: 'A group of people who work or play together toward a shared goal.',
    cefr: 'A1',
    goals: ['games'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000027',
    itemType: 'sense',
    lemma: 'win',
    pos: 'verb',
    ipa: 'wɪn',
    translation: 'выигрывать',
    examples: [
      { text: 'I hope we win this game.', translation: 'Надеюсь, мы выиграем в этой игре.' },
      {
        text: 'They trained every day to win the championship.',
        translation: 'Они тренировались каждый день, чтобы выиграть чемпионат.',
      },
    ],
    definition: 'To achieve victory in a game, contest, or competition.',
    cefr: 'A1',
    goals: ['games'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000028',
    itemType: 'sense',
    lemma: 'lose',
    pos: 'verb',
    ipa: 'luːz',
    translation: 'проигрывать',
    examples: [
      { text: 'Nobody likes to lose.', translation: 'Никто не любит проигрывать.' },
      {
        text: 'If we lose this round, the game is over.',
        translation: 'Если мы проиграем этот раунд, игра закончена.',
      },
    ],
    definition: 'To fail to win, or to no longer have something.',
    cefr: 'A1',
    goals: ['games'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000029',
    itemType: 'sense',
    lemma: 'rule',
    pos: 'noun',
    ipa: 'ruːl',
    translation: 'правило',
    examples: [
      {
        text: "Let's read the rules before we start.",
        translation: 'Давай прочитаем правила, прежде чем начать.',
      },
      {
        text: 'It is against the rules to touch the ball with your hands.',
        translation: 'Правилами запрещено трогать мяч руками.',
      },
    ],
    definition: 'A statement that explains what is allowed or how to act in a situation.',
    cefr: 'A1',
    goals: ['games'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000002a',
    itemType: 'sense',
    lemma: 'turn',
    pos: 'noun',
    ipa: 'tɜːn',
    translation: 'ход',
    examples: [
      { text: "It's your turn now.", translation: 'Теперь твоя очередь.' },
      {
        text: 'Wait for your turn before you roll the dice.',
        translation: 'Дождись своей очереди, прежде чем бросать кубик.',
      },
    ],
    definition: "A player's chance to act within a game, taken in a set order.",
    cefr: 'A1',
    goals: ['games'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000021',
    itemType: 'sense',
    lemma: 'password',
    pos: 'noun',
    ipa: 'ˈpɑːswɜːd',
    translation: 'пароль',
    examples: [
      { text: 'I forgot my password again.', translation: 'Я снова забыл свой пароль.' },
      {
        text: 'Please choose a strong password with numbers and letters.',
        translation: 'Пожалуйста, выберите надёжный пароль с цифрами и буквами.',
      },
    ],
    definition: 'A secret word or code used to prove your identity and gain access.',
    cefr: 'A1',
    goals: ['tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000022',
    itemType: 'sense',
    lemma: 'update',
    pos: 'verb',
    ipa: 'ʌpˈdeɪt',
    translation: 'обновлять',
    examples: [
      {
        text: 'You should update the app before using it.',
        translation: 'Тебе стоит обновить приложение перед использованием.',
      },
      {
        text: 'The company updated its privacy policy last week.',
        translation: 'На прошлой неделе компания обновила политику конфиденциальности.',
      },
    ],
    definition: 'To make something more current by adding the latest changes.',
    cefr: 'A2',
    goals: ['tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000023',
    itemType: 'sense',
    lemma: 'install',
    pos: 'verb',
    ipa: 'ɪnˈstɔːl',
    translation: 'устанавливать',
    examples: [
      {
        text: 'It only takes a minute to install this program.',
        translation: 'Установка этой программы занимает всего минуту.',
      },
      {
        text: 'Did you install the update on your phone?',
        translation: 'Ты установил обновление на телефоне?',
      },
    ],
    definition: 'To set up software or equipment so it is ready to use.',
    cefr: 'A2',
    goals: ['tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000024',
    itemType: 'sense',
    lemma: 'device',
    pos: 'noun',
    ipa: 'dɪˈvaɪs',
    translation: 'устройство',
    examples: [
      {
        text: 'Charge your device before the trip.',
        translation: 'Зарядите устройство перед поездкой.',
      },
      {
        text: 'This device can connect to Wi-Fi and Bluetooth.',
        translation: 'Это устройство может подключаться к Wi-Fi и Bluetooth.',
      },
    ],
    definition: 'A piece of equipment made for a particular purpose, especially electronic.',
    cefr: 'A2',
    goals: ['tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000002b',
    itemType: 'sense',
    lemma: 'screen',
    pos: 'noun',
    ipa: 'skriːn',
    translation: 'экран',
    examples: [
      { text: 'The screen is cracked.', translation: 'Экран треснул.' },
      {
        text: 'The screen is too dim to read outside.',
        translation: 'Экран слишком тусклый, чтобы читать на улице.',
      },
    ],
    definition: 'The flat surface of a device that displays images or text.',
    cefr: 'A1',
    goals: ['tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000002c',
    itemType: 'sense',
    lemma: 'battery',
    pos: 'noun',
    ipa: 'ˈbætəri',
    translation: 'аккумулятор',
    examples: [
      { text: 'My battery is almost dead.', translation: 'Мой аккумулятор почти разряжен.' },
      {
        text: 'The new phone has a much longer battery life.',
        translation: 'У нового телефона аккумулятор держит намного дольше.',
      },
    ],
    definition: 'A device that stores and supplies electrical power.',
    cefr: 'A1',
    goals: ['tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000002d',
    itemType: 'sense',
    lemma: 'charger',
    pos: 'noun',
    ipa: 'ˈtʃɑːdʒə',
    translation: 'зарядное устройство',
    examples: [
      {
        text: 'Can I borrow your charger?',
        translation: 'Можно одолжить твоё зарядное устройство?',
      },
      {
        text: 'I always keep a spare charger in my bag.',
        translation: 'Я всегда держу запасное зарядное устройство в сумке.',
      },
    ],
    definition: 'A device used to add power back into a battery.',
    cefr: 'A2',
    goals: ['tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000002e',
    itemType: 'sense',
    lemma: 'click',
    pos: 'verb',
    ipa: 'klɪk',
    translation: 'нажимать',
    examples: [
      {
        text: 'Just click this button to continue.',
        translation: 'Просто нажми эту кнопку, чтобы продолжить.',
      },
      {
        text: 'Click on the icon to open the file.',
        translation: 'Нажми на значок, чтобы открыть файл.',
      },
    ],
    definition: 'To press a button, especially on a mouse or screen.',
    cefr: 'A1',
    goals: ['tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-00000000002f',
    itemType: 'sense',
    lemma: 'connect',
    pos: 'verb',
    ipa: 'kəˈnekt',
    translation: 'подключаться',
    examples: [
      { text: 'Try to connect to the Wi-Fi.', translation: 'Попробуй подключиться к Wi-Fi.' },
      {
        text: 'The printer won’t connect to my laptop.',
        translation: 'Принтер не подключается к моему ноутбуку.',
      },
    ],
    definition: 'To join or link to something, such as a network or device.',
    cefr: 'A2',
    goals: ['tech'],
  },
  {
    itemId: '0195c000-0000-7000-8000-000000000030',
    itemType: 'sense',
    lemma: 'file',
    pos: 'noun',
    ipa: 'faɪl',
    translation: 'файл',
    examples: [
      { text: 'I saved the file on my computer.', translation: 'Я сохранил файл на компьютере.' },
      { text: "The file didn't open properly.", translation: 'Файл не открылся как следует.' },
    ],
    definition: 'A collection of data stored under one name on a computer.',
    cefr: 'A1',
    goals: ['tech'],
  },
  // --- Колода «Ресторан и кафе» (было mocks/decks.ts) ---
  {
    itemId: '0195d100-0000-7000-8000-000000000001',
    itemType: 'sense',
    lemma: 'menu',
    pos: 'noun',
    ipa: 'ˈmenjuː',
    translation: 'меню',
    examples: [
      { text: 'Could I see the menu, please?', translation: 'Можно посмотреть меню, пожалуйста?' },
      {
        text: 'The menu changes every season.',
        translation: 'Меню меняется каждый сезон.',
      },
    ],
    definition: 'A list of food and drinks available in a restaurant.',
    cefr: 'A2',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000002',
    itemType: 'sense',
    lemma: 'waiter',
    pos: 'noun',
    ipa: 'ˈweɪtə',
    translation: 'официант',
    examples: [
      { text: 'The waiter recommended the fish.', translation: 'Официант порекомендовал рыбу.' },
      {
        text: 'Could you call the waiter, please?',
        translation: 'Не могли бы вы позвать официанта, пожалуйста?',
      },
    ],
    definition: 'A person who takes orders and serves food in a restaurant.',
    cefr: 'A2',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000003',
    itemType: 'sense',
    lemma: 'reservation',
    pos: 'noun',
    ipa: 'ˌrezəˈveɪʃn',
    translation: 'бронь, резервирование',
    examples: [
      { text: 'I have a reservation for two.', translation: 'У меня бронь на двоих.' },
      {
        text: 'Do you need a reservation on weekends?',
        translation: 'Нужна ли бронь на выходные?',
      },
    ],
    definition: 'An arrangement to have a table reserved in advance.',
    cefr: 'B1',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000004',
    itemType: 'expression',
    lemma: 'Could I get...?',
    translation: 'Не могли бы вы принести...?',
    examples: [
      {
        text: 'Could I get a glass of water, please?',
        translation: 'Можно мне стакан воды, пожалуйста?',
      },
      {
        text: 'Could I get the check, please?',
        translation: 'Можно мне счёт, пожалуйста?',
      },
    ],
    definition: 'Used to politely ask someone to bring or give you something.',
    cefr: 'A2',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000005',
    itemType: 'expression',
    lemma: "I'm allergic to...",
    translation: 'У меня аллергия на...',
    examples: [
      {
        text: "I'm allergic to peanuts, is this dish safe?",
        translation: 'У меня аллергия на арахис, это блюдо безопасно?',
      },
      {
        text: "I'm allergic to shellfish, so I'll skip the seafood.",
        translation: 'У меня аллергия на моллюсков, поэтому я не буду брать морепродукты.',
      },
    ],
    definition: 'Used to tell someone that a certain food or substance makes you ill.',
    cefr: 'B1',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000006',
    itemType: 'sense',
    lemma: 'bill',
    pos: 'noun',
    ipa: 'bɪl',
    translation: 'счёт',
    examples: [
      { text: 'Could we have the bill, please?', translation: 'Можно счёт, пожалуйста?' },
      { text: 'The bill came to forty dollars.', translation: 'Счёт составил сорок долларов.' },
    ],
    definition: 'The piece of paper that shows how much you need to pay.',
    cefr: 'A2',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000007',
    itemType: 'expression',
    lemma: 'to split the bill',
    translation: 'разделить счёт',
    examples: [
      { text: "Let's split the bill evenly.", translation: 'Давай разделим счёт поровну.' },
      {
        text: 'Would you like to split the bill or pay separately?',
        translation: 'Хотите разделить счёт или заплатить отдельно?',
      },
    ],
    definition: 'Used when a group shares the cost of a meal equally.',
    cefr: 'B1',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000008',
    itemType: 'sense',
    lemma: 'tip',
    pos: 'noun',
    ipa: 'tɪp',
    translation: 'чаевые',
    examples: [
      { text: 'Is the tip included?', translation: 'Чаевые включены?' },
      {
        text: 'We left a generous tip for the waiter.',
        translation: 'Мы оставили официанту щедрые чаевые.',
      },
    ],
    definition: 'Extra money given to a waiter for good service.',
    cefr: 'B1',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000009',
    itemType: 'sense',
    lemma: 'to recommend',
    pos: 'verb',
    ipa: 'ˌrekəˈmend',
    translation: 'рекомендовать',
    examples: [
      { text: 'What would you recommend?', translation: 'Что бы вы порекомендовали?' },
      {
        text: "I would recommend the soup, it's excellent today.",
        translation: 'Я бы порекомендовал суп, он сегодня отличный.',
      },
    ],
    definition: 'To suggest something, such as a dish, as good or suitable.',
    cefr: 'A2',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000010',
    itemType: 'sense',
    lemma: 'appetizer',
    pos: 'noun',
    ipa: 'ˈæpɪtaɪzə',
    translation: 'закуска',
    examples: [
      { text: "We'll start with the appetizers.", translation: 'Начнём с закусок.' },
      {
        text: 'The appetizer was small but very tasty.',
        translation: 'Закуска была маленькой, но очень вкусной.',
      },
    ],
    definition: 'A small dish served before the main course.',
    cefr: 'A2',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000011',
    itemType: 'expression',
    lemma: 'Is this dish spicy?',
    translation: 'Это блюдо острое?',
    examples: [
      {
        text: "Is this dish spicy? I can't handle very hot food.",
        translation: 'Это блюдо острое? Я не переношу очень острую еду.',
      },
      {
        text: 'Is this dish spicy, or is it mild?',
        translation: 'Это блюдо острое или нет?',
      },
    ],
    definition: 'Used to ask whether a dish contains hot spices before ordering it.',
    cefr: 'A2',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000012',
    itemType: 'expression',
    lemma: 'to pay by card',
    translation: 'оплатить картой',
    examples: [
      { text: 'Can I pay by card?', translation: 'Могу я оплатить картой?' },
      {
        text: 'Sorry, we can only pay by card here.',
        translation: 'Извините, здесь можно оплатить только картой.',
      },
    ],
    definition: 'Used when you want to pay with a bank card instead of cash.',
    cefr: 'A1',
  },
  {
    itemId: '0195d100-0000-7000-8000-000000000013',
    itemType: 'sense',
    lemma: 'delicious',
    pos: 'adjective',
    ipa: 'dɪˈlɪʃəs',
    translation: 'вкусный, восхитительный',
    examples: [
      {
        text: 'Everything was delicious, thank you.',
        translation: 'Всё было очень вкусно, спасибо.',
      },
      {
        text: 'This cake looks delicious!',
        translation: 'Этот торт выглядит очень аппетитно!',
      },
    ],
    definition: 'Having a very pleasant taste.',
    cefr: 'A2',
  },
  // --- Колода «Отель» (было mocks/decks.ts) ---
  {
    itemId: '0195d200-0000-7000-8000-000000000001',
    itemType: 'sense',
    lemma: 'check-in',
    pos: 'noun',
    ipa: 'ˈtʃek ɪn',
    translation: 'заселение',
    examples: [
      { text: 'Check-in starts at 3 PM.', translation: 'Заселение начинается в 15:00.' },
      {
        text: 'We arrived early, before check-in.',
        translation: 'Мы приехали рано, до заселения.',
      },
    ],
    definition: 'The process of registering and receiving your room key at a hotel.',
    cefr: 'A2',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000002',
    itemType: 'sense',
    lemma: 'check-out',
    pos: 'noun',
    ipa: 'ˈtʃek aʊt',
    translation: 'выезд из отеля',
    examples: [
      { text: 'What time is check-out?', translation: 'Во сколько выезд из отеля?' },
      {
        text: 'Check-out is at noon.',
        translation: 'Выезд из отеля в полдень.',
      },
    ],
    definition: 'The process of leaving a hotel and returning your room key.',
    cefr: 'A2',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000003',
    itemType: 'sense',
    lemma: 'booking',
    pos: 'noun',
    ipa: 'ˈbʊkɪŋ',
    translation: 'бронирование',
    examples: [
      {
        text: 'I have a booking under the name Smith.',
        translation: 'У меня бронирование на имя Смит.',
      },
      {
        text: 'Can I change the dates of my booking?',
        translation: 'Могу я изменить даты своего бронирования?',
      },
    ],
    definition: 'A reservation made in advance for a room.',
    cefr: 'A2',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000004',
    itemType: 'expression',
    lemma: 'Could I have a wake-up call?',
    translation: 'Не могли бы вы разбудить меня звонком?',
    examples: [
      {
        text: 'Could I have a wake-up call at 7 AM?',
        translation: 'Не могли бы вы разбудить меня звонком в 7 утра?',
      },
      {
        text: 'Could I have a wake-up call tomorrow morning?',
        translation: 'Не могли бы вы разбудить меня звонком завтра утром?',
      },
    ],
    definition: 'Used to ask the hotel to call your room at a chosen time to wake you up.',
    cefr: 'B1',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000005',
    itemType: 'expression',
    lemma: 'Is breakfast included?',
    translation: 'Завтрак включён?',
    examples: [
      { text: 'Is breakfast included in the price?', translation: 'Завтрак включён в стоимость?' },
      {
        text: 'Breakfast is included, from 7 to 10 AM.',
        translation: 'Завтрак включён, с 7 до 10 утра.',
      },
    ],
    definition: 'Used to ask whether breakfast is part of the room price.',
    cefr: 'A2',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000006',
    itemType: 'sense',
    lemma: 'key card',
    pos: 'noun',
    ipa: 'ˈkiː kɑːd',
    translation: 'карта-ключ',
    examples: [
      { text: "My key card isn't working.", translation: 'Моя карта-ключ не работает.' },
      {
        text: 'Could I get a spare key card?',
        translation: 'Можно мне ещё одну карту-ключ?',
      },
    ],
    definition: 'A plastic card used instead of a key to open a hotel room door.',
    cefr: 'A2',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000007',
    itemType: 'expression',
    lemma: 'to check in late',
    translation: 'заселиться поздно',
    examples: [
      {
        text: "We'll check in late, around midnight.",
        translation: 'Мы заселимся поздно, около полуночи.',
      },
      {
        text: 'Our flight lands late, so we need to check in late.',
        translation: 'Наш рейс прилетает поздно, поэтому нам нужно заселиться поздно.',
      },
    ],
    definition: 'Used to tell the hotel you will arrive after the usual check-in time.',
    cefr: 'B1',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000008',
    itemType: 'expression',
    lemma: 'to extend the stay',
    translation: 'продлить проживание',
    examples: [
      {
        text: 'Could we extend our stay by one night?',
        translation: 'Могли бы мы продлить проживание на одну ночь?',
      },
      {
        text: "We'd like to extend our stay until Sunday.",
        translation: 'Мы хотели бы продлить проживание до воскресенья.',
      },
    ],
    definition: 'Used to ask to stay longer than originally booked.',
    cefr: 'B1',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000009',
    itemType: 'sense',
    lemma: 'room service',
    pos: 'noun',
    ipa: 'ˈruːm ˌsɜːvɪs',
    translation: 'обслуживание номеров',
    examples: [
      {
        text: 'Does the hotel offer room service?',
        translation: 'В отеле есть обслуживание номеров?',
      },
      {
        text: 'We ordered breakfast through room service.',
        translation: 'Мы заказали завтрак через обслуживание номеров.',
      },
    ],
    definition: 'A hotel service that brings food or other items directly to your room.',
    cefr: 'B1',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000010',
    itemType: 'sense',
    lemma: 'blanket',
    pos: 'noun',
    ipa: 'ˈblæŋkɪt',
    translation: 'одеяло',
    examples: [
      {
        text: 'Could we get an extra blanket, please?',
        translation: 'Можно нам дополнительное одеяло, пожалуйста?',
      },
      {
        text: 'The room only had one thin blanket.',
        translation: 'В номере было только одно тонкое одеяло.',
      },
    ],
    definition: 'A thick piece of fabric used for warmth in bed.',
    cefr: 'A2',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000011',
    itemType: 'expression',
    lemma: "There's a problem with my room",
    translation: 'У меня проблема с номером',
    examples: [
      {
        text: "There's a problem with my room — the shower isn't working.",
        translation: 'У меня проблема с номером — душ не работает.',
      },
      {
        text: "There's a problem with my room, it's too noisy.",
        translation: 'У меня проблема с номером, там слишком шумно.',
      },
    ],
    definition: 'Used to report an issue with your room to hotel staff.',
    cefr: 'B1',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000012',
    itemType: 'expression',
    lemma: 'to leave luggage at reception',
    translation: 'оставить багаж на ресепшене',
    examples: [
      {
        text: 'Can I leave my luggage at reception after check-out?',
        translation: 'Могу я оставить багаж на ресепшене после выезда?',
      },
      {
        text: "We'll leave our luggage at reception until the evening.",
        translation: 'Мы оставим багаж на ресепшене до вечера.',
      },
    ],
    definition: 'Used to ask staff to store your bags temporarily at the front desk.',
    cefr: 'B2',
  },
  {
    itemId: '0195d200-0000-7000-8000-000000000013',
    itemType: 'sense',
    lemma: 'receptionist',
    pos: 'noun',
    ipa: 'rɪˈsepʃənɪst',
    translation: 'администратор, ресепшен',
    examples: [
      {
        text: 'Ask the receptionist for a city map.',
        translation: 'Спроси у администратора карту города.',
      },
      {
        text: 'The receptionist was very friendly and helpful.',
        translation: 'Администратор был очень дружелюбным и отзывчивым.',
      },
    ],
    definition: 'A person who works at the front desk of a hotel.',
    cefr: 'A2',
  },
  // --- Колода «Аэропорт и перелёт» (было mocks/decks.ts) ---
  {
    itemId: '0195d300-0000-7000-8000-000000000001',
    itemType: 'sense',
    lemma: 'boarding pass',
    pos: 'noun',
    ipa: 'ˈbɔːdɪŋ pɑːs',
    translation: 'посадочный талон',
    examples: [
      {
        text: 'Please have your boarding pass ready.',
        translation: 'Пожалуйста, приготовьте посадочный талон.',
      },
      {
        text: 'I printed my boarding pass at home.',
        translation: 'Я распечатал посадочный талон дома.',
      },
    ],
    definition: 'A document that allows you to board a flight.',
    cefr: 'A2',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000002',
    itemType: 'sense',
    lemma: 'gate',
    pos: 'noun',
    ipa: 'ɡeɪt',
    translation: 'выход на посадку',
    examples: [
      {
        text: 'Our gate has changed to B12.',
        translation: 'Наш выход на посадку изменился на B12.',
      },
      {
        text: 'Boarding begins at gate 5 in twenty minutes.',
        translation: 'Посадка на выходе 5 начнётся через двадцать минут.',
      },
    ],
    definition: 'The area of an airport where passengers board a specific flight.',
    cefr: 'A2',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000003',
    itemType: 'sense',
    lemma: 'check-in counter',
    pos: 'noun',
    ipa: 'ˈtʃek ɪn ˌkaʊntə',
    translation: 'стойка регистрации',
    examples: [
      {
        text: 'The check-in counter closes 40 minutes before departure.',
        translation: 'Стойка регистрации закрывается за 40 минут до вылета.',
      },
      {
        text: 'There was a long line at the check-in counter.',
        translation: 'У стойки регистрации была длинная очередь.',
      },
    ],
    definition: 'The desk where passengers check in for their flight.',
    cefr: 'B1',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000004',
    itemType: 'expression',
    lemma: 'Where is the check-in counter?',
    translation: 'Где находится стойка регистрации?',
    examples: [
      {
        text: 'Excuse me, where is the check-in counter for this flight?',
        translation: 'Извините, где находится стойка регистрации на этот рейс?',
      },
      {
        text: 'Where is the check-in counter for international flights?',
        translation: 'Где находится стойка регистрации для международных рейсов?',
      },
    ],
    definition: 'Used to ask for directions to the check-in desk.',
    cefr: 'A2',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000005',
    itemType: 'sense',
    lemma: 'luggage',
    pos: 'noun',
    ipa: 'ˈlʌɡɪdʒ',
    translation: 'багаж',
    examples: [
      { text: 'How many bags can I check in?', translation: 'Сколько сумок можно сдать в багаж?' },
      {
        text: 'My luggage was too heavy, so I had to pay extra.',
        translation: 'Мой багаж был слишком тяжёлым, поэтому мне пришлось доплатить.',
      },
    ],
    definition: 'Bags and suitcases you take with you when travelling.',
    cefr: 'A2',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000006',
    itemType: 'expression',
    lemma: 'My luggage is missing',
    translation: 'Мой багаж потерялся',
    examples: [
      {
        text: 'My luggage is missing, can you help me file a report?',
        translation: 'Мой багаж потерялся, поможете оформить заявление?',
      },
      {
        text: 'My luggage is missing — it never came out on the belt.',
        translation: 'Мой багаж потерялся — он так и не появился на ленте.',
      },
    ],
    definition: 'Used to report that your bags did not arrive with you.',
    cefr: 'B1',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000007',
    itemType: 'sense',
    lemma: 'delayed flight',
    pos: 'noun phrase',
    ipa: 'dɪˈleɪd flaɪt',
    translation: 'задержанный рейс',
    examples: [
      {
        text: 'Our flight has been delayed by two hours.',
        translation: 'Наш рейс задержали на два часа.',
      },
      {
        text: 'Bad weather caused several delayed flights today.',
        translation: 'Из-за плохой погоды сегодня несколько рейсов задержали.',
      },
    ],
    definition: 'A flight that departs later than its scheduled time.',
    cefr: 'B1',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000008',
    itemType: 'expression',
    lemma: 'Could I have a window seat?',
    translation: 'Можно место у окна?',
    examples: [
      {
        text: 'Could I have a window seat, please?',
        translation: 'Можно место у окна, пожалуйста?',
      },
      {
        text: 'Could I have a window seat instead of an aisle seat?',
        translation: 'Можно мне место у окна вместо места у прохода?',
      },
    ],
    definition: 'Used to request a seat next to the airplane window.',
    cefr: 'A2',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000009',
    itemType: 'sense',
    lemma: 'security check',
    pos: 'noun',
    ipa: 'sɪˈkjʊərəti tʃek',
    translation: 'досмотр безопасности',
    examples: [
      {
        text: 'Remove your laptop before the security check.',
        translation: 'Достаньте ноутбук перед досмотром безопасности.',
      },
      {
        text: 'The line for security check was very long.',
        translation: 'Очередь на досмотр безопасности была очень длинной.',
      },
    ],
    definition: 'The screening process passengers go through before boarding.',
    cefr: 'B1',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000010',
    itemType: 'sense',
    lemma: 'passport control',
    pos: 'noun',
    ipa: 'ˈpɑːspɔːt kənˈtrəʊl',
    translation: 'паспортный контроль',
    examples: [
      {
        text: 'Passport control is on the second floor.',
        translation: 'Паспортный контроль на втором этаже.',
      },
      {
        text: 'We waited almost an hour at passport control.',
        translation: 'Мы прождали почти час на паспортном контроле.',
      },
    ],
    definition: 'The checkpoint where officials examine your passport.',
    cefr: 'A2',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000011',
    itemType: 'expression',
    lemma: 'to miss a flight',
    translation: 'опоздать на рейс',
    examples: [
      {
        text: 'We almost missed our flight because of traffic.',
        translation: 'Мы чуть не опоздали на рейс из-за пробок.',
      },
      {
        text: 'He missed his flight and had to book a new ticket.',
        translation: 'Он опоздал на рейс, и ему пришлось покупать новый билет.',
      },
    ],
    definition: 'Used when you arrive too late to board your flight.',
    cefr: 'B1',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000012',
    itemType: 'sense',
    lemma: 'layover',
    pos: 'noun',
    ipa: 'ˈleɪəʊvə',
    translation: 'пересадка, стыковка',
    examples: [
      {
        text: 'I have a two-hour layover in Istanbul.',
        translation: 'У меня двухчасовая пересадка в Стамбуле.',
      },
      {
        text: 'A long layover gave us time to explore the airport.',
        translation: 'Долгая пересадка дала нам время осмотреть аэропорт.',
      },
    ],
    definition: 'A stop between flights before reaching your final destination.',
    cefr: 'B2',
  },
  {
    itemId: '0195d300-0000-7000-8000-000000000013',
    itemType: 'expression',
    lemma: 'Is this flight on time?',
    translation: 'Этот рейс по расписанию?',
    examples: [
      {
        text: 'Excuse me, is this flight on time?',
        translation: 'Извините, этот рейс по расписанию?',
      },
      {
        text: 'Is this flight on time, or has it been delayed?',
        translation: 'Этот рейс по расписанию, или его задержали?',
      },
    ],
    definition: 'Used to ask whether a flight is departing as scheduled.',
    cefr: 'A2',
  },
  // --- Колода «Такси» (было mocks/decks.ts) ---
  {
    itemId: '0195d400-0000-7000-8000-000000000001',
    itemType: 'sense',
    lemma: 'taxi rank',
    pos: 'noun',
    ipa: 'ˈtæksi ræŋk',
    translation: 'стоянка такси',
    examples: [
      {
        text: 'Is there a taxi rank near here?',
        translation: 'Здесь есть стоянка такси поблизости?',
      },
      {
        text: 'There was a long queue at the taxi rank.',
        translation: 'На стоянке такси была длинная очередь.',
      },
    ],
    definition: 'A place where taxis wait for passengers.',
    cefr: 'B1',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000002',
    itemType: 'sense',
    lemma: 'fare',
    pos: 'noun',
    ipa: 'feə',
    translation: 'стоимость поездки',
    examples: [
      {
        text: 'How much is the fare to the airport?',
        translation: 'Сколько стоит поездка до аэропорта?',
      },
      {
        text: 'The fare doubles after midnight.',
        translation: 'После полуночи стоимость поездки удваивается.',
      },
    ],
    definition: 'The amount of money you pay for a taxi ride.',
    cefr: 'A2',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000003',
    itemType: 'sense',
    lemma: 'driver',
    pos: 'noun',
    ipa: 'ˈdraɪvə',
    translation: 'водитель',
    examples: [
      { text: 'The driver knew a shortcut.', translation: 'Водитель знал короткий путь.' },
      { text: 'The driver helped us with our bags.', translation: 'Водитель помог нам с сумками.' },
    ],
    definition: 'The person who drives the taxi.',
    cefr: 'A2',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000004',
    itemType: 'expression',
    lemma: 'Could you take me to...?',
    translation: 'Не могли бы вы отвезти меня в...?',
    examples: [
      {
        text: 'Could you take me to this address, please?',
        translation: 'Не могли бы вы отвезти меня по этому адресу, пожалуйста?',
      },
      {
        text: 'Could you take me to the train station?',
        translation: 'Не могли бы вы отвезти меня на вокзал?',
      },
    ],
    definition: 'Used to tell a taxi driver your destination.',
    cefr: 'A2',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000005',
    itemType: 'expression',
    lemma: 'How much will it cost?',
    translation: 'Сколько это будет стоить?',
    examples: [
      {
        text: 'How much will it cost to get to the city center?',
        translation: 'Сколько будет стоить доехать до центра города?',
      },
      {
        text: 'How much will it cost for two people?',
        translation: 'Сколько это будет стоить на двоих?',
      },
    ],
    definition: 'Used to ask the price of a ride before or during the trip.',
    cefr: 'A2',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000006',
    itemType: 'sense',
    lemma: 'meter',
    pos: 'noun',
    ipa: 'ˈmiːtə',
    translation: 'счётчик',
    examples: [
      { text: 'Please turn on the meter.', translation: 'Пожалуйста, включите счётчик.' },
      {
        text: 'The meter showed a higher fare than expected.',
        translation: 'Счётчик показал большую сумму, чем ожидалось.',
      },
    ],
    definition: 'The device in a taxi that calculates the fare.',
    cefr: 'B1',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000007',
    itemType: 'expression',
    lemma: 'to book a taxi',
    translation: 'заказать такси',
    examples: [
      {
        text: "I'd like to book a taxi for 8 AM.",
        translation: 'Я хотел(а) бы заказать такси на 8 утра.',
      },
      {
        text: 'We booked a taxi to the airport in advance.',
        translation: 'Мы заранее заказали такси до аэропорта.',
      },
    ],
    definition: 'Used when arranging a taxi in advance.',
    cefr: 'B1',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000008',
    itemType: 'expression',
    lemma: 'Can you drop me here?',
    translation: 'Можете высадить меня здесь?',
    examples: [
      {
        text: 'Can you drop me here, right at the corner?',
        translation: 'Можете высадить меня здесь, прямо на углу?',
      },
      {
        text: 'Can you drop me here, near the entrance?',
        translation: 'Можете высадить меня здесь, у входа?',
      },
    ],
    definition: 'Used to ask the driver to stop and let you out at a specific spot.',
    cefr: 'A2',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000009',
    itemType: 'sense',
    lemma: 'change',
    pos: 'noun',
    ipa: 'tʃeɪndʒ',
    translation: 'сдача',
    examples: [
      { text: 'Keep the change.', translation: 'Сдачи не надо.' },
      { text: "The driver didn't have any change.", translation: 'У водителя не было сдачи.' },
    ],
    definition: 'The money returned to you after paying more than the exact fare.',
    cefr: 'A2',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000010',
    itemType: 'expression',
    lemma: 'to be stuck in traffic',
    translation: 'застрять в пробке',
    examples: [
      {
        text: "We're stuck in traffic, we might be late.",
        translation: 'Мы застряли в пробке, можем опоздать.',
      },
      {
        text: 'The taxi was stuck in traffic for almost an hour.',
        translation: 'Такси застряло в пробке почти на час.',
      },
    ],
    definition: 'Used when a vehicle cannot move because of heavy traffic.',
    cefr: 'B1',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000011',
    itemType: 'sense',
    lemma: 'address',
    pos: 'noun',
    ipa: 'əˈdres',
    translation: 'адрес',
    examples: [
      { text: "Here's the address written down.", translation: 'Вот адрес, записанный на бумаге.' },
      { text: "I don't remember the exact address.", translation: 'Я не помню точный адрес.' },
    ],
    definition: 'The details of a location, such as street and number.',
    cefr: 'A1',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000012',
    itemType: 'expression',
    lemma: 'Is this the shortest way?',
    translation: 'Это самый короткий путь?',
    examples: [
      {
        text: 'Is this the shortest way, or is there traffic?',
        translation: 'Это самый короткий путь, или там пробки?',
      },
      {
        text: 'Is this the shortest way to the station?',
        translation: 'Это самый короткий путь до вокзала?',
      },
    ],
    definition: 'Used to ask whether the driver is taking the fastest route.',
    cefr: 'B1',
  },
  {
    itemId: '0195d400-0000-7000-8000-000000000013',
    itemType: 'sense',
    lemma: 'receipt',
    pos: 'noun',
    ipa: 'rɪˈsiːt',
    translation: 'чек, квитанция',
    examples: [
      { text: 'Could I get a receipt, please?', translation: 'Можно чек, пожалуйста?' },
      {
        text: 'I need the receipt for my expenses report.',
        translation: 'Мне нужен чек для отчёта по расходам.',
      },
    ],
    definition: 'A printed proof of payment for the ride.',
    cefr: 'A2',
  },
  // --- Колода «Как пройти» (было mocks/decks.ts) ---
  {
    itemId: '0195d500-0000-7000-8000-000000000001',
    itemType: 'expression',
    lemma: 'Excuse me, how do I get to...?',
    translation: 'Извините, как мне пройти до...?',
    examples: [
      {
        text: 'Excuse me, how do I get to the train station?',
        translation: 'Извините, как мне пройти до вокзала?',
      },
      {
        text: 'Excuse me, how do I get to the museum from here?',
        translation: 'Извините, как мне отсюда пройти до музея?',
      },
    ],
    definition: 'Used to politely ask someone for directions to a place.',
    cefr: 'A2',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000002',
    itemType: 'sense',
    lemma: 'street',
    pos: 'noun',
    ipa: 'striːt',
    translation: 'улица',
    examples: [
      { text: 'Turn left onto Oak Street.', translation: 'Поверните налево на Оук-стрит.' },
      { text: 'This street is closed for repairs.', translation: 'Эта улица закрыта на ремонт.' },
    ],
    definition: 'A public road in a town or city, usually with buildings on each side.',
    cefr: 'A1',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000003',
    itemType: 'sense',
    lemma: 'corner',
    pos: 'noun',
    ipa: 'ˈkɔːnə',
    translation: 'угол (улицы)',
    examples: [
      { text: 'The shop is on the corner.', translation: 'Магазин на углу.' },
      {
        text: 'Wait for me on the corner of Main Street.',
        translation: 'Подожди меня на углу Мейн-стрит.',
      },
    ],
    definition: 'The point where two streets meet.',
    cefr: 'A2',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000004',
    itemType: 'expression',
    lemma: 'to turn left / right',
    translation: 'повернуть налево / направо',
    examples: [
      {
        text: 'Turn right at the next light.',
        translation: 'Поверните направо на следующем светофоре.',
      },
      { text: 'Turn left after the bridge.', translation: 'Поверните налево после моста.' },
    ],
    definition: 'Used when giving or following directions at a junction.',
    cefr: 'A2',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000005',
    itemType: 'expression',
    lemma: 'to go straight',
    translation: 'идти прямо',
    examples: [
      { text: 'Just go straight for two blocks.', translation: 'Просто идите прямо два квартала.' },
      {
        text: 'Go straight until you see the church.',
        translation: 'Идите прямо, пока не увидите церковь.',
      },
    ],
    definition: 'Used to tell someone to continue in the same direction without turning.',
    cefr: 'A2',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000006',
    itemType: 'sense',
    lemma: 'block',
    pos: 'noun',
    ipa: 'blɒk',
    translation: 'квартал',
    examples: [
      {
        text: "It's about three blocks from here.",
        translation: 'Это примерно три квартала отсюда.',
      },
      {
        text: 'We walked around the block twice looking for the entrance.',
        translation: 'Мы дважды обошли квартал в поисках входа.',
      },
    ],
    definition: 'A section of a street between two intersections.',
    cefr: 'B1',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000007',
    itemType: 'sense',
    lemma: 'intersection',
    pos: 'noun',
    ipa: 'ˌɪntəˈsekʃn',
    translation: 'перекрёсток',
    examples: [
      {
        text: 'Turn at the next intersection.',
        translation: 'Поверните на следующем перекрёстке.',
      },
      {
        text: 'The accident happened at a busy intersection.',
        translation: 'Авария произошла на оживлённом перекрёстке.',
      },
    ],
    definition: 'A place where two or more roads cross.',
    cefr: 'B1',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000008',
    itemType: 'expression',
    lemma: 'Is it far from here?',
    translation: 'Это далеко отсюда?',
    examples: [
      {
        text: 'Is it far from here, or can I walk?',
        translation: 'Это далеко отсюда, или можно дойти пешком?',
      },
      {
        text: 'Is it far from here to the beach?',
        translation: 'Отсюда далеко до пляжа?',
      },
    ],
    definition: 'Used to ask about the distance to a place from your current location.',
    cefr: 'A2',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000009',
    itemType: 'expression',
    lemma: 'Could you repeat that, please?',
    translation: 'Не могли бы вы повторить, пожалуйста?',
    examples: [
      {
        text: "Sorry, could you repeat that, please? I didn't quite catch it.",
        translation: 'Извините, не могли бы вы повторить, пожалуйста? Я не совсем понял(а).',
      },
      {
        text: 'Could you repeat that, please? You were speaking too fast.',
        translation: 'Не могли бы вы повторить, пожалуйста? Вы говорили слишком быстро.',
      },
    ],
    definition: 'Used to politely ask someone to say something again.',
    cefr: 'B1',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000010',
    itemType: 'sense',
    lemma: 'landmark',
    pos: 'noun',
    ipa: 'ˈlændmɑːk',
    translation: 'ориентир (заметное место)',
    examples: [
      { text: 'The church is a good landmark.', translation: 'Церковь — хороший ориентир.' },
      {
        text: 'Use the clock tower as a landmark to find your way back.',
        translation: 'Используй часовую башню как ориентир, чтобы найти дорогу обратно.',
      },
    ],
    definition: 'A noticeable building or feature used to help find your way.',
    cefr: 'B2',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000011',
    itemType: 'expression',
    lemma: 'to be lost',
    translation: 'заблудиться',
    examples: [
      { text: "I think we're lost.", translation: 'Кажется, мы заблудились.' },
      {
        text: 'We got lost trying to find the hotel.',
        translation: 'Мы заблудились, пытаясь найти отель.',
      },
    ],
    definition: "Used when you don't know where you are or how to reach your destination.",
    cefr: 'A2',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000012',
    itemType: 'expression',
    lemma: 'Which way is...?',
    translation: 'В какой стороне...?',
    examples: [
      {
        text: 'Which way is the nearest pharmacy?',
        translation: 'В какой стороне ближайшая аптека?',
      },
      {
        text: 'Which way is the city center from here?',
        translation: 'В какой стороне отсюда центр города?',
      },
    ],
    definition: 'Used to ask in which direction a place is located.',
    cefr: 'A2',
  },
  {
    itemId: '0195d500-0000-7000-8000-000000000013',
    itemType: 'expression',
    lemma: 'on foot',
    translation: 'пешком',
    examples: [
      {
        text: 'It only takes ten minutes on foot.',
        translation: 'Пешком это займёт всего десять минут.',
      },
      {
        text: 'We explored the old town on foot.',
        translation: 'Мы осмотрели старый город пешком.',
      },
    ],
    definition: 'Used to describe travelling by walking rather than by vehicle.',
    cefr: 'A2',
  },
  // --- Колода «Знакомство и small talk» (было mocks/decks.ts) ---
  {
    itemId: '0195d600-0000-7000-8000-000000000001',
    itemType: 'expression',
    lemma: 'Nice to meet you',
    translation: 'Приятно познакомиться',
    examples: [
      { text: "Nice to meet you, I'm Anna.", translation: 'Приятно познакомиться, я Анна.' },
      {
        text: "Nice to meet you, I've heard a lot about you.",
        translation: 'Приятно познакомиться, я много о вас слышал(а).',
      },
    ],
    definition: 'Used when meeting someone for the first time.',
    cefr: 'A1',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000002',
    itemType: 'expression',
    lemma: 'What do you do?',
    translation: 'Кем вы работаете?',
    examples: [
      { text: 'So, what do you do for a living?', translation: 'Итак, кем вы работаете?' },
      {
        text: "What do you do, if you don't mind me asking?",
        translation: 'Кем вы работаете, если не секрет?',
      },
    ],
    definition: "Used to ask about someone's job or occupation.",
    cefr: 'A2',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000003',
    itemType: 'expression',
    lemma: 'Where are you from?',
    translation: 'Откуда вы?',
    examples: [
      { text: 'Where are you from originally?', translation: 'Откуда вы родом?' },
      {
        text: 'Where are you from? Your accent is lovely.',
        translation: 'Откуда вы? У вас приятный акцент.',
      },
    ],
    definition: "Used to ask about someone's country or city of origin.",
    cefr: 'A1',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000004',
    itemType: 'sense',
    lemma: 'colleague',
    pos: 'noun',
    ipa: 'ˈkɒliːɡ',
    translation: 'коллега',
    examples: [
      { text: 'This is my colleague, Mark.', translation: 'Это мой коллега, Марк.' },
      {
        text: 'I had lunch with a colleague from another department.',
        translation: 'Я пообедал(а) с коллегой из другого отдела.',
      },
    ],
    definition: 'A person you work with.',
    cefr: 'A2',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000005',
    itemType: 'expression',
    lemma: 'to have something in common',
    translation: 'иметь что-то общее',
    examples: [
      {
        text: 'It turns out we have a lot in common.',
        translation: 'Оказывается, у нас много общего.',
      },
      {
        text: 'We have something in common — we both love hiking.',
        translation: 'У нас есть кое-что общее — мы оба любим походы.',
      },
    ],
    definition: 'Used when two people share similar interests or experiences.',
    cefr: 'B2',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000006',
    itemType: 'sense',
    lemma: 'weather',
    pos: 'noun',
    ipa: 'ˈweðə',
    translation: 'погода',
    examples: [
      {
        text: "Lovely weather today, isn't it?",
        translation: 'Прекрасная погода сегодня, не правда ли?',
      },
      {
        text: 'The weather forecast says it will rain tomorrow.',
        translation: 'По прогнозу погоды завтра будет дождь.',
      },
    ],
    definition: 'The conditions outside, such as sun, rain, or temperature.',
    cefr: 'A1',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000007',
    itemType: 'expression',
    lemma: 'to catch up',
    translation: 'наверстать упущенное, поболтать после разлуки',
    examples: [
      {
        text: "Let's catch up over coffee sometime.",
        translation: 'Давай как-нибудь поболтаем за кофе.',
      },
      {
        text: 'We finally caught up after not seeing each other for years.',
        translation: 'Мы наконец поболтали после многолетней разлуки.',
      },
    ],
    definition:
      'Used when meeting someone to talk about what has happened since you last saw them.',
    cefr: 'B2',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000008',
    itemType: 'expression',
    lemma: "How's it going?",
    translation: 'Как дела?',
    examples: [
      { text: "Hey, how's it going?", translation: 'Привет, как дела?' },
      { text: "How's it going with the new job?", translation: 'Как дела на новой работе?' },
    ],
    definition: 'A casual way to ask how someone is doing.',
    cefr: 'A1',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000009',
    itemType: 'sense',
    lemma: 'acquaintance',
    pos: 'noun',
    ipa: 'əˈkweɪntəns',
    translation: 'знакомый',
    examples: [
      {
        text: "He's just an acquaintance, not a close friend.",
        translation: 'Он просто знакомый, не близкий друг.',
      },
      {
        text: "She's more of a work acquaintance than a friend.",
        translation: 'Она скорее рабочий знакомый, чем подруга.',
      },
    ],
    definition: 'A person you know slightly, but not a close friend.',
    cefr: 'B2',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000010',
    itemType: 'expression',
    lemma: 'It was nice talking to you',
    translation: 'Было приятно с вами поговорить',
    examples: [
      {
        text: 'It was nice talking to you, see you around!',
        translation: 'Было приятно с вами поговорить, до встречи!',
      },
      {
        text: 'It was nice talking to you, take care!',
        translation: 'Было приятно с вами поговорить, берегите себя!',
      },
    ],
    definition: 'Used to politely end a conversation.',
    cefr: 'A2',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000011',
    itemType: 'sense',
    lemma: 'hobby',
    pos: 'noun',
    ipa: 'ˈhɒbi',
    translation: 'хобби',
    examples: [
      {
        text: 'What do you do in your free time, any hobbies?',
        translation: 'Чем вы занимаетесь в свободное время, есть хобби?',
      },
      {
        text: 'Photography is my favorite hobby.',
        translation: 'Фотография — моё любимое хобби.',
      },
    ],
    definition: "An activity done regularly for pleasure in one's free time.",
    cefr: 'A2',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000012',
    itemType: 'expression',
    lemma: 'to keep in touch',
    translation: 'оставаться на связи',
    examples: [
      { text: "Let's keep in touch!", translation: 'Давай останемся на связи!' },
      {
        text: 'We promised to keep in touch after graduation.',
        translation: 'Мы пообещали оставаться на связи после выпуска.',
      },
    ],
    definition: 'Used when asking or promising to stay in contact with someone.',
    cefr: 'B1',
  },
  {
    itemId: '0195d600-0000-7000-8000-000000000013',
    itemType: 'sense',
    lemma: 'friendly',
    pos: 'adjective',
    ipa: 'ˈfrendli',
    translation: 'дружелюбный',
    examples: [
      { text: 'Everyone here is very friendly.', translation: 'Здесь все очень дружелюбные.' },
      {
        text: 'The staff at the hotel were friendly and helpful.',
        translation: 'Персонал отеля был дружелюбным и отзывчивым.',
      },
    ],
    definition: 'Kind and pleasant in the way you behave toward others.',
    cefr: 'A2',
  },
  // --- Колода «Работа: сокращения и переговоры» (mocks/decks.ts) ---
  {
    itemId: '0195d700-0000-7000-8000-000000000001',
    itemType: 'sense',
    lemma: 'layoffs',
    pos: 'noun',
    ipa: 'ˈleɪɒfs',
    translation: 'увольнения, сокращения (штата)',
    examples: [
      {
        text: 'The company announced layoffs affecting 200 employees.',
        translation: 'Компания объявила о сокращениях, которые затронут 200 сотрудников.',
      },
      {
        text: 'Rumors of upcoming layoffs spread through the office quickly.',
        translation: 'Слухи о предстоящих сокращениях быстро разошлись по офису.',
      },
    ],
    definition:
      'A situation in which a company dismisses employees, usually because of financial difficulties or reorganization.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000002',
    itemType: 'expression',
    lemma: 'to be laid off',
    translation: 'быть уволенным (по сокращению)',
    examples: [
      {
        text: 'Hundreds of employees were laid off last month.',
        translation: 'В прошлом месяце сотни сотрудников были уволены по сокращению.',
      },
      {
        text: 'She was laid off after ten years with the company.',
        translation: 'Её сократили после десяти лет работы в компании.',
      },
    ],
    definition:
      'Used when someone loses their job because the company is reducing staff, not because of their own fault.',
    cefr: 'B1',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000003',
    itemType: 'sense',
    lemma: 'requirement',
    pos: 'noun',
    ipa: 'rɪˈkwaɪəmənt',
    translation: 'требование',
    examples: [
      {
        text: 'Fluent English is a requirement for this job.',
        translation: 'Свободный английский — требование для этой работы.',
      },
      {
        text: 'A university degree is a basic requirement for the role.',
        translation: 'Высшее образование — базовое требование для этой должности.',
      },
    ],
    definition: 'Something that is officially needed or asked for.',
    cefr: 'B1',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000004',
    itemType: 'expression',
    lemma: 'What are the requirements for this position?',
    translation: 'Какие требования для этой должности?',
    examples: [
      {
        text: 'Could you tell me what the requirements are for this position?',
        translation: 'Не могли бы вы сказать, какие требования для этой должности?',
      },
      {
        text: 'What are the requirements for this position — do I need a certificate?',
        translation: 'Какие требования для этой должности — нужен ли сертификат?',
      },
    ],
    definition: 'Used to ask what qualifications or conditions are needed for a job.',
    cefr: 'A2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000005',
    itemType: 'sense',
    lemma: 'negotiate',
    pos: 'verb',
    ipa: 'nɪˈɡəʊʃieɪt',
    translation: 'вести переговоры, договариваться',
    examples: [
      {
        text: 'She negotiated a better salary with her manager.',
        translation: 'Она договорилась с руководителем о более высокой зарплате.',
      },
      {
        text: 'The two sides negotiated for hours before signing the contract.',
        translation: 'Обе стороны вели переговоры часами, прежде чем подписать контракт.',
      },
    ],
    definition: 'To discuss something with someone in order to reach an agreement.',
    cefr: 'B1',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000006',
    itemType: 'expression',
    lemma: 'to reach an agreement',
    translation: 'прийти к соглашению',
    examples: [
      {
        text: 'After a long discussion, we finally reached an agreement.',
        translation: 'После долгого обсуждения мы наконец пришли к соглашению.',
      },
      {
        text: 'The two companies reached an agreement on the merger terms.',
        translation: 'Две компании пришли к соглашению об условиях слияния.',
      },
    ],
    definition: 'Used when two sides in a discussion or negotiation come to a shared decision.',
    cefr: 'B1',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000007',
    itemType: 'sense',
    lemma: 'consolidate',
    pos: 'verb',
    ipa: 'kənˈsɒlɪdeɪt',
    translation: 'объединять, консолидировать',
    examples: [
      {
        text: 'The two departments will consolidate into one.',
        translation: 'Два отдела объединятся в один.',
      },
      {
        text: 'The company plans to consolidate its offices into a single location.',
        translation: 'Компания планирует объединить свои офисы в одном месте.',
      },
    ],
    definition:
      'To combine several things, such as companies or departments, into one more effective unit.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000008',
    itemType: 'expression',
    lemma: 'to cut costs',
    translation: 'сокращать расходы',
    examples: [
      {
        text: 'The company decided to cut costs by reducing staff.',
        translation: 'Компания решила сократить расходы, сократив штат.',
      },
      {
        text: 'We need to cut costs without lowering quality.',
        translation: 'Нам нужно сократить расходы, не снижая качество.',
      },
    ],
    definition: 'Used when a company or person reduces spending.',
    cefr: 'A2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000009',
    itemType: 'sense',
    lemma: 'exacerbate',
    pos: 'verb',
    ipa: 'ɪɡˈzæsəbeɪt',
    translation: 'усугублять',
    examples: [
      {
        text: 'The layoffs exacerbated an already difficult situation.',
        translation: 'Увольнения усугубили и без того сложную ситуацию.',
      },
      {
        text: 'Poor communication only exacerbated the team’s frustration.',
        translation: 'Плохая коммуникация только усугубила недовольство команды.',
      },
    ],
    definition: 'To make a problem or bad situation worse.',
    cefr: 'C1',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000000a',
    itemType: 'sense',
    lemma: 'vanish',
    pos: 'verb',
    ipa: 'ˈvænɪʃ',
    translation: 'исчезать',
    examples: [
      {
        text: 'All the extra positions vanished after the merger.',
        translation: 'Все дополнительные должности исчезли после слияния.',
      },
      {
        text: 'His enthusiasm for the project slowly vanished.',
        translation: 'Его энтузиазм по поводу проекта постепенно исчез.',
      },
    ],
    definition: 'To disappear suddenly and completely.',
    cefr: 'B1',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000000b',
    itemType: 'sense',
    lemma: 'adoption',
    pos: 'noun',
    ipa: 'əˈdɒpʃn',
    translation: 'внедрение (чего-то нового)',
    examples: [
      {
        text: 'The adoption of new software slowed down the whole team.',
        translation: 'Внедрение нового программного обеспечения замедлило работу всей команды.',
      },
      {
        text: 'The adoption of remote work changed office culture completely.',
        translation: 'Внедрение удалённой работы полностью изменило культуру офиса.',
      },
    ],
    definition: 'The act of starting to use something new, such as a technology or policy.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000000c',
    itemType: 'expression',
    lemma: 'to keep up with changes',
    translation: 'не отставать от изменений',
    examples: [
      {
        text: "It's hard to keep up with all the changes at work.",
        translation: 'Трудно не отставать от всех изменений на работе.',
      },
      {
        text: 'New employees often struggle to keep up with changes in company policy.',
        translation: 'Новым сотрудникам часто трудно поспевать за изменениями в политике компании.',
      },
    ],
    definition:
      'Used when trying to stay informed about or adapt to things that are constantly changing.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000000d',
    itemType: 'sense',
    lemma: 'exposed',
    pos: 'adjective',
    ipa: 'ɪkˈspəʊzd',
    translation: 'уязвимый, незащищённый',
    examples: [
      {
        text: 'Without a contract, freelancers are more exposed to risk.',
        translation: 'Без контракта фрилансеры более уязвимы для рисков.',
      },
      {
        text: 'Small businesses are especially exposed during an economic downturn.',
        translation: 'Малый бизнес особенно уязвим во время экономического спада.',
      },
    ],
    definition: 'Not protected from something harmful or risky.',
    cefr: 'B1',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000000e',
    itemType: 'sense',
    lemma: 'redundant',
    pos: 'adjective',
    ipa: 'rɪˈdʌndənt',
    translation: 'сокращаемый, лишний (о должности)',
    examples: [
      {
        text: 'His position became redundant after the merger.',
        translation: 'Его должность сократили после слияния компаний.',
      },
      {
        text: 'Automation made many manual jobs redundant.',
        translation: 'Автоматизация сделала многие ручные должности лишними.',
      },
    ],
    definition:
      'No longer needed, especially describing a job position that a company decides to eliminate.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000000f',
    itemType: 'sense',
    lemma: 'severance',
    pos: 'noun',
    ipa: 'ˈsevərəns',
    translation: 'выходное пособие',
    examples: [
      {
        text: "She received three months' severance after being let go.",
        translation: 'Она получила выходное пособие за три месяца после увольнения.',
      },
      {
        text: 'The company offered a generous severance package to affected employees.',
        translation: 'Компания предложила щедрое выходное пособие пострадавшим сотрудникам.',
      },
    ],
    definition: 'Money paid to an employee when their job ends, especially due to layoffs.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000010',
    itemType: 'sense',
    lemma: 'restructure',
    pos: 'verb',
    ipa: 'riːˈstrʌktʃə',
    translation: 'реструктурировать, проводить реорганизацию',
    examples: [
      {
        text: 'The company plans to restructure its management team.',
        translation: 'Компания планирует реструктурировать команду руководителей.',
      },
      {
        text: 'They had to restructure the loan to avoid bankruptcy.',
        translation: 'Им пришлось реструктурировать кредит, чтобы избежать банкротства.',
      },
    ],
    definition:
      'To change the way a company or organization is organized, often to make it more efficient.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000011',
    itemType: 'sense',
    lemma: 'downsize',
    pos: 'verb',
    ipa: 'ˈdaʊnsaɪz',
    translation: 'сокращать штат',
    examples: [
      {
        text: 'The firm had to downsize after losing its biggest client.',
        translation: 'Фирме пришлось сократить штат после потери крупнейшего клиента.',
      },
      {
        text: 'The company downsized its marketing department last year.',
        translation: 'В прошлом году компания сократила отдел маркетинга.',
      },
    ],
    definition: 'To make a company smaller by reducing the number of employees.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000012',
    itemType: 'sense',
    lemma: 'outsource',
    pos: 'verb',
    ipa: 'ˈaʊtsɔːs',
    translation: 'передавать на аутсорс, привлекать сторонних исполнителей',
    examples: [
      {
        text: 'They decided to outsource customer support to another company.',
        translation: 'Они решили передать поддержку клиентов на аутсорс другой компании.',
      },
      {
        text: 'Many companies outsource software development to save money.',
        translation: 'Многие компании передают разработку ПО на аутсорс, чтобы сэкономить.',
      },
    ],
    definition:
      'To pay another company to do work or provide services instead of doing it yourself.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000013',
    itemType: 'sense',
    lemma: 'compensation',
    pos: 'noun',
    ipa: 'ˌkɒmpenˈseɪʃn',
    translation: 'компенсация, вознаграждение',
    examples: [
      {
        text: 'The compensation package includes health insurance and a bonus.',
        translation: 'Пакет вознаграждения включает медицинскую страховку и премию.',
      },
      {
        text: 'She asked for compensation for the extra hours she worked.',
        translation: 'Она попросила компенсацию за отработанные сверхурочные часы.',
      },
    ],
    definition: 'Money or benefits given to someone in exchange for their work or for a loss.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000014',
    itemType: 'sense',
    lemma: 'leverage',
    pos: 'verb',
    ipa: 'ˈliːvərɪdʒ',
    translation: 'использовать в своих интересах',
    examples: [
      {
        text: 'She leveraged her experience to negotiate a higher salary.',
        translation: 'Она использовала свой опыт, чтобы договориться о более высокой зарплате.',
      },
      {
        text: 'The startup leveraged social media to reach new customers.',
        translation: 'Стартап использовал соцсети, чтобы привлечь новых клиентов.',
      },
    ],
    definition:
      'To use something you already have, such as skills or resources, to gain an advantage.',
    cefr: 'C1',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000015',
    itemType: 'sense',
    lemma: 'mitigate',
    pos: 'verb',
    ipa: 'ˈmɪtɪɡeɪt',
    translation: 'смягчать, снижать (последствия)',
    examples: [
      {
        text: 'The company offered extra training to mitigate the impact of the changes.',
        translation:
          'Компания предложила дополнительное обучение, чтобы смягчить последствия изменений.',
      },
      {
        text: 'Regular backups help mitigate the risk of losing important data.',
        translation: 'Регулярное резервное копирование помогает снизить риск потери важных данных.',
      },
    ],
    definition: 'To make something bad, such as a risk or a negative effect, less severe.',
    cefr: 'C1',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000016',
    itemType: 'sense',
    lemma: 'accountable',
    pos: 'adjective',
    ipa: 'əˈkaʊntəbl',
    translation: 'ответственный, подотчётный',
    examples: [
      {
        text: "Managers are accountable for their team's performance.",
        translation: 'Руководители несут ответственность за результаты своей команды.',
      },
      {
        text: 'Everyone on the project should be accountable for their part of the work.',
        translation: 'Каждый в проекте должен нести ответственность за свою часть работы.',
      },
    ],
    definition: 'Expected to explain your actions and take responsibility for them.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000017',
    itemType: 'sense',
    lemma: 'streamline',
    pos: 'verb',
    ipa: 'ˈstriːmlaɪn',
    translation: 'оптимизировать, упрощать (процесс)',
    examples: [
      {
        text: 'The new software helped streamline the hiring process.',
        translation: 'Новая программа помогла оптимизировать процесс найма.',
      },
      {
        text: 'We streamlined our workflow by removing unnecessary meetings.',
        translation: 'Мы оптимизировали рабочий процесс, убрав ненужные встречи.',
      },
    ],
    definition: 'To make a process simpler and more efficient by removing unnecessary steps.',
    cefr: 'C1',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000018',
    itemType: 'sense',
    lemma: 'viable',
    pos: 'adjective',
    ipa: 'ˈvaɪəbl',
    translation: 'жизнеспособный, реализуемый',
    examples: [
      {
        text: "Working from home isn't a viable option for every role.",
        translation: 'Удалённая работа — не жизнеспособный вариант для любой должности.',
      },
      {
        text: 'The team came up with a viable plan to cut expenses.',
        translation: 'Команда предложила реализуемый план по сокращению расходов.',
      },
    ],
    definition: 'Able to work successfully or be put into practice.',
    cefr: 'C1',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000019',
    itemType: 'sense',
    lemma: 'turnover',
    pos: 'noun',
    ipa: 'ˈtɜːnəʊvə',
    translation: 'текучесть кадров',
    examples: [
      {
        text: 'The department has a high staff turnover.',
        translation: 'В этом отделе высокая текучесть кадров.',
      },
      {
        text: 'High turnover made it hard to keep experienced staff.',
        translation: 'Высокая текучесть кадров затрудняла удержание опытных сотрудников.',
      },
    ],
    definition: 'The rate at which employees leave a company and are replaced by new ones.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000001a',
    itemType: 'sense',
    lemma: 'workforce',
    pos: 'noun',
    ipa: 'ˈwɜːkfɔːs',
    translation: 'рабочая сила, штат сотрудников',
    examples: [
      {
        text: 'The company reduced its workforce by ten percent.',
        translation: 'Компания сократила штат сотрудников на десять процентов.',
      },
      {
        text: 'A skilled workforce is essential for the industry to grow.',
        translation: 'Квалифицированная рабочая сила необходима для роста отрасли.',
      },
    ],
    definition: 'All the people who work for a company or are available for work.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000001b',
    itemType: 'sense',
    lemma: 'contingency',
    pos: 'noun',
    ipa: 'kənˈtɪndʒənsi',
    translation: 'непредвиденное обстоятельство, план на случай чего-либо',
    examples: [
      {
        text: 'They created a contingency plan in case of further layoffs.',
        translation: 'Они разработали план на случай дальнейших сокращений.',
      },
      {
        text: 'The budget includes a contingency fund for unexpected costs.',
        translation: 'В бюджете предусмотрен резервный фонд на непредвиденные расходы.',
      },
    ],
    definition: 'A possible future event or situation that must be prepared for.',
    cefr: 'C1',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000001c',
    itemType: 'sense',
    lemma: 'morale',
    pos: 'noun',
    ipa: 'məˈrɑːl',
    translation: 'моральный дух, настрой (коллектива)',
    examples: [
      {
        text: 'The layoffs badly affected team morale.',
        translation: 'Сокращения сильно повлияли на моральный дух команды.',
      },
      {
        text: 'Free lunches boosted morale in the office.',
        translation: 'Бесплатные обеды подняли моральный дух в офисе.',
      },
    ],
    definition: 'The level of confidence and positive feeling among a group of people.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000001d',
    itemType: 'sense',
    lemma: 'scrutiny',
    pos: 'noun',
    ipa: 'ˈskruːtəni',
    translation: 'тщательная проверка, пристальное внимание',
    examples: [
      {
        text: 'The decision came under close scrutiny from the board.',
        translation: 'Это решение подверглось тщательной проверке со стороны совета директоров.',
      },
      {
        text: 'The company’s finances faced intense public scrutiny.',
        translation: 'Финансы компании оказались под пристальным вниманием общественности.',
      },
    ],
    definition: 'Careful and thorough examination of something.',
    cefr: 'C1',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000001e',
    itemType: 'sense',
    lemma: 'transparent',
    pos: 'adjective',
    ipa: 'trænsˈpærənt',
    translation: 'прозрачный, открытый (честный)',
    examples: [
      {
        text: 'The management was transparent about the reasons for the layoffs.',
        translation: 'Руководство было честным и открытым о причинах сокращений.',
      },
      {
        text: 'We try to be transparent with clients about pricing.',
        translation: 'Мы стараемся быть открытыми с клиентами насчёт цен.',
      },
    ],
    definition: 'Open and honest, without trying to hide information.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-00000000001f',
    itemType: 'sense',
    lemma: 'resilient',
    pos: 'adjective',
    ipa: 'rɪˈzɪliənt',
    translation: 'стойкий, устойчивый к трудностям',
    examples: [
      {
        text: 'Employees who stayed had to be resilient during the changes.',
        translation: 'Оставшимся сотрудникам приходилось проявлять стойкость в период изменений.',
      },
      {
        text: 'Small businesses proved resilient during the economic downturn.',
        translation: 'Малый бизнес оказался устойчивым к трудностям во время экономического спада.',
      },
    ],
    definition: 'Able to recover quickly from difficulties.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000020',
    itemType: 'sense',
    lemma: 'incentive',
    pos: 'noun',
    ipa: 'ɪnˈsentɪv',
    translation: 'стимул, поощрение',
    examples: [
      {
        text: 'The company offered incentives for employees who stayed until the transition ended.',
        translation:
          'Компания предложила поощрения сотрудникам, которые оставались до конца перехода.',
      },
      {
        text: 'A bonus can be a strong incentive to finish the project early.',
        translation: 'Премия может стать сильным стимулом закончить проект досрочно.',
      },
    ],
    definition: 'Something that encourages a person to do something, such as a reward.',
    cefr: 'B2',
  },
  {
    itemId: '0195d700-0000-7000-8000-000000000021',
    itemType: 'sense',
    lemma: 'discrepancy',
    pos: 'noun',
    ipa: 'dɪˈskrepənsi',
    translation: 'несоответствие, расхождение',
    examples: [
      {
        text: 'There was a discrepancy between the two reports.',
        translation: 'Между двумя отчётами было расхождение.',
      },
      {
        text: 'The accountant found a discrepancy in the monthly budget.',
        translation: 'Бухгалтер обнаружил расхождение в месячном бюджете.',
      },
    ],
    definition: 'A difference between two things that should be the same.',
    cefr: 'C1',
  },
  {
    itemId: '01a0ec63-f8b9-72fa-bb00-82f06b6643fb',
    itemType: 'sense',
    lemma: "'m",
    pos: 'be-verb',
    ipa: 'əm',
    translation: 'быть, находиться',
    examples: [
      { text: 'I am tired after work.', translation: 'Я устал после работы.' },
      { text: 'She is a teacher at our school.', translation: 'Она учительница в нашей школе.' },
    ],
    definition: 'Used to say that something exists or is true, or to describe a person or thing.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec63-f9c3-735e-870a-590e944bd2bc',
    itemType: 'sense',
    lemma: "'re",
    pos: 'be-verb',
    translation: 'быть',
    examples: [
      { text: 'I am tired after work.', translation: 'Я устал после работы.' },
      { text: 'She is at home now.', translation: 'Она сейчас дома.' },
    ],
    definition:
      'Used with nouns, adjectives, and places to say what someone or something is, or where they are.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec63-f7d4-7e04-a795-0a677d4e2ec1',
    itemType: 'sense',
    lemma: "'s",
    pos: 'be-verb',
    ipa: 'ˈɛs',
    translation: 'есть, находится',
    examples: [
      { text: 'I’m tired after school.', translation: 'Я устал после школы.' },
      { text: 'The keys are on the table.', translation: 'Ключи лежат на столе.' },
    ],
    definition:
      'The main form of the verb be, used to say who someone is, what something is like, or where someone or something is.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec63-f76a-709c-ab1a-a42a5ad427ee',
    itemType: 'sense',
    lemma: 'a',
    pos: 'determiner',
    ipa: 'ˈeɪ',
    translation: 'один, какой-то',
    examples: [
      { text: 'I saw a dog in the garden.', translation: 'Я увидел собаку в саду.' },
      { text: 'She wants a new phone.', translation: 'Она хочет новый телефон.' },
    ],
    definition:
      'Used before a singular noun when the speaker mentions something for the first time or does not mean one particular thing.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec63-f0a7-757a-8cc7-178c7fbbfd82',
    itemType: 'sense',
    lemma: 'a.m.',
    pos: 'adverb',
    translation: 'до полудня',
    examples: [
      { text: 'The train leaves at 7:30 a.m.', translation: 'Поезд отправляется в 7:30 утра.' },
      { text: 'I usually get up at 6 a.m.', translation: 'Я обычно встаю в 6 утра.' },
    ],
    definition: 'Used after a time to show it is before 12:00 noon.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec63-fe9b-7e57-b183-2e9525e7060b',
    itemType: 'sense',
    lemma: 'about',
    pos: 'adverb',
    ipa: 'ɐbˈaʊt',
    translation: 'примерно, около',
    examples: [
      {
        text: 'There were about twenty people at the party.',
        translation: 'На вечеринке было около двадцати человек.',
      },
      { text: 'It costs about ten dollars.', translation: 'Это стоит примерно десять долларов.' },
    ],
    definition: 'Used to show that a number, time, or amount is not exact.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-05b8-72ce-a9f2-3674674c88d1',
    itemType: 'sense',
    lemma: 'above',
    pos: 'adverb',
    ipa: 'əbˈʌv',
    translation: 'выше, наверху',
    examples: [
      { text: 'The picture hangs above the sofa.', translation: 'Картина висит над диваном.' },
      { text: 'Birds flew above our heads.', translation: 'Птицы пролетели над нашими головами.' },
    ],
    definition: 'At a higher place or position than something else.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-07b9-778a-9fe9-aeb2fc072e90',
    itemType: 'sense',
    lemma: 'action',
    pos: 'noun',
    ipa: 'ˈækʃən',
    translation: 'действие',
    examples: [
      {
        text: 'We need action now, not more talking.',
        translation: 'Нам нужны действия сейчас, а не ещё разговоры.',
      },
      {
        text: 'Her quick action saved the little boy.',
        translation: 'Её быстрые действия спасли мальчика.',
      },
    ],
    definition: 'Something that someone does, especially a step or movement toward a result.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-1709-7687-9dc7-394b6c176e43',
    itemType: 'sense',
    lemma: 'activity',
    pos: 'noun',
    ipa: 'æktˈɪvɪti',
    translation: 'деятельность; занятие',
    examples: [
      {
        text: 'The children need more activity after school.',
        translation: 'Детям нужно больше занятий после школы.',
      },
      {
        text: 'We planned a fun activity for Saturday afternoon.',
        translation: 'Мы запланировали весёлое занятие на субботний день.',
      },
    ],
    definition:
      'Things you do, especially to keep busy or spend time in a useful or enjoyable way.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-0b04-7111-b7b4-bcf58c06fedb',
    itemType: 'sense',
    lemma: 'actor',
    pos: 'noun',
    ipa: 'ˈæktɐ',
    translation: 'актёр',
    examples: [
      {
        text: 'The actor played the king very well.',
        translation: 'Актёр очень хорошо сыграл короля.',
      },
      {
        text: 'She wants to be an actor one day.',
        translation: 'Она хочет однажды стать актёром.',
      },
    ],
    definition: 'A person whose job is to play a part in a film, play, or TV show.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-1263-71a0-ac75-bacd18a5fc8c',
    itemType: 'sense',
    lemma: 'add',
    pos: 'verb',
    ipa: 'ˈæd',
    translation: 'добавлять',
    examples: [
      { text: 'Add some sugar to the tea.', translation: 'Добавь немного сахара в чай.' },
      {
        text: 'They added three chairs to the room.',
        translation: 'Они добавили в комнату три стула.',
      },
    ],
    definition: 'to put one thing with another thing, or increase the amount of something',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-1324-76e8-ad2c-dafd0523ccae',
    itemType: 'sense',
    lemma: 'afraid',
    pos: 'adjective',
    ipa: 'ɐfɹˈeɪd',
    translation: 'испуганный, боится',
    examples: [
      { text: 'She is afraid of dogs.', translation: 'Она боится собак.' },
      { text: "Don't be afraid to ask questions.", translation: 'Не бойся задавать вопросы.' },
    ],
    definition:
      'Feeling fear, worry, or nervousness because something may happen or seem dangerous.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-1707-7ecf-b03a-f27ad6f6e2d1',
    itemType: 'sense',
    lemma: 'after',
    pos: 'preposition',
    ipa: 'ˈɑːftɐ',
    translation: 'после',
    examples: [
      { text: 'We met after lunch.', translation: 'Мы встретились после обеда.' },
      { text: 'After the lesson, I went home.', translation: 'После урока я пошёл домой.' },
    ],
    definition: 'When one thing happens later than another thing in time.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-1467-7aaa-8134-8600cf5a7a21',
    itemType: 'sense',
    lemma: 'afternoon',
    pos: 'noun',
    ipa: 'ˌæftɝˈnun',
    translation: 'день, после полудня',
    examples: [
      { text: 'We have a meeting in the afternoon.', translation: 'У нас встреча днем.' },
      {
        text: 'The kids play outside every afternoon.',
        translation: 'Дети играют на улице каждый день после обеда.',
      },
    ],
    definition: 'The time of day between noon and evening.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-1e26-7395-b784-dee0852ec8c0',
    itemType: 'sense',
    lemma: 'again',
    pos: 'adverb',
    ipa: 'ɐɡˈɛn',
    translation: 'снова, опять',
    examples: [
      { text: 'Please say that again.', translation: 'Пожалуйста, скажите это ещё раз.' },
      {
        text: 'She called me again this morning.',
        translation: 'Она снова позвонила мне сегодня утром.',
      },
    ],
    definition: 'One more time, after something has already happened or been done.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-1e2c-773d-9fd1-7a02fc252efd',
    itemType: 'sense',
    lemma: 'age',
    pos: 'noun',
    ipa: 'ˈeɪdʒ',
    translation: 'возраст',
    examples: [
      { text: 'What is your age?', translation: 'Сколько вам лет?' },
      { text: 'My age is twelve now.', translation: 'Мне сейчас двенадцать лет.' },
    ],
    definition: 'The number of years someone or something has existed.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-1d2c-702b-82bf-5445a6285baf',
    itemType: 'sense',
    lemma: 'ago',
    pos: 'adverb',
    ipa: 'ɐɡˈəʊ',
    translation: 'назад',
    examples: [
      { text: 'I moved here two years ago.', translation: 'Я переехал сюда два года назад.' },
      { text: 'She left ten minutes ago.', translation: 'Она ушла десять минут назад.' },
    ],
    definition: 'Used after a time period to say how far in the past something happened.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-24df-74df-9704-846025393a81',
    itemType: 'sense',
    lemma: 'agree',
    pos: 'verb',
    ipa: 'ɐɡɹˈiː',
    translation: 'соглашаться',
    examples: [
      {
        text: 'I agree with you about the movie.',
        translation: 'Я согласен с тобой насчёт фильма.',
      },
      {
        text: 'We all agreed to meet at six.',
        translation: 'Мы все согласились встретиться в шесть.',
      },
    ],
    definition: 'to have the same opinion as someone or to say yes to an idea or plan',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-1da9-7654-955e-c7f3734d3718',
    itemType: 'sense',
    lemma: 'airplane',
    pos: 'noun',
    ipa: 'ˈɛɹˌpɫeɪn',
    translation: 'самолёт',
    examples: [
      {
        text: 'The airplane landed safely after the storm.',
        translation: 'Самолёт благополучно приземлился после шторма.',
      },
      {
        text: 'She watched the airplane from her window.',
        translation: 'Она смотрела на самолёт из своего окна.',
      },
    ],
    definition: 'A flying vehicle with wings that carries people or goods through the air.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-2705-7dca-b03d-ab975babc408',
    itemType: 'sense',
    lemma: 'airport',
    pos: 'noun',
    ipa: 'ˈeəpɔːt',
    translation: 'аэропорт',
    examples: [
      {
        text: 'We arrived at the airport two hours early.',
        translation: 'Мы приехали в аэропорт за два часа до вылета.',
      },
      {
        text: 'The airport was busy with holiday travelers.',
        translation: 'В аэропорту было много праздничных путешественников.',
      },
    ],
    definition:
      'A place where airplanes take off and land, and where passengers check in and pass through security.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-2639-7511-ad71-466e9a8cf8af',
    itemType: 'sense',
    lemma: 'album',
    pos: 'noun',
    ipa: 'ˈælbəm',
    translation: 'альбом',
    examples: [
      {
        text: 'She showed me her holiday album.',
        translation: 'Она показала мне свой альбом с отпуска.',
      },
      {
        text: 'We made an album of our family photos.',
        translation: 'Мы сделали альбом с семейными фотографиями.',
      },
    ],
    definition: 'A book or digital collection of photos, pictures, or stickers kept together.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-29f1-7e4f-b0a2-cb8b013ccc2d',
    itemType: 'sense',
    lemma: 'all',
    pos: 'determiner',
    ipa: 'ˈɔːl',
    translation: 'весь, все',
    examples: [
      {
        text: 'All students must bring a notebook.',
        translation: 'Все ученики должны принести тетрадь.',
      },
      { text: 'She ate all the cake by herself.', translation: 'Она съела весь торт сама.' },
    ],
    definition:
      'Used before a noun to mean every person or thing in a group, or the whole amount of something.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-2e5d-707a-a9ea-943d258310bd',
    itemType: 'sense',
    lemma: 'all right',
    pos: 'adjective',
    ipa: 'ˈɔːl ɹˈaɪt',
    translation: 'нормальный, в порядке',
    examples: [
      {
        text: 'Your idea is all right for today.',
        translation: 'Твоя идея сегодня вполне нормальная.',
      },
      {
        text: 'The weather is all right, so we can walk.',
        translation: 'Погода нормальная, так что мы можем идти пешком.',
      },
    ],
    definition: 'Acceptable, satisfactory, or not bad.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-3098-73cf-b69b-49d0f94ae226',
    itemType: 'sense',
    lemma: 'almost',
    pos: 'adverb',
    ipa: 'ˈɔːlməʊst',
    translation: 'почти, едва не',
    examples: [
      {
        text: 'I almost missed the train this morning.',
        translation: 'Я почти опоздал на поезд сегодня утром.',
      },
      { text: 'The glass is almost empty.', translation: 'Стакан почти пустой.' },
    ],
    definition:
      'Used to say that something is very near to happening, being true, or being complete.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-32e0-71c8-823f-eab1e6a8f23f',
    itemType: 'sense',
    lemma: 'alone',
    pos: 'adverb',
    ipa: 'ɐlˈəʊn',
    translation: 'один, без других',
    examples: [
      {
        text: 'I like walking alone in the park.',
        translation: 'Мне нравится гулять одному в парке.',
      },
      { text: 'She ate lunch alone today.', translation: 'Сегодня она пообедала одна.' },
    ],
    definition: 'Without other people with you.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-37a2-7353-b1d7-1891f4a28182',
    itemType: 'sense',
    lemma: 'along',
    pos: 'adverb',
    ipa: 'ɐlˈɒŋ',
    translation: 'вдоль',
    examples: [
      { text: 'We walked along the river for an hour.', translation: 'Мы шли вдоль реки час.' },
      { text: 'The bus goes along this street.', translation: 'Автобус идет по этой улице.' },
    ],
    definition: 'Moving in the same direction as a line, road, river, or edge.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-38f2-743c-878e-1a4b5e9153c4',
    itemType: 'sense',
    lemma: 'already',
    pos: 'adverb',
    ipa: 'ɔːlɹˈɛdi',
    translation: 'уже',
    examples: [
      {
        text: 'I’ve already finished my homework.',
        translation: 'Я уже сделал(а) домашнее задание.',
      },
      { text: 'Are you leaving already?', translation: 'Ты уже уходишь?' },
    ],
    definition: 'Up to now or before the time you are talking about.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-3b97-799c-a285-1410b68119e4',
    itemType: 'sense',
    lemma: 'also',
    pos: 'adverb',
    ipa: 'ˈɒlsəʊ',
    translation: 'тоже',
    examples: [
      {
        text: 'I like tea, and I also like coffee.',
        translation: 'Я люблю чай, и я тоже люблю кофе.',
      },
      {
        text: 'She works here and also studies at night.',
        translation: 'Она работает здесь и тоже учится по вечерам.',
      },
    ],
    definition: 'Used to add another fact, person, or thing to what you have already said.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-3c38-7ace-89c5-0ead07207821',
    itemType: 'sense',
    lemma: 'always',
    pos: 'adverb',
    ipa: 'ˈɔːlweɪz',
    translation: 'всегда',
    examples: [
      { text: 'She always drinks tea in the morning.', translation: 'Она всегда пьёт чай утром.' },
      {
        text: 'We always visit my grandparents on Sundays.',
        translation: 'Мы всегда навещаем бабушку и дедушку по воскресеньям.',
      },
    ],
    definition: 'At all times; on every occasion.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-4038-7710-89f2-62b5e7b9af7a',
    itemType: 'sense',
    lemma: 'am',
    pos: 'be-verb',
    ipa: 'ˈæm',
    translation: 'есть, нахожусь',
    examples: [
      { text: 'I am tired after work.', translation: 'Я устал после работы.' },
      { text: 'I am at home now.', translation: 'Я сейчас дома.' },
    ],
    definition:
      'The first-person singular form of be, used to say who someone is, what state they are in, or where they are.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-4904-7931-b6b3-7c9171e51f8b',
    itemType: 'sense',
    lemma: 'an',
    pos: 'determiner',
    ipa: 'ˈɐn',
    translation: 'неопределённый артикль',
    examples: [
      { text: 'I ate an apple for breakfast.', translation: 'Я съел яблоко на завтрак.' },
      { text: 'She is an honest person.', translation: 'Она честный человек.' },
    ],
    definition: 'A determiner used before singular nouns that begin with a vowel sound.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-4dd3-79ac-874b-8e7296fa9da9',
    itemType: 'sense',
    lemma: 'and',
    pos: 'conjunction',
    ipa: 'ˈænd',
    translation: 'и',
    examples: [
      { text: 'We need milk and bread.', translation: 'Нам нужны молоко и хлеб.' },
      { text: 'She sings and plays the guitar.', translation: 'Она поёт и играет на гитаре.' },
    ],
    definition: 'Used to join words, phrases, or clauses with the same or similar importance.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-45a3-722e-a441-5aca11bf8a7c',
    itemType: 'sense',
    lemma: 'angry',
    pos: 'adjective',
    ipa: 'ˈæŋɡɹi',
    translation: 'сердитый, злой',
    examples: [
      {
        text: 'She was angry about the broken phone.',
        translation: 'Она злилась из-за сломанного телефона.',
      },
      {
        text: 'My dad looked angry after the call.',
        translation: 'Папа выглядел сердитым после звонка.',
      },
    ],
    definition: 'feeling strong dislike or frustration because something bad or unfair happened',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-4436-735e-bbc6-b8316ef6f2a4',
    itemType: 'sense',
    lemma: 'animal',
    pos: 'noun',
    ipa: 'ˈænɪməl',
    translation: 'животное',
    examples: [
      {
        text: 'Some animals sleep all day in winter.',
        translation: 'Некоторые животные спят весь день зимой.',
      },
      {
        text: 'The zoo has animals from many countries.',
        translation: 'В зоопарке есть животные из многих стран.',
      },
    ],
    definition:
      'a living creature that is not a plant, especially one that is not a bird, fish, or human',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-4ce8-73e6-a216-5b68fc6cf0de',
    itemType: 'sense',
    lemma: 'another',
    pos: 'determiner',
    ipa: 'ɐnˈʌðɐ',
    translation: 'ещё один',
    examples: [
      { text: 'Can I have another cup of tea?', translation: 'Можно мне ещё одну чашку чая?' },
      { text: 'We need another chair for Dad.', translation: 'Нам нужен ещё один стул для папы.' },
    ],
    definition: 'One more person or thing of the same kind.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-4d0c-7489-b405-21579e5325bf',
    itemType: 'sense',
    lemma: 'answer',
    pos: 'noun',
    ipa: 'ˈɑːnsɐ',
    translation: 'ответ',
    examples: [
      {
        text: 'She gave a quick answer to my question.',
        translation: 'Она быстро ответила на мой вопрос.',
      },
      {
        text: 'I still need an answer by Friday.',
        translation: 'Мне всё ещё нужен ответ к пятнице.',
      },
    ],
    definition: 'Something you say or write to reply to a question or request.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-5027-7902-b7c6-1deb3e51e701',
    itemType: 'sense',
    lemma: 'any',
    pos: 'determiner',
    ipa: 'ˈɛni',
    translation: 'любой, какой-нибудь',
    examples: [
      { text: 'Do you have any questions?', translation: 'У вас есть какие-нибудь вопросы?' },
      { text: 'Take any book you like.', translation: 'Возьми любую книгу, какая тебе нравится.' },
    ],
    definition:
      'Used before a noun to mean one, some, or all of a thing when it does not matter which one.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-5452-7baf-9526-1b149054f3fa',
    itemType: 'sense',
    lemma: 'anybody',
    pos: 'pronoun',
    ipa: 'ˈɛnɪbˌɒdi',
    translation: 'любой человек',
    examples: [
      { text: 'Does anybody know the answer?', translation: 'Кто-нибудь знает ответ?' },
      {
        text: "I don't think anybody called me today.",
        translation: 'Не думаю, что мне сегодня кто-нибудь звонил.',
      },
    ],
    definition: 'Used to mean any person at all, often in questions and negatives.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-570a-715c-bbbf-d6cbb7a41400',
    itemType: 'sense',
    lemma: 'anyone',
    pos: 'pronoun',
    ipa: 'ˈɛnɪwˌɒn',
    translation: 'кто-нибудь',
    examples: [
      {
        text: 'Anyone can join the class.',
        translation: 'Кто угодно может присоединиться к уроку.',
      },
      { text: 'Is there anyone at home?', translation: 'Кто-нибудь есть дома?' },
    ],
    definition:
      'Any person at all; used when you do not know, do not say, or do not care which person.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-5c04-7dda-9a75-7b59ff795c8e',
    itemType: 'sense',
    lemma: 'anything',
    pos: 'pronoun',
    ipa: 'ˈɛnɪθˌɪŋ',
    translation: 'что-нибудь',
    examples: [
      {
        text: 'If you need anything, call me.',
        translation: 'Если тебе что-нибудь нужно, позвони мне.',
      },
      {
        text: "I can't think of anything right now.",
        translation: 'Сейчас я не могу ничего придумать.',
      },
    ],
    definition: 'Used to refer to a thing, fact, or amount without saying exactly what.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-5ac6-7597-a29d-facd4a47c74e',
    itemType: 'sense',
    lemma: 'apple',
    pos: 'noun',
    ipa: 'ˈæpəl',
    translation: 'яблоко',
    examples: [
      { text: 'She ate an apple after lunch.', translation: 'Она съела яблоко после обеда.' },
      { text: 'These apples are sweet and fresh.', translation: 'Эти яблоки сладкие и свежие.' },
    ],
    definition: 'A round fruit with red, green, or yellow skin and crisp flesh.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-596c-741c-aa53-30d302e6543e',
    itemType: 'sense',
    lemma: 'April',
    pos: 'noun',
    ipa: 'ˈeɪpɹəɫ',
    translation: 'апрель',
    examples: [
      {
        text: 'We usually visit my grandparents in April.',
        translation: 'Мы обычно навещаем бабушку и дедушку в апреле.',
      },
      {
        text: 'April is often rainy in our town.',
        translation: 'В апреле в нашем городе часто идут дожди.',
      },
    ],
    definition: 'The fourth month of the year, after March and before May.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-5f2b-7568-8961-fb88ffcc545f',
    itemType: 'sense',
    lemma: 'apron',
    pos: 'noun',
    ipa: 'ˈeɪpɹən',
    translation: 'фартук',
    examples: [
      {
        text: 'She wears an apron when she cooks dinner.',
        translation: 'Она надевает фартук, когда готовит ужин.',
      },
      {
        text: 'Please put on an apron before painting.',
        translation: 'Пожалуйста, надень фартук перед покраской.',
      },
    ],
    definition:
      'A piece of cloth or plastic worn over the front of your clothes to protect them while cooking, cleaning, or working.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-6557-790f-b950-7d417db1d3d2',
    itemType: 'sense',
    lemma: 'are',
    pos: 'be-verb',
    ipa: 'ˈɑɹ',
    translation: 'есть, являться',
    examples: [
      { text: 'We are ready to go now.', translation: 'Мы готовы идти сейчас.' },
      { text: 'You are my best friend.', translation: 'Ты мой лучший друг.' },
    ],
    definition: 'The plural form of be, used with plural subjects and with you.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-647f-7528-acef-8537d8657c52',
    itemType: 'sense',
    lemma: 'arm',
    pos: 'noun',
    ipa: 'ˈɑːm',
    translation: 'рука',
    examples: [
      { text: 'She carried the baby in her arms.', translation: 'Она держала малыша на руках.' },
      {
        text: 'He broke his arm skiing last winter.',
        translation: 'Он сломал руку, катаясь на лыжах прошлой зимой.',
      },
    ],
    definition: 'Each of the two long body parts between your shoulders and your hands.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-69d2-7e66-9537-a34e3c1c6a83',
    itemType: 'sense',
    lemma: 'around',
    pos: 'preposition',
    ipa: 'ɐɹˈaʊnd',
    translation: 'вокруг',
    examples: [
      { text: 'There are trees around the house.', translation: 'Вокруг дома растут деревья.' },
      { text: 'She wore a scarf around her neck.', translation: 'Она носила шарф вокруг шеи.' },
    ],
    definition: 'On every side of something or surrounding it.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-66e7-73b4-8666-4ab20ad47c7d',
    itemType: 'sense',
    lemma: 'arrive',
    pos: 'verb',
    ipa: 'ɐɹˈaɪv',
    translation: 'приезжать',
    examples: [
      {
        text: 'We arrived at the hotel late at night.',
        translation: 'Мы приехали в отель поздно ночью.',
      },
      {
        text: 'The train arrives in London at noon.',
        translation: 'Поезд прибывает в Лондон в полдень.',
      },
    ],
    definition: 'To get to a place where you were going.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-6936-7b7a-a10f-e689a8d94f69',
    itemType: 'sense',
    lemma: 'art',
    pos: 'noun',
    ipa: 'ˈɑːt',
    translation: 'искусство',
    examples: [
      {
        text: 'She loves art and visits museums every week.',
        translation: 'Она любит искусство и ходит в музеи каждую неделю.',
      },
      {
        text: 'Our school art class is on Friday afternoons.',
        translation: 'Урок искусства в нашей школе проходит по пятницам после обеда.',
      },
    ],
    definition: 'The making of drawings, paintings, sculptures, music, or other creative works.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-7094-73bd-b499-11de87aeba9d',
    itemType: 'sense',
    lemma: 'article',
    pos: 'noun',
    ipa: 'ˈɑːtɪkəl',
    translation: 'статья, заметка',
    examples: [
      {
        text: 'I read an article about trains this morning.',
        translation: 'Сегодня утром я прочитал статью о поездах.',
      },
      {
        text: 'She wrote an article for the school magazine.',
        translation: 'Она написала заметку для школьного журнала.',
      },
    ],
    definition: 'A short piece of writing in a newspaper, magazine, or on a website.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-728b-717f-b72c-c1b522615889',
    itemType: 'sense',
    lemma: 'as',
    pos: 'preposition',
    ipa: 'ˈæz',
    translation: 'как',
    examples: [
      { text: 'She works as a nurse.', translation: 'Она работает медсестрой.' },
      { text: 'Use this box as a table.', translation: 'Используйте этот ящик как стол.' },
    ],
    definition: 'Used to say what role, function, or job someone or something has.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-7030-7d32-9b9f-31b38d394690',
    itemType: 'sense',
    lemma: 'ask',
    pos: 'verb',
    ipa: 'ˈɑːsk',
    translation: 'спрашивать',
    examples: [
      { text: 'She asked my name at the door.', translation: 'Она спросила моё имя у двери.' },
      { text: 'Can I ask a question now?', translation: 'Можно я задам вопрос сейчас?' },
    ],
    definition: 'to say something to someone in order to get information or an answer',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-79d2-7e8c-b0af-54cdb525203f',
    itemType: 'sense',
    lemma: 'at',
    pos: 'preposition',
    ipa: 'ˈæt',
    translation: 'в, у',
    examples: [
      { text: 'She is at home now.', translation: 'Она сейчас дома.' },
      { text: 'We met at the station.', translation: 'Мы встретились на станции.' },
    ],
    definition: 'Used to say where someone or something is, or where an event happens.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-6eea-7c93-95d3-f496da559a10',
    itemType: 'sense',
    lemma: 'August',
    pos: 'noun',
    ipa: 'ˈɑɡəst',
    translation: 'август',
    examples: [
      {
        text: 'We usually go camping in August.',
        translation: 'Обычно мы ходим в поход в августе.',
      },
      { text: 'My birthday is in August.', translation: 'Мой день рождения в августе.' },
    ],
    definition: 'The eighth month of the year, after July and before September.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-749f-725a-a998-1cd75599887e',
    itemType: 'sense',
    lemma: 'aunt',
    pos: 'noun',
    ipa: 'ˈɑːnt',
    translation: 'тетя',
    examples: [
      { text: 'My aunt lives in another city.', translation: 'Моя тетя живет в другом городе.' },
      {
        text: 'We visited our aunt last Sunday.',
        translation: 'Мы навещали нашу тетю в прошлое воскресенье.',
      },
    ],
    definition: 'Your aunt is the sister of your mother or father, or the wife of your uncle.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-79f6-743c-ac1c-092495b4967a',
    itemType: 'sense',
    lemma: 'autumn',
    pos: 'noun',
    ipa: 'ˈɔːtʌm',
    translation: 'осень',
    examples: [
      {
        text: 'Autumn starts in September here.',
        translation: 'Осень здесь начинается в сентябре.',
      },
      { text: 'We like long walks in autumn.', translation: 'Мы любим долгие прогулки осенью.' },
    ],
    definition: 'The season after summer and before winter.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-784e-7eb2-92d9-0226affa12aa',
    itemType: 'sense',
    lemma: 'awake',
    pos: 'adjective',
    ipa: 'ɐwˈeɪk',
    translation: 'не спящий',
    examples: [
      { text: 'I stayed awake until midnight.', translation: 'Я не спал до полуночи.' },
      {
        text: 'She is still awake after the film.',
        translation: 'После фильма она всё ещё не спит.',
      },
    ],
    definition: 'not sleeping and able to notice what is happening around you',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-84c2-70d6-a224-71a2716b4001',
    itemType: 'sense',
    lemma: 'away',
    pos: 'adverb',
    ipa: 'ɐwˈeɪ',
    translation: 'в стороне, прочь',
    examples: [
      {
        text: 'My keys are away on the shelf.',
        translation: 'Мои ключи лежат в стороне, на полке.',
      },
      { text: 'Please step away from the door.', translation: 'Пожалуйста, отойдите от двери.' },
    ],
    definition: 'At or to a place that is not here, or at some distance from someone or something.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-8490-7efa-98b7-7a10907dd7be',
    itemType: 'sense',
    lemma: 'baby',
    pos: 'noun',
    ipa: 'bˈeɪbi',
    translation: 'младенец',
    examples: [
      { text: 'The baby slept in her arms.', translation: 'Младенец спал у неё на руках.' },
      {
        text: 'Our baby smiles when he hears music.',
        translation: 'Наш младенец улыбается, когда слышит музыку.',
      },
    ],
    definition: 'A very young child, especially one who cannot yet walk or talk.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-86c5-7ec6-a4f4-a9adb1c439a6',
    itemType: 'sense',
    lemma: 'back',
    pos: 'adverb',
    ipa: 'bˈæk',
    translation: 'назад',
    examples: [
      { text: 'Please come back after lunch.', translation: 'Пожалуйста, вернись после обеда.' },
      { text: 'She looked back at the house.', translation: 'Она оглянулась на дом.' },
    ],
    definition: 'To or toward the place where someone or something was before.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-8905-78dc-8f0d-cb41cb20f823',
    itemType: 'sense',
    lemma: 'bad',
    pos: 'adjective',
    ipa: 'bˈæd',
    translation: 'плохой',
    examples: [
      { text: 'This soup is bad.', translation: 'Этот суп плохой.' },
      { text: 'I had a bad day at school.', translation: 'У меня был плохой день в школе.' },
    ],
    definition: 'of low quality, or not good enough in a general way',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-9734-74bc-9233-d362122c2345',
    itemType: 'sense',
    lemma: 'bag',
    pos: 'noun',
    ipa: 'bˈæɡ',
    translation: 'сумка',
    examples: [
      { text: 'She put her phone in her bag.', translation: 'Она положила телефон в сумку.' },
      { text: 'Can you carry this bag for me?', translation: 'Можешь понести эту сумку за меня?' },
    ],
    definition:
      'A bag is a container made of cloth, plastic, paper, or leather, used for carrying things.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-91b6-797a-874f-fc8b30f30ade',
    itemType: 'sense',
    lemma: 'ball',
    pos: 'noun',
    ipa: 'bˈɔːl',
    translation: 'мяч; шар',
    examples: [
      {
        text: 'The children kicked the ball in the park.',
        translation: 'Дети пинали мяч в парке.',
      },
      {
        text: 'She rolled a ball of paper across the desk.',
        translation: 'Она прокатила шарик из бумаги по столу.',
      },
    ],
    definition: 'A round object used in games or as a toy, or a small round object in general.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-89d0-7df3-80db-4b22f6516aca',
    itemType: 'sense',
    lemma: 'banana',
    pos: 'noun',
    ipa: 'bɐnˈɑːnɐ',
    translation: 'банан',
    examples: [
      { text: 'I eat a banana every morning.', translation: 'Я ем банан каждое утро.' },
      {
        text: 'These bananas are very sweet today.',
        translation: 'Эти бананы сегодня очень сладкие.',
      },
    ],
    definition: 'A long yellow fruit with soft white inside that grows in warm countries.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-923f-7c66-95ed-ddf89e41dc08',
    itemType: 'sense',
    lemma: 'band',
    pos: 'noun',
    ipa: 'bˈænd',
    translation: 'группа музыкантов',
    examples: [
      {
        text: 'Their band plays on Friday nights.',
        translation: 'Их группа играет по пятницам вечером.',
      },
      { text: 'She sings in a school band.', translation: 'Она поёт в школьной группе.' },
    ],
    definition: 'A group of people who play popular music together.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-93a2-77da-9803-740483279ea8',
    itemType: 'sense',
    lemma: 'bank',
    pos: 'noun',
    ipa: 'bˈæŋk',
    translation: 'банк',
    examples: [
      { text: 'I need to go to the bank today.', translation: 'Мне нужно сегодня пойти в банк.' },
      { text: 'She opened a new bank account.', translation: 'Она открыла новый банковский счёт.' },
    ],
    definition:
      'A bank is a business where people keep money, get loans, and use other financial services.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-97fc-7676-a70b-3bcb7f076aa6',
    itemType: 'sense',
    lemma: 'bar',
    pos: 'noun',
    ipa: 'bˈɑː',
    translation: 'бар',
    examples: [
      { text: 'We met at the bar after work.', translation: 'Мы встретились в баре после работы.' },
      { text: 'The hotel bar opens at six.', translation: 'Бар в отеле открывается в шесть.' },
    ],
    definition:
      'A place where people buy and drink alcohol, and sometimes other drinks and snacks.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-9c37-7bf1-aaf8-50a60e58951d',
    itemType: 'sense',
    lemma: 'baseball',
    pos: 'noun',
    ipa: 'bˈeɪsbɔːl',
    translation: 'бейсбол',
    examples: [
      {
        text: 'He plays baseball every Saturday in the park.',
        translation: 'Он играет в бейсбол каждую субботу в парке.',
      },
      {
        text: 'My brother watches baseball on TV at night.',
        translation: 'Мой брат вечером смотрит бейсбол по телевизору.',
      },
    ],
    definition: 'A game played between two teams with a bat and a ball.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-9c4c-7b8c-a1a7-6e8aeae9b1cc',
    itemType: 'sense',
    lemma: 'basketball',
    pos: 'noun',
    ipa: 'bˈɑːskɪtbˌɔːl',
    translation: 'баскетбол',
    examples: [
      {
        text: 'We play basketball after school on Fridays.',
        translation: 'Мы играем в баскетбол после школы по пятницам.',
      },
      {
        text: 'His little brother wants to learn basketball.',
        translation: 'Его младший брат хочет научиться играть в баскетбол.',
      },
    ],
    definition:
      'A team sport in which players try to score points by throwing a ball through a high net.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-9e7d-7f12-904d-56f39947982a',
    itemType: 'sense',
    lemma: 'bat',
    pos: 'noun',
    ipa: 'bˈæt',
    translation: 'летучая мышь',
    examples: [
      {
        text: 'A bat flew into the dark cave.',
        translation: 'Летучая мышь влетела в тёмную пещеру.',
      },
      {
        text: 'We saw bats near the old house.',
        translation: 'Мы видели летучих мышей возле старого дома.',
      },
    ],
    definition: 'A small animal with wings that flies at night and sleeps upside down.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-a0d5-7874-8059-294d1f1fbcd0',
    itemType: 'sense',
    lemma: 'bath',
    pos: 'noun',
    ipa: 'bˈɑːθ',
    translation: 'ванна',
    examples: [
      { text: 'The baby had a bath before bed.', translation: 'Ребёнок принял ванну перед сном.' },
      { text: 'I filled the bath with warm water.', translation: 'Я наполнил ванну тёплой водой.' },
    ],
    definition: 'A large container for washing your body while sitting or lying in water.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-9fe4-7ca9-98a1-2633038aeb2b',
    itemType: 'sense',
    lemma: 'bathroom',
    pos: 'noun',
    ipa: 'bˈɑːθɹuːm',
    translation: 'ванная комната',
    examples: [
      {
        text: 'The bathroom is next to my bedroom.',
        translation: 'Ванная комната рядом с моей спальней.',
      },
      {
        text: 'She cleaned the bathroom after breakfast.',
        translation: 'Она убрала ванную комнату после завтрака.',
      },
    ],
    definition: 'A room in a house or flat where you wash, bathe, or use the toilet.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-a7c6-7d71-b805-4a4ce2f2d053',
    itemType: 'sense',
    lemma: 'be',
    pos: 'be-verb',
    ipa: 'bˈiː',
    translation: 'быть; находиться',
    examples: [
      { text: 'I am tired after work.', translation: 'Я устал после работы.' },
      { text: 'The keys are on the table.', translation: 'Ключи на столе.' },
    ],
    definition:
      'Used to say what someone or something is, where someone or something is, or what state they are in.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-a1ad-73ee-bfe9-1cbfafa3d0a3',
    itemType: 'sense',
    lemma: 'beach',
    pos: 'noun',
    ipa: 'bˈiːtʃ',
    translation: 'пляж',
    examples: [
      { text: 'We spent the afternoon at the beach.', translation: 'Мы провели день на пляже.' },
      {
        text: 'The children built a castle on the beach.',
        translation: 'Дети построили замок на пляже.',
      },
    ],
    definition:
      'A sandy or pebbly area next to the sea, a lake, or a river where people go to relax or swim.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-a976-7d22-8f97-0e54ea3e13f0',
    itemType: 'sense',
    lemma: 'bean',
    pos: 'noun',
    ipa: 'bˈiːn',
    translation: 'боб',
    examples: [
      { text: 'I put beans in the soup.', translation: 'Я положил бобы в суп.' },
      {
        text: 'She bought green beans at the market.',
        translation: 'Она купила зелёную фасоль на рынке.',
      },
    ],
    definition: 'A bean is a small seed used as food, often cooked before eating.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-aa10-7ddd-8e86-221d33a398ea',
    itemType: 'sense',
    lemma: 'bear',
    pos: 'noun',
    ipa: 'bˈeə',
    translation: 'медведь',
    examples: [
      { text: 'We saw a bear near the river.', translation: 'Мы увидели медведя у реки.' },
      { text: 'The bear ate berries in the forest.', translation: 'Медведь ел ягоды в лесу.' },
    ],
    definition: 'A large wild animal with thick fur that can stand and walk on two legs.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-ac7a-72fd-8ff4-f0193af0743a',
    itemType: 'sense',
    lemma: 'beautiful',
    pos: 'adjective',
    ipa: 'bjˈuːtɪfəl',
    translation: 'красивый',
    examples: [
      {
        text: 'She wore a beautiful red dress.',
        translation: 'На ней было красивое красное платье.',
      },
      {
        text: 'The lake looks beautiful in the morning light.',
        translation: 'Озеро выглядит красиво в утреннем свете.',
      },
    ],
    definition: 'Pleasant to look at; very attractive.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-a676-757e-b93d-24393733cc45',
    itemType: 'sense',
    lemma: 'because',
    pos: 'conjunction',
    ipa: 'bɪkˈʌz',
    translation: 'потому что',
    examples: [
      {
        text: 'I stayed home because I felt tired.',
        translation: 'Я остался дома, потому что устал.',
      },
      {
        text: 'She smiled because she knew the answer.',
        translation: 'Она улыбнулась, потому что знала ответ.',
      },
    ],
    definition: 'Used to give the reason for something.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-b1a1-7ed8-b36a-c7c1479df59e',
    itemType: 'sense',
    lemma: 'become',
    pos: 'verb',
    ipa: 'bɪkˈʌm',
    translation: 'становиться',
    examples: [
      {
        text: 'She became tired after the long walk.',
        translation: 'Она устала после долгой прогулки.',
      },
      { text: 'It became dark very quickly.', translation: 'Скоро стемнело очень быстро.' },
    ],
    definition: 'To begin to be something or to change into a new state, age, or form.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-b799-707e-9a1e-c9ebdf834465',
    itemType: 'sense',
    lemma: 'bed',
    pos: 'noun',
    ipa: 'bˈɛd',
    translation: 'кровать',
    examples: [
      { text: 'I left my phone on the bed.', translation: 'Я оставил телефон на кровати.' },
      { text: 'The children jumped on the bed.', translation: 'Дети прыгали на кровати.' },
    ],
    definition: 'A piece of furniture that you sleep on.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-af26-7e2e-b923-225e77c6c10a',
    itemType: 'sense',
    lemma: 'bedroom',
    pos: 'noun',
    ipa: 'bˈɛdɹuːm',
    translation: 'спальня',
    examples: [
      {
        text: 'My bedroom is small but very bright.',
        translation: 'Моя спальня маленькая, но очень светлая.',
      },
      {
        text: 'We put the baby in the bedroom early.',
        translation: 'Мы рано уложили ребёнка в спальне.',
      },
    ],
    definition: 'A room in a house or flat where people sleep.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-af5b-793e-9c65-6b874f29ce88',
    itemType: 'sense',
    lemma: 'bee',
    pos: 'noun',
    ipa: 'bˈiː',
    translation: 'пчела',
    examples: [
      { text: 'A bee landed on the flower.', translation: 'Пчела села на цветок.' },
      {
        text: 'We saw bees near the old tree.',
        translation: 'Мы увидели пчёл возле старого дерева.',
      },
    ],
    definition: 'A bee is a flying insect that makes honey and can sting.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-b5f1-7a32-a84d-9df9a4618989',
    itemType: 'sense',
    lemma: 'beef',
    pos: 'noun',
    ipa: 'bˈiːf',
    translation: 'говядина',
    examples: [
      {
        text: 'We had beef for dinner last night.',
        translation: 'Вчера вечером у нас была говядина на ужин.',
      },
      {
        text: 'This soup has beef and potatoes.',
        translation: 'В этом супе говядина и картофель.',
      },
    ],
    definition: 'Meat from a cow, used as food.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-bb03-7457-a84e-852fce810b5c',
    itemType: 'sense',
    lemma: 'before',
    pos: 'adverb',
    ipa: 'bɪfˈɔː',
    translation: 'раньше',
    examples: [
      { text: "I've seen this movie before.", translation: 'Я уже видел этот фильм раньше.' },
      { text: 'We met before at school.', translation: 'Мы раньше встречались в школе.' },
    ],
    definition: 'At an earlier time than now or than another event.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-bbf3-797e-94ed-85c61bdaf580',
    itemType: 'sense',
    lemma: 'begin',
    pos: 'verb',
    ipa: 'bɪɡˈɪn',
    translation: 'начинать',
    examples: [
      { text: "Let's begin the lesson now.", translation: 'Давайте начнём урок сейчас.' },
      { text: 'The movie begins at seven.', translation: 'Фильм начинается в семь.' },
    ],
    definition: 'to start doing something or to make something start',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-c551-7664-bc61-655990db28f9',
    itemType: 'sense',
    lemma: 'behind',
    pos: 'adverb',
    ipa: 'bɪhˈaɪnd',
    translation: 'сзади, позади',
    examples: [
      { text: 'The dog ran behind the house.', translation: 'Собака побежала за дом.' },
      {
        text: 'Please stand behind me in line.',
        translation: 'Пожалуйста, встань за мной в очереди.',
      },
    ],
    definition: 'At or toward the back of something or someone.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-c7d0-7cab-8132-96ebf73a882e',
    itemType: 'sense',
    lemma: 'believe',
    pos: 'verb',
    ipa: 'bɪlˈiːv',
    translation: 'считать, полагать',
    examples: [
      {
        text: 'I believe you when you say that.',
        translation: 'Я верю тебе, когда ты это говоришь.',
      },
      {
        text: 'She believes this job will help her.',
        translation: 'Она считает, что эта работа ей поможет.',
      },
    ],
    definition: 'to think that something is true or that someone is telling the truth',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-c554-716e-ae09-6b0bcd1e9ca6',
    itemType: 'sense',
    lemma: 'bell',
    pos: 'noun',
    ipa: 'bˈɛl',
    translation: 'колокол; звонок',
    examples: [
      {
        text: 'The church bell rang at noon.',
        translation: 'Церковный колокол прозвенел в полдень.',
      },
      {
        text: 'Please press the bell outside the door.',
        translation: 'Пожалуйста, нажмите на звонок у двери.',
      },
    ],
    definition:
      'A hollow metal object that makes a sound when struck, or a device that makes a ringing sound.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-c5b5-757a-995f-443fdffec435',
    itemType: 'sense',
    lemma: 'below',
    pos: 'adverb',
    ipa: 'bɪlˈəʊ',
    translation: 'ниже',
    examples: [
      { text: 'The cat is below the table.', translation: 'Кошка под столом.' },
      {
        text: 'Warm air stays below the cold air.',
        translation: 'Тёплый воздух остаётся ниже холодного.',
      },
    ],
    definition: 'At a lower position or level than something else.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-cf44-7086-aabc-9dd645350e9c',
    itemType: 'sense',
    lemma: 'beside',
    pos: 'preposition',
    ipa: 'bɪsˈaɪd',
    translation: 'рядом с',
    examples: [
      { text: 'She sat beside me on the bus.', translation: 'Она села рядом со мной в автобусе.' },
      { text: 'There is a lamp beside the bed.', translation: 'Рядом с кроватью стоит лампа.' },
    ],
    definition: 'Next to someone or something, at the side of it.',
    cefr: 'A1',
  },
  {
    itemId: '01a0ec64-d230-7518-9fdc-d0aa664ed2a9',
    itemType: 'sense',
    lemma: 'best',
    pos: 'adjective',
    ipa: 'bˈɛst',
    translation: 'лучший',
    examples: [
      { text: 'This is the best seat in the room.', translation: 'Это лучшее место в комнате.' },
      {
        text: 'She chose the best answer on the test.',
        translation: 'Она выбрала лучший ответ в тесте.',
      },
    ],
    definition: 'of the highest quality or most suitable among the choices',
    cefr: 'A1',
  },
];

// lemma уникальна по всему WORDS — деки и debug-список ссылаются друг на
// друга по ней; дубль лемм упадёт здесь же, при импорте модуля, а не тихо
// перезапишет старую запись.
const WORDS_BY_LEMMA: ReadonlyMap<string, MockWord> = (() => {
  const map = new Map<string, MockWord>();
  for (const word of WORDS) {
    if (map.has(word.lemma)) {
      throw new Error(
        `WORDS: дублирующаяся лемма "${word.lemma}" — используйте отдельную лемму или разведите значения`
      );
    }
    map.set(word.lemma, word);
  }

  return map;
})();

// Ссылка на слово по лемме — то, чем DEBUG_WORDS и DECKS собирают свои списки
// из WORDS, не копируя поля. Бросает исключение сразу при импорте модуля, если
// лемма не найдена — опечатка в ссылке иначе тихо потеряла бы слово из выдачи.
export function wordByLemma(lemma: string): MockWord {
  const word = WORDS_BY_LEMMA.get(lemma);
  if (!word) {
    throw new Error(`WORDS: слово "${lemma}" не найдено — сначала добавьте его в WORDS`);
  }

  return word;
}
