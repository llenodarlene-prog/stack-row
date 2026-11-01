---
title: Artificial Intelligence Questions and Answers
seo_title: Artificial Intelligence Questions Answered | Stack Row
description: Plain answers about generative AI, AI agents, large language models, tokens, hallucinations and AI governance, with examples, tables and diagrams.
slug: /questions/artificial-intelligence/
type: page
template: questions
icon: brain
category: Artificial Intelligence
reviewed: 2026-11-01
author: Darlene Aberin
author_url: /about/darlene-aberin/
sections: sparkles, robot, message-chatbot, shield-check
complete: true
---

# Artificial Intelligence Questions and Answers

Artificial intelligence questions now come from every team, not only engineers. Each answer below opens with a short reply that stands on its own. Examples, tables, and diagrams follow where they help.

## Generative AI

Generative AI is the kind of AI behind ChatGPT, Claude, and Gemini. These answers explain what it does, why it's expensive to run, and where it fits at work.

### What Is Generative AI?

Generative AI is artificial intelligence that creates new content, such as text, images, code, or audio. It learns patterns from huge amounts of training data. Then it produces fresh output that follows those patterns when you give it a prompt. ChatGPT, Claude, Gemini, and Midjourney are well-known examples.

### How Does Generative AI Work?

Generative AI works by learning patterns during training, then using them to predict new output. A text model learns which words tend to follow others across billions of examples. When you type a prompt, it predicts a likely response one small piece at a time. Image models learn the same way from pictures.

[[flow: How a chatbot answers your prompt | You type a prompt > Text splits into tokens > The model predicts the next token > It repeats until the answer ends > Tokens turn back into text]]

### What Can Generative AI Create?

Generative AI can create text, images, code, audio, video, and structured data. One model can draft an email, summarize a report, or write a spreadsheet formula. Others generate product photos, voiceovers, or short video clips from a written description.

Here's what each type looks like in a typical business.

| Output | Business example | Example tools |
|---|---|---|
| Text | Draft support replies or product copy | ChatGPT, Claude, Gemini |
| Code | Write tests or explain old code | GitHub Copilot, Claude Code |
| Images | Mock up ads or product shots | Midjourney, DALL-E |
| Audio | Narrate training videos | ElevenLabs |
| Data | Turn invoices into spreadsheet rows | Most large language models |

### Why Is Generative AI Considered Flexible and Adaptive?

Generative AI is flexible because one model handles many tasks without being rebuilt. You change its job just by changing the instructions. The same model can translate a contract, then write Python, then plan a meeting. Older AI usually needed a separate model trained for each task.

### How Is Generative AI Different From Traditional AI?

Traditional AI mostly classifies or predicts, like flagging fraud or forecasting sales. Generative AI creates new content, like a written summary or an image. Traditional models usually do one narrow job. Generative models handle many jobs through plain-language instructions.

| | Traditional AI | Generative AI |
|---|---|---|
| Main output | A label, score, or forecast | New text, images, or code |
| Example | Spam filter | Email drafting assistant |
| Built for | One specific task | Many tasks |
| How you steer it | Retraining with new data | Writing a better prompt |

### Why Does Generative AI Use So Much Computing Power?

Generative AI needs huge computing power because the models are enormous. Training a large model means running trillions of calculations on thousands of specialized chips for weeks. Every answer also takes real computation, since the model predicts each token one at a time. More users means more chips running around the clock.

### Why Does Generative AI Use Water?

Generative AI uses water mainly to cool the data centers that run it. The chips get very hot, and many cooling systems evaporate water to carry the heat away. Power plants that supply the electricity also use water. The amount varies widely by location, season, and cooling design.

### What Business Tasks Are Suitable for Generative AI?

Generative AI fits tasks that involve drafting, summarizing, or reorganizing information, where a person reviews the result. Good early wins include first drafts, meeting notes, and support-reply suggestions. It's a poor fit where one wrong answer causes real harm and nobody checks.

Start with tasks that tick these boxes.

- **High volume.** The task repeats often enough for time savings to add up.
- **Easy to check.** A person can spot a wrong answer quickly.
- **Low harm if wrong.** A mistake is caught before it reaches a customer.
- **Text-heavy.** The work is mostly reading and writing.

Stack Row's list of [AI tools for marketing](/ai/ai-tools-for-marketing/) shows how marketing teams apply these tasks in practice.

## AI Agents

AI agents go a step past chatbots. They plan, use tools, and take actions. These answers cover how they work, why they fail, and how to keep them safe.

### What Are AI Agents?

AI agents are AI systems that plan steps and use tools to reach a goal alone. Say you ask one to book a meeting with sales. It checks calendars, picks a time, and sends the invites. A chatbot would only tell you how to do it.

Stack Row's longer guide to [what AI agents are](/ai/what-are-ai-agents/) covers real business uses and risks.

### How Do AI Agents Work?

