import type { Patient } from '../types/patient';

type RiskLevel = Patient['riskLevel'];

/** High-risk symptom keywords (case-insensitive match). */
const HIGH_RISK_SYMPTOMS = ['blurred vision', 'severe headache'];

/**
 * Calculates a patient's risk level based on BP readings,
 * month of pregnancy, and symptom list.
 *
 * Rules:
 *  - **High**:   systolic > 140  OR  diastolic > 90
 *                OR symptoms include 'blurred vision' / 'severe headache'
 *  - **Medium**: systolic > 130  OR  monthOfPregnancy > 8
 *  - **Stable**: everything else
 */
export function calculateRisk(
  systolic: number,
  diastolic: number,
  symptoms: string[],
  monthOfPregnancy?: number,
): RiskLevel {
  // ── High Risk ──
  if (systolic > 140 || diastolic > 90) return 'high';

  const normalised = symptoms.map((s) => s.toLowerCase().trim());
  if (normalised.some((s) => HIGH_RISK_SYMPTOMS.includes(s))) return 'high';

  // ── Medium Risk ──
  if (systolic > 130) return 'medium';
  if (monthOfPregnancy != null && monthOfPregnancy > 8) return 'medium';

  // ── Stable ──
  return 'stable';
}
