/* ──────────────────────────────────────────────────────────────
   AI Service — Groq (LLaMA 3.3 70B Versatile)
   ────────────────────────────────────────────────────────────── */

import Groq from 'groq-sdk';

const MODEL = 'llama-3.3-70b-versatile';

/** Shape returned by the AI after parsing a transcript. */
export interface ExtractedPatientData {
  name: string | null;
  age: number | null;
  pregnancyMonth: number | null;
  systolic: number | null;
  diastolic: number | null;
  symptoms: string[];
}

/** Check whether a real API key is configured. */
function hasApiKey(): boolean {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  return !!key && key !== 'your_key_here';
}

function getClient(): Groq {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!key || key === 'your_key_here') {
    throw new Error(
      '[ai] VITE_GROQ_API_KEY is not set. Add it to .env.local and restart the dev server.',
    );
  }
  return new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
}

const SYSTEM_PROMPT = `You are a medical scribe for ASHA workers in India. Extract data from the transcript into a JSON object. Fields: name, age, monthOfPregnancy, systolic, diastolic, symptoms (array). If the input is in Hindi, translate values to English. Return ONLY the JSON object. No conversational filler.`;

/**
 * Return a mock extraction result after a 2-second delay.
 * Used when no API key is configured so we can verify the UI pipeline works.
 */
async function getMockExtraction(transcript: string): Promise<ExtractedPatientData> {
  console.warn('[ai] No API key — returning MOCK data after 2 s delay. Transcript was:', transcript);
  await new Promise((r) => setTimeout(r, 2000));
  return {
    name: 'Mock Patient',
    age: 25,
    pregnancyMonth: 6,
    systolic: 135,
    diastolic: 88,
    symptoms: ['mild headache'],
  };
}

/**
 * Send a voice transcript to Groq (LLaMA 3.3 70B) and get structured patient data back.
 * Falls back to mock data when the API key is missing so the UI pipeline can be tested.
 */
export async function extractPatientData(
  transcript: string,
): Promise<ExtractedPatientData> {
  console.log('[ai] Groq analyzing transcript:', transcript);

  // ── Fallback: no API key → mock data so we can test the UI ──
  if (!hasApiKey()) {
    return getMockExtraction(transcript);
  }

  try {
    const groq = getClient();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      model: MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const raw = chatCompletion.choices[0].message.content || '{}';
    console.log("AI Response:", chatCompletion.choices[0].message.content);
    console.log('[ai] Raw Groq response:', raw);

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Map Groq's "monthOfPregnancy" to our internal "pregnancyMonth" field
    const pregnancyMonth =
      (parsed.monthOfPregnancy as number | null) ??
      (parsed.pregnancyMonth as number | null) ??
      null;

    const result: ExtractedPatientData = {
      name: (parsed.name as string) ?? null,
      age: parsed.age != null ? Number(parsed.age) : null,
      pregnancyMonth: pregnancyMonth != null ? Number(pregnancyMonth) : null,
      systolic: parsed.systolic != null ? Number(parsed.systolic) : null,
      diastolic: parsed.diastolic != null ? Number(parsed.diastolic) : null,
      symptoms: Array.isArray(parsed.symptoms) ? (parsed.symptoms as string[]) : [],
    };

    console.log('[ai] Extracted patient data:', result);
    return result;
  } catch (error) {
    console.error('[ai] Groq API Error:', error);
    throw error;
  }
}

/* ══════════════════════════════════════════════════════════════
   ANM Daily Summary — Structured + Multilingual
   ══════════════════════════════════════════════════════════════ */

interface PatientSummaryInput {
  name: string;
  age: number;
  pregnancyMonth: number;
  systolic: number;
  diastolic: number;
  symptoms: string[];
  riskLevel: string;
}

export type SummaryLanguage = 'en' | 'hi' | 'mr';

export interface HighRiskCase {
  name: string;
  detail: string;
  action: string;
}

export interface ANMReport {
  title: string;
  overview: string;
  highRiskCases: HighRiskCase[];
  closingNote: string;
  /** Plain-text version for WhatsApp sharing */
  plainText: string;
}

const LANG_LABELS: Record<SummaryLanguage, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari script)',
  mr: 'Marathi (Devanagari script)',
};

function getANMPrompt(lang: SummaryLanguage): string {
  return `You are a senior public health analyst creating a structured field report for a medical supervisor (ANM — Auxiliary Nurse Midwife).

LANGUAGE: Write the ENTIRE report in ${LANG_LABELS[lang]}.${lang !== 'en' ? ' Use Devanagari script. Patient names should remain in English/Roman script.' : ''}

Analyze the patient records and return a JSON object with this EXACT structure:
{
  "title": "Report title with today's date",
  "overview": "1-2 sentence overview: total patients screened, risk distribution",
  "highRiskCases": [
    {
      "name": "Patient Name",
      "detail": "Age, pregnancy month, BP reading, symptoms",
      "action": "Specific recommended action for this patient"
    }
  ],
  "closingNote": "1 sentence: general recommendation for the ANM"
}

Rules:
- Include ONLY High-Risk patients in highRiskCases array
- If no high-risk patients exist, return an empty highRiskCases array
- Keep each field concise and professional
- The "action" field should be a specific medical recommendation
- Return ONLY valid JSON, no markdown fences`;
}

/**
 * Generate a structured daily ANM summary from the current patient list.
 * This is a read-only operation — no patient data is modified.
 */
