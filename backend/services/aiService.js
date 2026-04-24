const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60 * 1000,   // 60-second hard timeout per OpenAI call
  maxRetries: 1         // retry once on network failure (was default 2, which doubled wait)
});

const CONFIDENCE_THRESHOLD = Number(process.env.CONFIDENCE_THRESHOLD || 0.6);
const PROMPT_VERSION       = process.env.PROMPT_VERSION || "UC23_PROMPT_V1";
const MODEL_VERSION        = process.env.AI_MODEL || "gpt-4o-mini"; // ⚡ FASTER default

// ⚠️  gpt-4o-mini is ~5x faster than gpt-4o with near-identical quality
//     Change to "gpt-4o" in .env if you need maximum quality

function fallbackResult(message = "Unable to determine safely. Human review required.") {
  return {
    summary: message,
    overallRisk: "Medium",
    confidenceScore: 0.5,
    requiresHumanReview: true,
    plainLanguageExplanation: message,
    clauses: [],
    namedEntities: {
      parties: [],
      dates: [],
      moneyValues: [],
      jurisdictions: [],
      obligations: []
    },
    fallbackMessage: "Confidence is below threshold. Please send this contract for human review.",
    promptVersion: PROMPT_VERSION,
    modelVersion: MODEL_VERSION
  };
}

// ─── Truncate very long contracts to keep response time reasonable ──────────
function truncateContract(text, maxChars = 12000) {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + "\n\n[... contract truncated for analysis ...]";
}

// ─── Log timing + token usage for every AI call ─────────────────────────────
function logCall(label, startMs, response) {
  const ms = Date.now() - startMs;
  const usage = response?.usage;
  const tokenInfo = usage
    ? `| tokens: ${usage.prompt_tokens} in + ${usage.completion_tokens} out`
    : "";
  console.log(`[AI] ${label} took ${ms}ms ${tokenInfo}`);
}

// ════════════════════════════════════════════════════════════════════════════
// Extract clauses only (fast path, for SRS §3.2 — under 3 seconds)
// ════════════════════════════════════════════════════════════════════════════
exports.extractClausesOnly = async (contractText) => {
  const start = Date.now();
  const truncated = truncateContract(contractText, 8000);

  const response = await client.chat.completions.create({
    model: MODEL_VERSION,
    max_tokens: 1500,
    temperature: 0.1,
    response_format: { type: "json_object" }, // ⚡ forces valid JSON, no regex cleanup
    messages: [
      {
        role: "system",
        content: "You extract legal contract clauses. Return JSON only."
      },
      {
        role: "user",
        content: `Prompt Version: ${PROMPT_VERSION}

Extract clauses from the contract. Return ONLY JSON:
{
  "clauses": [
    { "clauseTitle": "", "clauseText": "", "confidenceScore": 0.0 }
  ]
}

Contract:
${truncated}`
      }
    ]
  });

  logCall("extractClausesOnly", start, response);

  const result = JSON.parse(response.choices[0].message.content);
  result.processingTimeMs      = Date.now() - start;
  result.processingTimeSeconds = result.processingTimeMs / 1000;

  return result;
};

// ════════════════════════════════════════════════════════════════════════════
// Full contract analysis
// ════════════════════════════════════════════════════════════════════════════
exports.analyzeContractWithAI = async (contractText, language = "English") => {
  const start = Date.now();

  try {
    const truncated = truncateContract(contractText, 12000);
    console.log(`[AI] Starting analysis | chars=${truncated.length} | lang=${language} | model=${MODEL_VERSION}`);

    const response = await client.chat.completions.create({
      model: MODEL_VERSION,
      max_tokens: 3000,        // ⚡ cap response size for speed
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a legal contract analyzer. Prompt Version: ${PROMPT_VERSION}. Return JSON only.`
        },
        {
          role: "user",
          content: `Prompt Version: ${PROMPT_VERSION}

You are an Artificial Intelligence Contract Clause Risk Analyzer.

Analyze the contract and return ONLY valid JSON:
{
  "summary": "",
  "overallRisk": "Low | Medium | High | Critical",
  "confidenceScore": 0.0,
  "requiresHumanReview": false,
  "plainLanguageExplanation": "",
  "clauses": [
    {
      "clauseTitle": "",
      "clauseText": "",
      "riskLevel": "Low | Medium | High | Critical",
      "riskReason": "",
      "plainExplanation": "",
      "suggestedAlternative": "",
      "confidenceScore": 0.0
    }
  ],
  "namedEntities": {
    "parties": [],
    "dates": [],
    "moneyValues": [],
    "jurisdictions": [],
    "obligations": []
  }
}

Rules:
- Explain in ${language}.
- Keep explanations concise (2-3 sentences per clause).
- Every decision must include confidenceScore from 0 to 1.
- Detect one-sided terms.
- Suggest better alternatives.
- Keep it simple for Small and Medium Enterprises.

Contract:
${truncated}`
        }
      ]
    });

    logCall("analyzeContractWithAI", start, response);

    const result = JSON.parse(response.choices[0].message.content);

    result.promptVersion = PROMPT_VERSION;
    result.modelVersion  = MODEL_VERSION;

    if (Number(result.confidenceScore || 0) < CONFIDENCE_THRESHOLD) {
      result.requiresHumanReview = true;
      result.fallbackMessage =
        "Confidence is below threshold. Human review is required before using this result.";
    }

    return result;
  } catch (err) {
    console.error(`[AI] analyzeContractWithAI FAILED after ${Date.now() - start}ms:`, err.message);
    return fallbackResult(err.message);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// Compare two contract versions
// ════════════════════════════════════════════════════════════════════════════
exports.compareContractsWithAI = async (oldContract, newContract) => {
  const start = Date.now();

  try {
    const oldTruncated = truncateContract(oldContract, 6000);
    const newTruncated = truncateContract(newContract, 6000);

    console.log(`[AI] Starting comparison | old=${oldTruncated.length}ch | new=${newTruncated.length}ch`);

    const response = await client.chat.completions.create({
      model: MODEL_VERSION,
      max_tokens: 2500,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You compare legal contracts. Prompt Version: ${PROMPT_VERSION}. Return JSON only.`
        },
        {
          role: "user",
          content: `Prompt Version: ${PROMPT_VERSION}

Compare two contract versions and return ONLY valid JSON:
{
  "summary": "",
  "confidenceScore": 0.0,
  "requiresHumanReview": false,
  "changes": [
    {
      "section": "",
      "oldText": "",
      "newText": "",
      "riskImpact": "Low | Medium | High | Critical",
      "explanation": "",
      "negotiationSuggestion": ""
    }
  ]
}

Old Contract:
${oldTruncated}

New Contract:
${newTruncated}`
        }
      ]
    });

    logCall("compareContractsWithAI", start, response);

    const result = JSON.parse(response.choices[0].message.content);
    result.promptVersion = PROMPT_VERSION;
    result.modelVersion  = MODEL_VERSION;

    if (Number(result.confidenceScore || 0) < CONFIDENCE_THRESHOLD) {
      result.requiresHumanReview = true;
      result.fallbackMessage = "Confidence is below threshold. Human review is required.";
    }

    return result;
  } catch (err) {
    console.error(`[AI] compareContractsWithAI FAILED after ${Date.now() - start}ms:`, err.message);
    return {
      summary: err.message,
      confidenceScore: 0.5,
      requiresHumanReview: true,
      changes: [],
      fallbackMessage: "Unable to determine safely. Human review required.",
      promptVersion: PROMPT_VERSION,
      modelVersion: MODEL_VERSION
    };
  }
};