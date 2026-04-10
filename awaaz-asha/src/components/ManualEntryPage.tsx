import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Heart,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';
import type { Patient } from '../types/patient';
import { calculateRisk } from '../utils/riskEngine';
import { useLanguage } from '../context/LanguageContext';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface ManualEntryPageProps {
  onBack: () => void;
  onSave: (patient: Patient) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function ManualEntryPage({ onBack, onSave }: ManualEntryPageProps) {
  const { t } = useLanguage();
  /* ── form state ── */
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    visitType: 'Antenatal Care',
    pregnancyMonth: '',
    systolic: '',
    diastolic: '',
    symptoms: '',
    vaccinationStatus: 'Not Applicable',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ── handlers ── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Patient Name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.visitType) newErrors.visitType = 'Visit Type is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const systolicVal = formData.systolic ? Number(formData.systolic) : 0;
    const diastolicVal = formData.diastolic ? Number(formData.diastolic) : 0;
    const pregnancyMonthVal = formData.pregnancyMonth
      ? Number(formData.pregnancyMonth)
      : 0;
    const symptomsArr = formData.symptoms
      ? formData.symptoms
          .split(/\n|,/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const riskLevel =
      systolicVal > 0 && diastolicVal > 0
        ? calculateRisk(
            systolicVal,
            diastolicVal,
            symptomsArr,
            pregnancyMonthVal || undefined,
          )
        : 'stable';

    const newPatient: Patient = {
      id: Date.now().toString(),
      name: formData.name,
      age: Number(formData.age),
      pregnancyMonth: pregnancyMonthVal,
      systolic: systolicVal,
      diastolic: diastolicVal,
      symptoms: symptomsArr,
      riskLevel: riskLevel,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      rawTranscript: 'Manually entered',
      visitType: formData.visitType,
      vaccinationStatus: formData.vaccinationStatus,
    };

    onSave(newPatient);
  };

  /* ── derived ── */
  const isHighBP =
    Number(formData.systolic) > 140 || Number(formData.diastolic) > 90;

  /* ── inline style objects ── */
  const page: React.CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#F8F3E8',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  };

  const container: React.CSSProperties = {
    maxWidth: 680,
    margin: '0 auto',
    padding: '32px 24px',
  };

  const backBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#6B7280',
    transition: 'color 0.2s',
  };

  const pageTitle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: '#1F2937',
    margin: 0,
    lineHeight: 1.3,
  };

  const card: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
  };

  const sectionHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: '#374151',
    margin: 0,
  };

  const label: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: '#4B5563',
    marginBottom: 6,
  };

  const input: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: 16,
    padding: '14px 16px',
    fontSize: 14,
    color: '#1F2937',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  };

  const selectWrap: React.CSSProperties = {
    position: 'relative',
  };

  const select: React.CSSProperties = {
    ...input,
    appearance: 'none' as const,
    cursor: 'pointer',
    paddingRight: 40,
  };

  const chevron: React.CSSProperties = {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#9CA3AF',
  };

  const errorText: React.CSSProperties = {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    paddingLeft: 4,
  };

  const iconCircle = (
    bg: string,
    color: string,
  ): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bg,
    color,
    flexShrink: 0,
  });

  const bpDivider: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 300,
    color: '#D1D5DB',
    paddingBottom: 10,
    userSelect: 'none',
  };

  const mmhgBadge: React.CSSProperties = {
    backgroundColor: '#F3F4F6',
    padding: '6px 8px',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 700,
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    alignSelf: 'flex-end',
    marginBottom: 10,
    whiteSpace: 'nowrap',
  };

  const warningBox: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    border: '1px solid #F87171',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 11,
    color: '#DC2626',
  };

  const saveBtn: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D6A4F',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: 16,
    borderRadius: 16,
    padding: '16px 0',
    marginTop: 8,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  /* ── focus handler for inputs ── */
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.boxShadow = '0 0 0 2px #BBF7D0';
    e.target.style.borderColor = '#4ADE80';
    e.target.style.backgroundColor = '#FFFFFF';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.boxShadow = 'none';
    e.target.style.borderColor = '#E5E7EB';
    e.target.style.backgroundColor = '#F9FAFB';
  };

  /* ── render ── */
  return (
    <div style={page}>
      <div style={container}>

        {/* ═══ HEADER ═══ */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={onBack}
            style={backBtn}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#1F2937';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
            }}
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h1 style={pageTitle}>{t("addPatient")}</h1>
        </div>

        {/* ═══ CARD 1 — Patient Info ═══ */}
        <div style={card}>
          <div style={sectionHeader}>
            <div style={iconCircle('#EFF6FF', '#3B82F6')}>
              <User size={16} />
            </div>
            <span style={sectionTitle}>Patient Info</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Patient Name */}
            <div>
              <label style={label}>{t("patientName")}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Enter full name"
                style={input}
              />
              {errors.name && <span style={errorText}>{errors.name}</span>}
            </div>

            {/* Age + Visit Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={label}>Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Years"
                  style={input}
                />
                {errors.age && <span style={errorText}>{errors.age}</span>}
              </div>

              <div>
                <label style={label}>{t("visitType")}</label>
                <div style={selectWrap}>
                  <select
                    name="visitType"
                    value={formData.visitType}
                    onChange={handleChange}
                    onFocus={handleFocus as any}
                    onBlur={handleBlur as any}
                    style={select}
                  >
                    <option value="Antenatal Care">Antenatal Care</option>
                    <option value="TB Screening">TB Screening</option>
                    <option value="Newborn Care">Newborn Care</option>
                    <option value="Immunization">Immunization</option>
                    <option value="General">General</option>
                  </select>
                  <ChevronDown size={18} style={chevron} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ CARD 2 — Health Details ═══ */}
        <div style={card}>
          <div style={sectionHeader}>
            <div style={iconCircle('#FEF2F2', '#F87171')}>
              <Heart size={16} />
            </div>
            <span style={sectionTitle}>Health Details</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Pregnancy Month — conditional */}
            {formData.visitType === 'Antenatal Care' && (
              <div>
                <label style={label}>{t("pregnancyMonth")}</label>
                <input
                  type="number"
                  name="pregnancyMonth"
                  min={1}
                  max={9}
                  value={formData.pregnancyMonth}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Current month"
                  style={input}
                />
              </div>
            )}

            {/* Blood Pressure */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={label}>Systolic</label>
                  <input
                    type="number"
                    name="systolic"
                    value={formData.systolic}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="120"
                    style={{ ...input, textAlign: 'center' }}
                  />
                </div>

                <div style={bpDivider}>/</div>

                <div style={{ flex: 1 }}>
                  <label style={label}>Diastolic</label>
                  <input
                    type="number"
                    name="diastolic"
                    value={formData.diastolic}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="80"
                    style={{ ...input, textAlign: 'center' }}
                  />
                </div>

                <div style={mmhgBadge}>mmHg</div>
              </div>

              {/* High BP Warning */}
              {isHighBP && (
                <div style={warningBox}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>⚠</span>
                  <span>Elevated BP — will be flagged as High Risk</span>
                </div>
              )}
            </div>

            {/* Symptoms */}
            <div>
              <label style={label}>{t("symptoms")}</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                onFocus={handleFocus as any}
                onBlur={handleBlur as any}
                placeholder="Describe symptoms here..."
                style={{
                  ...input,
                  minHeight: 100,
                  resize: 'none',
                  lineHeight: 1.6,
                }}
              />
            </div>
          </div>
        </div>

        {/* ═══ CARD 3 — Additional ═══ */}
        <div style={{ ...card, marginBottom: 32 }}>
          <div style={sectionHeader}>
            <div style={iconCircle('#F0FDF4', '#22C55E')}>
              <ClipboardList size={16} />
            </div>
            <span style={sectionTitle}>Additional</span>
          </div>

          <div>
            <label style={label}>{t("vaccinationStatus")}</label>
            <div style={selectWrap}>
              <select
                name="vaccinationStatus"
                value={formData.vaccinationStatus}
                onChange={handleChange}
                onFocus={handleFocus as any}
                onBlur={handleBlur as any}
                style={select}
              >
                <option value="Done">Done</option>
                <option value="Pending">Pending</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
              <ChevronDown size={18} style={chevron} />
            </div>
          </div>
        </div>

        {/* ═══ SAVE BUTTON ═══ */}
        <button
          onClick={handleSave}
          style={saveBtn}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#245c43';
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2D6A4F';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.99)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          {t("saveRecord")}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