export async function generateDailySummary(
  patients: PatientSummaryInput[],
  language: SummaryLanguage = 'en',
): Promise<ANMReport> {
  console.log('[ai] Generating ANM summary for', patients.length, 'patients in', language);

  const highRisk = patients.filter((p) => p.riskLevel === 'high');

  if (!hasApiKey()) {
    console.warn('[ai] No API key — returning mock ANM summary');
    await new Promise((r) => setTimeout(r, 1500));

    const mockReports: Record<SummaryLanguage, ANMReport> = {
      en: {
        title: `ASHA Daily Screening Report — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        overview: `Today, ${patients.length} pregnant women were screened. ${highRisk.length} identified as High-Risk, requiring immediate ANM attention.`,
        highRiskCases: highRisk.map((p) => ({
          name: p.name,
          detail: `Age ${p.age}, ${p.pregnancyMonth} months pregnant, BP ${p.systolic}/${p.diastolic}. Symptoms: ${p.symptoms.join(', ') || 'none'}`,
          action: 'Refer to nearest PHC within 24 hours for BP management and fetal monitoring.',
        })),
        closingNote: 'All High-Risk patients should be referred to the nearest PHC within 24 hours for further evaluation and management.',
        plainText: '',
      },
      hi: {
        title: `आशा दैनिक जांच रिपोर्ट — ${new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        overview: `आज ${patients.length} गर्भवती महिलाओं की जांच की गई। ${highRisk.length} को उच्च-जोखिम के रूप में पहचाना गया, जिन्हें तत्काल ANM ध्यान देने की आवश्यकता है।`,
        highRiskCases: highRisk.map((p) => ({
          name: p.name,
          detail: `आयु ${p.age}, ${p.pregnancyMonth} माह गर्भवती, BP ${p.systolic}/${p.diastolic}। लक्षण: ${p.symptoms.join(', ') || 'कोई नहीं'}`,
          action: 'BP प्रबंधन और भ्रूण निगरानी के लिए 24 घंटे के भीतर निकटतम PHC में रेफर करें।',
        })),
        closingNote: 'सभी उच्च-जोखिम वाली रोगियों को आगे के मूल्यांकन और प्रबंधन के लिए 24 घंटे के भीतर निकटतम PHC में रेफर किया जाना चाहिए।',
        plainText: '',
      },
      mr: {
        title: `आशा दैनंदिन तपासणी अहवाल — ${new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        overview: `आज ${patients.length} गरोदर महिलांची तपासणी करण्यात आली. ${highRisk.length} जणींना उच्च-धोका म्हणून ओळखले गेले, ज्यांना तात्काळ ANM लक्ष देणे आवश्यक आहे.`,
        highRiskCases: highRisk.map((p) => ({
          name: p.name,
          detail: `वय ${p.age}, ${p.pregnancyMonth} महिने गरोदर, BP ${p.systolic}/${p.diastolic}. लक्षणे: ${p.symptoms.join(', ') || 'काहीही नाही'}`,
          action: 'BP व्यवस्थापन आणि गर्भ निरीक्षणासाठी 24 तासांच्या आत जवळच्या PHC मध्ये संदर्भित करा.',
        })),
        closingNote: 'सर्व उच्च-धोका रुग्णांना पुढील मूल्यांकन आणि व्यवस्थापनासाठी 24 तासांच्या आत जवळच्या PHC मध्ये संदर्भित केले पाहिजे.',
        plainText: '',
      },
    };

    const report = mockReports[language];
    report.plainText = formatReportAsPlainText(report);
    return report;
  }

  try {
    const groq = getClient();

    const patientTable = patients
      .map(
        (p, i) =>
          `${i + 1}. ${p.name} | Age ${p.age} | ${p.pregnancyMonth} mo pregnant | BP ${p.systolic}/${p.diastolic} | Symptoms: ${p.symptoms.length > 0 ? p.symptoms.join(', ') : 'none'} | Risk: ${p.riskLevel}`,
      )
      .join('\n');

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: getANMPrompt(language) },
        {
          role: 'user',
          content: `Here are today's patient screening records:\n\n${patientTable}`,
        },
      ],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const raw = chatCompletion.choices[0].message.content || '{}';
    console.log('[ai] Raw ANM summary response:', raw);

    const parsed = JSON.parse(raw) as Partial<ANMReport>;

    const report: ANMReport = {
      title: parsed.title || 'ASHA Daily Report',
      overview: parsed.overview || '',
      highRiskCases: Array.isArray(parsed.highRiskCases) ? parsed.highRiskCases : [],
      closingNote: parsed.closingNote || '',
      plainText: '',
    };

    report.plainText = formatReportAsPlainText(report);
    console.log('[ai] ANM summary generated:', report);
    return report;
  } catch (error) {
    console.error('[ai] Groq ANM summary error:', error);
    throw error;
  }
}

/** Convert structured report to plain text for WhatsApp sharing. */
function formatReportAsPlainText(report: ANMReport): string {
  const lines: string[] = [
    report.title,
    '',
    report.overview,
    '',
  ];

  if (report.highRiskCases.length > 0) {
    lines.push('⚠ HIGH RISK CASES:');
    report.highRiskCases.forEach((c) => {
      lines.push(`• ${c.name} — ${c.detail}`);
      lines.push(`  → ${c.action}`);
    });
    lines.push('');
  }

  lines.push(report.closingNote);
  lines.push('', '— Generated by Awaaz ASHA Dashboard');
  return lines.join('\n');
}
