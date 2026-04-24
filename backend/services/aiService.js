const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const CONFIDENCE_THRESHOLD = Number(process.env.CONFIDENCE_THRESHOLD || 0.6);
const PROMPT_VERSION = process.env.PROMPT_VERSION || "UC23_PROMPT_V1";
const MODEL_VERSION = "gpt-4o";

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

exports.extractClausesOnly = async (contractText) => {
  const start = Date.now();

  const prompt = `
Prompt Version: ${PROMPT_VERSION}

Extract clauses from the contract.
Return ONLY JSON:
{
  "clauses": [
    {
      "clauseTitle": "",
      "clauseText": "",
      "confidenceScore": 0.0
    }
  ]
}

Contract:
${contractText}
`;

  const response = await client.chat.completions.create({
    model: MODEL_VERSION,
    messages: [
      { role: "system", content: "You extract legal contract clauses. Return JSON only." },
      { role: "user", content: prompt }
    ],
    temperature: 0.1
  });

  let content = response.choices[0].message.content;
  content = content.replace(/```json/g, "").replace(/```/g, "").trim();

  const result = JSON.parse(content);
  result.processingTimeMs = Date.now() - start;
  result.processingTimeSeconds = result.processingTimeMs / 1000;

  return result;
};

exports.analyzeContractWithAI = async (contractText, language = "English") => {
  try {
    const prompt = `
Prompt Version: ${PROMPT_VERSION}

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
- Every Artificial Intelligence decision must include confidenceScore from 0 to 1.
- Detect one-sided terms.
- Suggest better alternatives.
- Keep explanation simple for Small and Medium Enterprises.

Contract:
${contractText}
`;

    const response = await client.chat.completions.create({
      model: MODEL_VERSION,
      messages: [
        {
          role: "system",
          content: `You are a legal contract analyzer. Prompt Version: ${PROMPT_VERSION}. Return JSON only.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    let content = response.choices[0].message.content;
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    const result = JSON.parse(content);

    result.promptVersion = PROMPT_VERSION;
    result.modelVersion = MODEL_VERSION;

    if (Number(result.confidenceScore || 0) < CONFIDENCE_THRESHOLD) {
      result.requiresHumanReview = true;
      result.fallbackMessage =
        "Confidence is below threshold. Human review is required before using this result.";
    }

    return result;
  } catch (err) {
    return fallbackResult(err.message);
  }
};

exports.compareContractsWithAI = async (oldContract, newContract) => {
  try {
    const prompt = `
Prompt Version: ${PROMPT_VERSION}

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
${oldContract}

New Contract:
${newContract}
`;

    const response = await client.chat.completions.create({
      model: MODEL_VERSION,
      messages: [
        { role: "system", content: `You compare legal contracts. Prompt Version: ${PROMPT_VERSION}. Return JSON only.` },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    });

    let content = response.choices[0].message.content;
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    const result = JSON.parse(content);

    result.promptVersion = PROMPT_VERSION;
    result.modelVersion = MODEL_VERSION;

    if (Number(result.confidenceScore || 0) < CONFIDENCE_THRESHOLD) {
      result.requiresHumanReview = true;
      result.fallbackMessage =
        "Confidence is below threshold. Human review is required.";
    }

    return result;
  } catch (err) {
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