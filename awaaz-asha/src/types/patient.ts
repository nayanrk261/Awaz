export interface Patient {
  id: string;
  name: string;
  age: number;
  pregnancyMonth: number;
  systolic: number;
  diastolic: number;
  symptoms: string[];
  riskLevel: 'high' | 'medium' | 'stable';
  timestamp: string;
  rawTranscript: string;
  notified?: boolean;
  notifiedAt?: string;
  visitType?: string;
  vaccinationStatus?: string;
}
