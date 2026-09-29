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