An AI agent runs a loop. A language model reads the goal and picks the next step. Then it calls a tool, such as a search engine or a database. It reads the result, then decides again. The loop repeats until the task is done or the agent asks a person for help.

[[flow: The loop an AI agent runs | Read the goal > Plan the next step > Call a tool > Check the result > Repeat or finish]]

Anthropic's engineering guide on [building effective agents](https://www.anthropic.com/research/building-effective-agents) describes this loop and when simpler setups work better.

### How Is an AI Agent Different From a Chatbot?

A chatbot answers questions in conversation. An AI agent takes actions to finish a task. Ask a chatbot about a refund, and it explains the policy. Ask an agent, and it looks up the order, checks eligibility, and issues the refund.

| | Chatbot | AI agent |
|---|---|---|
| Main job | Answer and explain | Complete tasks |
| Uses tools | Rarely | Yes, often several |
| Steps per request | Usually one reply | Many steps |
| Risk if wrong | A bad answer | A bad action |

### Why Do AI Agents Fail in Production?

AI agents often fail in production because small errors compound across many steps. One misread result early on can send every later step the wrong way. Agents also struggle with messy real data, unclear goals, and tools that time out. Testing on a few neat examples hides these problems.

These are the failure points teams hit most often.

1. Vague goals with no clear finish line.
2. Tools that return errors the agent can't interpret.
3. Too much access, so a mistake does real damage.
4. No limit on steps, so loops run up costs.
5. Nobody reviewing actions before they go live.

### What Tools Can an AI Agent Use?

AI agents can use any tool a developer connects to them. Common ones include web search, databases, email, calendars, and file storage. Code runners and business apps like a CRM work too. Each tool is described to the model, which decides when to call it. The Model Context Protocol (MCP) is an open standard for these connections.

