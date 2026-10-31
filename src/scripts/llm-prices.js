// Model prices in US dollars per million tokens, standard (non-batch) API
// tier, copied from each provider's official pricing page on the review date.
// Update REVIEWED and the rows together. Rows with `until` switch to the next
// row for the same model after that date (scheduled price changes).
(function (root) {
  'use strict';
  const REVIEWED = '2026-10-30';
  const SOURCES = {
    Anthropic: 'https://platform.claude.com/docs/en/about-claude/pricing',
    OpenAI: 'https://platform.openai.com/docs/pricing',
    Google: 'https://ai.google.dev/gemini-api/docs/pricing'
  };
  const MODELS = [
    { id: 'claude-opus-5-5', provider: 'Anthropic', name: 'Claude Opus 5.5', input: 4, cached: 0.2, output: 20 },
    { id: 'claude-sonnet-5-5', provider: 'Anthropic', name: 'Claude Sonnet 5.5', input: 2, cached: 0.1, output: 10 },
    { id: 'claude-haiku-5-5', provider: 'Anthropic', name: 'Claude Haiku 5.5', input: 0.1, cached: 0.01, output: 0.5, longOver: 100000, long: { input: 0.5, cached: 0.05, output: 2.5 }, note: 'Prompts over 100,000 tokens use higher rates.' },
    { id: 'gpt-6-astra', provider: 'OpenAI', name: 'GPT-6 Astra', input: 10, cached: 1, output: 50, maxShort: 272000, note: 'Prices shown are for prompts up to 272K tokens.' },
    { id: 'gpt-6.1-sol', provider: 'OpenAI', name: 'GPT-6.1 Sol', input: 2, cached: 0.1, output: 10, maxShort: 272000, note: 'Prices shown are for prompts up to 272K tokens.' },
    { id: 'gpt-6.1-terra', provider: 'OpenAI', name: 'GPT-6.1 Terra', input: 1, cached: 0.05, output: 5, maxShort: 272000, note: 'Prices shown are for prompts up to 272K tokens.' },
    { id: 'gpt-6-luna', provider: 'OpenAI', name: 'GPT-6 Luna', input: 0.1, cached: 0.01, output: 0.5, maxShort: 272000, note: 'Prices shown are for prompts up to 272K tokens.' },
    { id: 'gemini-4-argon', provider: 'Google', name: 'Gemini 4 Argon', input: 2, cached: 0.1, output: 10, until: '2026-11-30', note: 'Promotional price through November 30, 2026.' },
    { id: 'gemini-4-argon', provider: 'Google', name: 'Gemini 4 Argon', input: 4, cached: 0.2, output: 20, from: '2026-12-01', note: 'Price from December 1, 2026.' },
    { id: 'gemini-3.8-flash', provider: 'Google', name: 'Gemini 3.8 Flash', input: 0.75, cached: 0.075, output: 3.75, until: '2026-12-31', note: 'Promotional price through December 31, 2026.' },
    { id: 'gemini-3.8-flash', provider: 'Google', name: 'Gemini 3.8 Flash', input: 1.5, cached: 0.15, output: 7.5, from: '2027-01-01', note: 'Price from January 1, 2027.' }
  ];
  // The price row in effect on a date (YYYY-MM-DD) for each model.
  function current(date) {
    const out = [];
    for (const row of MODELS) {
      if (row.from && date < row.from) continue;
      if (row.until && date > row.until) continue;
      out.push(row);
    }
    return out;
  }
  root.StackRowLlmPrices = { REVIEWED, SOURCES, MODELS, current };
})(typeof window !== 'undefined' ? window : globalThis);
