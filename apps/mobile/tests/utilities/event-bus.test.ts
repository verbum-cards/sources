import assert from 'node:assert/strict';
import { test } from 'node:test';

import { notifyChange, subscribeToChanges } from '../../src/utilities/event-bus';

test('notifyChange вызывает подписчика, если таблицы пересекаются', () => {
  let calls = 0;
  const unsubscribe = subscribeToChanges(['card', 'card_content'], () => {
    calls += 1;
  });
  try {
    notifyChange(['card']);
    assert.equal(calls, 1);
  } finally {
    unsubscribe();
  }
});

test('notifyChange не вызывает подписчика, если таблицы не пересекаются', () => {
  let calls = 0;
  const unsubscribe = subscribeToChanges(['card_schedule'], () => {
    calls += 1;
  });
  try {
    notifyChange(['user_profile', 'user_deck']);
    assert.equal(calls, 0);
  } finally {
    unsubscribe();
  }
});

test('одно уведомление с несколькими таблицами достаточно, если совпала хотя бы одна', () => {
  let calls = 0;
  const unsubscribe = subscribeToChanges(['review_log'], () => {
    calls += 1;
  });
  try {
    notifyChange(['card_schedule', 'review_log']);
    assert.equal(calls, 1);
  } finally {
    unsubscribe();
  }
});

test('отписка останавливает дальнейшие уведомления', () => {
  let calls = 0;
  const unsubscribe = subscribeToChanges(['card'], () => {
    calls += 1;
  });
  notifyChange(['card']);
  assert.equal(calls, 1);

  unsubscribe();
  notifyChange(['card']);
  assert.equal(calls, 1, 'после отписки колбэк больше не должен вызываться');
});

test('несколько подписчиков независимы друг от друга', () => {
  let cardCalls = 0;
  let profileCalls = 0;
  const unsubCard = subscribeToChanges(['card'], () => {
    cardCalls += 1;
  });
  const unsubProfile = subscribeToChanges(['user_profile'], () => {
    profileCalls += 1;
  });

  try {
    notifyChange(['card']);
    assert.equal(cardCalls, 1);
    assert.equal(profileCalls, 0);

    unsubCard();
    notifyChange(['card', 'user_profile']);
    assert.equal(cardCalls, 1, 'отписанный подписчик не должен реагировать');
    assert.equal(profileCalls, 1, 'независимый подписчик продолжает получать уведомления');
  } finally {
    unsubCard();
    unsubProfile();
  }
});

test('повторная отписка (двойной вызов) безопасна', () => {
  let calls = 0;
  const unsubscribe = subscribeToChanges(['card'], () => {
    calls += 1;
  });
  unsubscribe();
  unsubscribe();
  notifyChange(['card']);
  assert.equal(calls, 0);
});
