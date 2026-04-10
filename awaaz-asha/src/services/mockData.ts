import type { Patient } from '../types/patient';

/**
 * Mock patient data matching the dashboard UI.
 * Risk levels are pre-computed to align with `calculateRisk` output.
 */
export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p-001',
    name: 'Sunita Devi',
    age: 28,
    pregnancyMonth: 7,
    systolic: 150,
    diastolic: 100,
    symptoms: ['leg swelling', 'severe headache'],
    riskLevel: 'high',
    timestamp: '10:32 AM',
    rawTranscript:
      'Sunita Devi, 28 saal, 7 mahine pregnant, BP 150 by 100. Pair mein sujan hai. Pichle hafte se sir dard ki shikayat hai.',
  },
  {
    id: 'p-002',
    name: 'Meera Kumari',
    age: 24,
    pregnancyMonth: 5,
    systolic: 138,
    diastolic: 92,
    symptoms: ['dizziness', 'blurred vision'],
    riskLevel: 'high',
    timestamp: '10:15 AM',
    rawTranscript:
      'Meera Kumari, 24 saal, 5 mahine pregnant, BP 138 by 92. Chakkar aate hain aur dhundla dikhta hai.',
  },
  {
    id: 'p-003',
    name: 'Priya Sharma',
    age: 30,
    pregnancyMonth: 6,
    systolic: 132,
    diastolic: 84,
    symptoms: ['mild headache'],
    riskLevel: 'medium',
    timestamp: '9:48 AM',
    rawTranscript:
      'Priya Sharma, 30 saal, 6 mahine pregnant, BP 132 by 84. Halka sir dard hai.',
  },
  {
    id: 'p-004',
    name: 'Anita Yadav',
    age: 22,
    pregnancyMonth: 4,
    systolic: 120,
    diastolic: 78,
    symptoms: [],
    riskLevel: 'stable',
    timestamp: '9:30 AM',
    rawTranscript:
      'Anita Yadav, 22 saal, 4 mahine pregnant, BP 120 by 78. Koi shikayat nahi hai.',
  },
  {
    id: 'p-005',
    name: 'Kavita Singh',
    age: 26,
    pregnancyMonth: 8,
    systolic: 118,
    diastolic: 76,
    symptoms: ['fatigue'],
    riskLevel: 'stable',
    timestamp: '9:12 AM',
    rawTranscript:
      'Kavita Singh, 26 saal, 8 mahine pregnant, BP 118 by 76. Thakan rehti hai lekin baaki sab theek.',
  },
];
