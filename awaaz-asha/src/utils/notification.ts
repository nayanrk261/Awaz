import type { Patient } from '../types/patient';

export function generateWhatsAppMessage(patient: Patient): string {
  const isHigh = patient.riskLevel === 'high';
  const statusHi = isHigh ? 'उच्च जोखिम' : patient.riskLevel === 'medium' ? 'मध्यम जोखिम' : 'सामान्य';

  return `🚨 *URGENT MEDICAL ALERT* 🚨
Patient: ${patient.name}
Status: ${patient.riskLevel} Risk
Metrics: BP ${patient.systolic}/${patient.diastolic}, ${patient.pregnancyMonth} months pregnant.
Symptoms: ${patient.symptoms.length > 0 ? patient.symptoms.join(', ') : 'None'}

हिंदी में: 🚨 *जरूरी सूचना* 🚨
मरीज का नाम: ${patient.name}
स्थिति: ${statusHi}
बीपी: ${patient.systolic}/${patient.diastolic}
महीना: ${patient.pregnancyMonth}
लक्षण: ${patient.symptoms.length > 0 ? patient.symptoms.join(', ') : 'कोई नहीं'}`;
}
