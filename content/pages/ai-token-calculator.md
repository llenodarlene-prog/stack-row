---
title: AI Token Counter and Cost Calculator
seo_title: AI Token Counter and LLM Cost Calculator | Stack Row
description: Estimate tokens from pasted text or a file and compare API costs across Claude, GPT and Gemini models per request and per month, with a dated price table.
slug: /tools/ai-token-calculator/
type: page
template: calculator
icon: brain
tool: ai-token
order: 11
category: AI
card: Estimate tokens from text and compare API costs across Claude, GPT, and Gemini models.
reviewed: 2026-10-30
primary_keyword: token counter
complete: true
---

# AI Token Counter and Cost Calculator

An AI token counter estimates how many tokens a prompt or document uses, and this calculator turns that count into API cost. Paste text or load a file to estimate input tokens, or type exact counts. Set your expected output and monthly requests. The calculator compares the cost of current Claude, GPT, and Gemini models per request and per month. Prices were last reviewed on October 30, 2026.

## How to Use the Token Calculator

Paste text, load a file, or enter token counts directly, then select Calculate.

- **Paste or load text** to estimate input tokens. The text stays in your browser and is never uploaded, saved, or added to share links.
- **Input tokens per request** fills in from the text, or you can enter an exact count from your provider's dashboard.
- **Output tokens per request** is the expected length of each response.
- **Requests per month** scales the cost to a monthly bill.
- **Share of input from cache** applies cached-input prices for repeated prompt content, such as a long system prompt.

Load example fills in a chatbot handling 10,000 requests a month.

## How Tokens and Costs Are Calculated

| Result | Formula |
|---|---|
| Estimated tokens | Characters ÷ 4, rounded up |
| Input cost | (Uncached input × input price + cached input × cached price) ÷ 1,000,000 |
| Output cost | Output tokens × output price ÷ 1,000,000 |
| Monthly cost | (Input cost + output cost) × requests per month |

The four-characters-per-token rule follows Google's [token guidance](https://ai.google.dev/gemini-api/docs/tokens), which says a token is about 4 characters and 100 tokens are about 60 to 80 English words. Each model family uses its own tokenizer, so exact counts differ, especially for code, numbers, and non-English text. For exact counts, use the provider's tool, such as Anthropic's [token counting API](https://platform.claude.com/docs/en/build-with-claude/token-counting).

## Model Prices Used

Prices are per million tokens on each provider's standard API tier, taken from the official pricing pages on October 30, 2026.

| Model | Input | Cached input | Output |
|---|---:|---:|---:|
| Claude Opus 5.5 | $4.00 | $0.20 | $20.00 |
| Claude Sonnet 5.5 | $2.00 | $0.10 | $10.00 |
| Claude Haiku 5.5 | $0.10 | $0.01 | $0.50 |
| GPT-6 Astra | $10.00 | $1.00 | $50.00 |
| GPT-6.1 Sol | $2.00 | $0.10 | $10.00 |
| GPT-6.1 Terra | $1.00 | $0.05 | $5.00 |
| GPT-6 Luna | $0.10 | $0.01 | $0.50 |
| Gemini 4 Argon | $2.00 | $0.10 | $10.00 |
| Gemini 3.8 Flash | $0.75 | $0.075 | $3.75 |

Some rates change with prompt size or date:
- Claude Haiku 5.5 charges $0.50 input and $2.50 output for prompts over 100,000 tokens.
- The OpenAI prices apply to prompts up to 272,000 tokens.
- Gemini 4 Argon's price is promotional through November 30, 2026, then $4 input and $20 output.
- Gemini 3.8 Flash's price is promotional through December 31, 2026, then $1.50 input and $7.50 output.

The calculator switches to the scheduled prices automatically. Sources are [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing), [OpenAI pricing](https://platform.openai.com/docs/pricing), and [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Worked Example

A support chatbot sends about 2,000 input tokens and receives about 500 output tokens per request, 10,000 times a month.

On Claude Sonnet 5.5, each request costs 2,000 × $2 ÷ 1,000,000 + 500 × $10 ÷ 1,000,000 = $0.009, or $90 a month. The same workload costs about $4.50 a month on Claude Haiku 5.5 or GPT-6 Luna, $33.75 on Gemini 3.8 Flash, and $450 on GPT-6 Astra. The cheapest model is not always the right one, so test quality on your own tasks before choosing.

## Ways to Lower Token Costs

- **Cache repeated content.** Long system prompts and reference documents that repeat across requests can use cached-input prices, which are a fraction of the standard rate.
- **Trim prompts.** Remove unused instructions and examples; every input token is billed on every request.
- **Limit output length.** Output tokens cost several times more than input tokens on every model listed.
- **Route by difficulty.** Send simple requests to a smaller model and reserve larger models for hard ones.
- **Use batch processing** for work that can wait. Providers offer batch rates at about half the standard price.

Costs grow quickly when [AI agents](/ai/what-are-ai-agents/) call a model many times per task, because each step adds input and output tokens. Usage-based AI pricing in data platforms follows similar patterns, as Stack Row's look at [Snowflake AI compute costs](/ai/snowflake-ai-compute-costs/) shows.

## Methodology and Limitations

- Token counts from text are estimates at about 4 characters per token. Images, audio, and tool definitions add tokens this estimate does not count.
- Reasoning or thinking tokens are billed as output on models that use them. Include them in your output estimate.
- Prices cover the standard tier only. Batch, priority, regional, and enterprise pricing differ.
- Prices change. Each figure is dated, and the provider's pricing page is the final authority.
- Pasted text and files are processed in your browser and never leave it.

## Frequently Asked Questions

### How Many Tokens Is a Word?

In English, one token is about 4 characters, so 100 tokens is roughly 60 to 80 words. Code, numbers, and other languages usually use more tokens per word.

### How Do I Count Tokens Exactly?

Use your provider's token-counting tool or the token usage shown in API responses and dashboards. This calculator estimates tokens from characters, which is close for English prose but not exact.

### Why Do Output Tokens Cost More Than Input Tokens?

Generating each output token takes more computation than reading input. On every model listed, output costs five times the input price.

### What Is Prompt Caching?

Prompt caching stores repeated prompt content so later requests read it at a much lower cached-input price. It helps most when a long system prompt or document repeats across many requests.

### Does Pasted Text Leave My Browser?

No. The text is counted in your browser. It is never uploaded, saved, or included in share links or downloads.

## Resources

- [Anthropic: pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [OpenAI: API pricing](https://platform.openai.com/docs/pricing)
- [Google: Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google: understand and count tokens](https://ai.google.dev/gemini-api/docs/tokens)
- [Anthropic: token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting)
