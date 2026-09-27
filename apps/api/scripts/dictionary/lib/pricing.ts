// Стоимость считается из реального usage (токенов), который вернул вызов API,
// а не из грубой оценки по символам. Цены за 1M токенов — в pricing.json,
// это таблица, которую поддерживает владелец/редактор, а не значение в коде:
// цены меняются и агент не может проверить их в сети в момент реализации.
export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
}

export class MissingPriceError extends Error {
  constructor(model: string) {
    super(
      `Нет цены для модели "${model}" в apps/api/scripts/dictionary/pricing.json. ` +
        'Добавьте запись "<model>": { "inputPer1M": ..., "outputPer1M": ... } перед реальным прогоном.',
    );
    this.name = 'MissingPriceError';
  }
}

export function calcCostUsd(usage: Usage, pricing: ModelPricing): number {
  return (
    (usage.promptTokens / 1_000_000) * pricing.inputPer1M +
    (usage.completionTokens / 1_000_000) * pricing.outputPer1M
  );
}

export function getModelPricing(pricingTable: Record<string, ModelPricing>, model: string): ModelPricing {
  const entry = pricingTable[model];
  if (!entry || typeof entry.inputPer1M !== 'number' || typeof entry.outputPer1M !== 'number') {
    throw new MissingPriceError(model);
  }
  return entry;
}

export function sumUsage(items: Usage[]): Usage {
  return items.reduce(
    (acc, u) => ({
      promptTokens: acc.promptTokens + u.promptTokens,
      completionTokens: acc.completionTokens + u.completionTokens,
    }),
    { promptTokens: 0, completionTokens: 0 },
  );
}