The [Model Context Protocol introduction](https://modelcontextprotocol.io/introduction) explains how one connector can work across many AI apps.

### Can AI Agents Make Decisions Without Approval?

Technically yes, but it depends on how they're set up. Teams usually let agents act alone on low-risk steps, like reading data or drafting. Anything costly or hard to undo should wait for a person's approval. That includes payments, deletions, and customer emails.

### What Data Should an AI Agent Be Allowed to Access?

An AI agent should only reach the data its task needs, and no more. Give it the same or less access than the person it works for. Use read-only access where you can. Keep secrets and passwords out of reach, and log every data request.

Data permissions trip up even big platforms. Stack Row's look at [Salesforce AI data access](/ai/salesforce-ai-data-access/) shows how permissions carry over into AI features.

### How Should Businesses Test AI Agents?

Businesses should test AI agents on realistic tasks before giving them live access. Build a set of real examples, including messy and tricky ones. Run the agent in a sandbox where actions can't cause harm. Then measure how often it finishes correctly, how many steps it takes, and what it costs.

A simple test plan covers these steps.

1. Collect 50 to 100 real tasks, including edge cases.
2. Run the agent against copies of your systems, not production.
3. Score each run as correct, partly correct, or wrong.
4. Review every wrong action, then fix the prompt or tools.
5. Go live with limited access, and keep reviewing logs.

## Large Language Models

Large language models, or LLMs, are the engines inside most AI chat tools. These answers explain how they're built and why they make things up. They also cover tokens and context windows.

### What Is a Large Language Model?

A large language model is an AI model trained on vast amounts of text. It learns to understand and generate language. It works by predicting the next piece of text, again and again. GPT, Claude, Gemini, and Llama are large language model families. They power chatbots, writing tools, and AI agents.

Google's [introduction to large language models](https://developers.google.com/machine-learning/resources/intro-llms) is a clear starting point for the technical side.

### How Do Large Language Models Work?

A large language model splits text into tokens and turns each token into numbers. A neural network called a transformer weighs how every token relates to the others. It then predicts the most likely next token. Repeating that prediction thousands of times produces a full answer.

### Why Are They Called Large Language Models?

They're called large because of their size. Modern models have billions of internal settings, called parameters. They're trained on a huge share of the text available online and in books. "Language model" is an older term for any model that predicts the next word in a sentence.

### Why Do Large Language Models Hallucinate?

Large language models hallucinate because they predict text that sounds likely, without checking facts. Even with thin training data or an odd question, the model still gives a confident answer. A fake citation or a wrong number can look exactly like a real one.

### How Is a Language Model Trained?

A language model is trained in stages. First, pretraining has it predict missing or next words across a huge text collection. That teaches language and general knowledge. Then fine-tuning on curated examples and human feedback teaches it to follow instructions and answer helpfully.

[[flow: The usual stages of training a language model | Collect and clean text > Pretrain on next-word prediction > Fine-tune on example conversations > Refine with human feedback > Test and release]]

### What Is a Context Window?

A context window is the maximum amount of text a model can consider at once. It covers your prompt, any documents you add, the conversation so far, and the answer. It's measured in tokens. Some current models accept up to a million tokens, roughly several long books.

When a conversation outgrows the window, the oldest parts drop out or get summarized. That's why a long chat can "forget" early details.

### What Are AI Tokens?

AI tokens are the small chunks of text a model reads and writes. A token can be a word, part of a word, or punctuation. In English, one token is about four characters. AI services bill by the token, counting what you send and what the model returns.

Google's [token guide](https://ai.google.dev/gemini-api/docs/tokens) notes that 100 tokens is about 60 to 80 English words. To estimate token counts and costs across models, use Stack Row's [AI token calculator](/tools/ai-token-calculator/).

### How Can Businesses Reduce Hallucinations?

Businesses reduce hallucinations by giving the model trusted information and checking what it says. Feed it your own documents and ask it to cite sources. Tell it to say "I don't know" when it's unsure. A person should still review anything that reaches customers or affects money.

These habits make the biggest difference.

- **Ground answers in your documents.** This is often called retrieval-augmented generation (RAG).
- **Ask for citations.** Then spot-check that each one is real.
- **Allow "I don't know."** Say so in the instructions.
- **Keep a human check.** Review anything high-stakes before it's used.

## Governance and Risk

AI governance is how a company decides what AI can do and with which data. It also names who answers for it. These answers cover the basics of using AI responsibly at work.

### What Is AI Governance?

AI governance is the set of policies, roles, and checks that control how an organization uses AI. It decides which tools are approved and what data they can touch. It also sets how outputs are reviewed and who's accountable when something goes wrong.

The U.S. National Institute of Standards and Technology publishes the [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework). It organizes the work into four functions.

| Function | What it means in practice |
|---|---|
| Govern | Set policies, roles, and accountability |
| Map | List AI uses and their context and risks |
| Measure | Test and track how systems perform |
| Manage | Act on risks and respond to incidents |

### Why Is AI Governance Needed?

AI governance is needed because AI tools can leak data, make costly mistakes, or treat people unfairly. Without rules, staff paste confidential data into public tools, and nobody knows which AI touches customer records. Governance sets clear limits before a problem forces them.

### Who Should Own AI Governance?

AI governance works best with one accountable owner and a small cross-team group. The owner is often a chief technology, data, or risk officer. The group usually adds legal, security, data, and HR. Business teams that use AI daily join too, so rules fit real work.

### What Is Responsible AI?

Responsible AI means building and using AI in ways that are safe, fair, and accountable. In practice, that's testing for bias, protecting personal data, and explaining how decisions are made. It also means a clear path for people to challenge an AI decision that affects them.

### Can AI Be Trusted?

AI can be trusted for some tasks, with checks, but not blindly. It's reliable for drafting, summarizing, and sorting when a person reviews the result. It's less reliable for facts, math, and legal or medical advice without verification. Trust should match how easily you can check the output.

### What Information Should Not Be Entered Into AI Tools?

Don't enter confidential, personal, or regulated information into AI tools your company hasn't approved. Public tools may store prompts or use them for training, depending on the plan. Even approved tools need care with the most sensitive data.

Keep these out unless your company's policy clearly allows them.

- Passwords, API keys, and other credentials.
- Customer or employee personal data, like ID numbers.
- Health, financial, or payment card details.
- Unreleased financials, contracts, and trade secrets.
- Source code your company treats as confidential.

Permissions inside connected AI features need care too. Stack Row's piece on [Atlassian AI and knowledge permissions](/ai/atlassian-ai-knowledge-permissions/) walks through one real example.

### What Is Human Review in an AI Workflow?

Human review means a person checks AI output before it's used or acted on. A reviewer might approve a drafted email, verify figures in a summary, or confirm an agent's action. Review is most important where mistakes affect customers, money, legal standing, or safety.

[[flow: Where human review fits in an AI workflow | AI drafts or proposes an action > A person reviews it > Approve, edit, or reject > Approved work goes live > Errors are logged to improve prompts]]

### How Should a Company Evaluate an AI Vendor?

Evaluate an AI vendor on data handling first, then quality and cost. Find out if your data trains their models, where it's stored, and how long it's kept. Then test the tool on your own real tasks, and confirm security certifications and contract terms.

Ask every vendor these questions before signing.

1. Is our data used to train your models, and can we opt out?
2. Where is our data stored and processed, and for how long?
3. Which security certifications do you hold, such as SOC 2 or ISO 27001?
4. How do you handle wrong or harmful outputs?
5. What does it cost at our expected usage, not only the trial?

## Sources

- [Google: introduction to large language models](https://developers.google.com/machine-learning/resources/intro-llms)
- [Anthropic: building effective agents](https://www.anthropic.com/research/building-effective-agents)
- [Model Context Protocol: introduction](https://modelcontextprotocol.io/introduction)
- [Google: understand and count tokens](https://ai.google.dev/gemini-api/docs/tokens)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
