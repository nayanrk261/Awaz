import { useState, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  LayoutDashboard,
  FilePlus2,
  Users,
  ClipboardList,
  Bell,
  ChevronRight,
  AlertTriangle,
  LogOut,
  Radio,
  Clock,
  Loader2,
  HardDriveDownload,
  FileText,
  Share2,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  X,
  Pencil,
  Save,
  Heart,
  Calendar,
  Activity,
  MessageSquareText,
  ShieldAlert,
  MessageCircle,
  Search,
  Phone,
  User,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Filter,
} from "lucide-react";
import type { Patient } from "./types/patient";
import { MOCK_PATIENTS } from "./services/mockData";
import { useSpeechToText } from "./hooks/useSpeechToText";
import { extractPatientData, generateDailySummary } from "./services/ai";
import type { ANMReport, SummaryLanguage } from "./services/ai";
import { calculateRisk } from "./utils/riskEngine";
import { generateWhatsAppMessage } from "./utils/notification";
import { ManualEntryPage } from "./components/ManualEntryPage";
import { PatientListPage } from "./components/PatientListPage";
import { useLanguage } from "./context/LanguageContext";
/* ══════════════════════════════════════════════════════════════
   Sidebar Menu
   ══════════════════════════════════════════════════════════════ */
// MENU_ITEMS definition moved inside App() to access t() hook

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */
function getRiskStyle(risk: Patient["riskLevel"]) {
  switch (risk) {
    case "high":
      return {
        border: "#C0392B",
        badgeBg: "rgba(192,57,43,0.08)",
        badgeText: "#C0392B",
        avatarBg: "#FDECEC",
        avatarText: "#A93226",
        rowBg: "#FDF8F7",
        label: "⚠ High Risk",
      };
    case "medium":
      return {
        border: "#D4860A",
        badgeBg: "rgba(212,134,10,0.08)",
        badgeText: "#B8740A",
        avatarBg: "#FDF6E8",
        avatarText: "#956008",
        rowBg: "#FFFFFF",
        label: "Medium",
      };
    default:
      return {
        border: "#1B6E3E",
        badgeBg: "rgba(27,110,62,0.08)",
        badgeText: "#1B6E3E",
        avatarBg: "#E8F5EE",
        avatarText: "#155731",
        rowBg: "#FFFFFF",
        label: "Stable",
      };
  }
}

/** Derive initials from a patient name (first letter of first + last name). */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateTime(): string {
  const now = new Date();
  return now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* ══════════════════════════════════════════════════════════════
   Stat Card
   ══════════════════════════════════════════════════════════════ */
type RiskFilter = 'all' | 'high' | 'medium' | 'stable';

function StatCard({
  label,
  value,
  color,
  id,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  id: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      id={id}
      onClick={onClick}
      className="bg-card overflow-hidden flex flex-col gap-1 cursor-pointer transition-all duration-200"
      style={{
        borderRadius: 14,
        border: active ? `2px solid ${color}` : "1px solid var(--color-card-border)",
        padding: active ? "19px 21px" : "20px 22px",
        backgroundColor: active ? `${color}08` : undefined,
        boxShadow: active ? `0 4px 16px ${color}18` : undefined,
        transform: active ? 'scale(1.02)' : undefined,
      }}
    >
      <span
        style={{
          fontSize: 26,
          fontWeight: 700,
          color,
          letterSpacing: "-0.03em",
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </span>
      <span className="text-text-secondary" style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>
        {label}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Patient Card
   ══════════════════════════════════════════════════════════════ */
function PatientCard({ patient, onClick }: { patient: Patient; onClick?: () => void }) {
  const s = getRiskStyle(patient.riskLevel);
  const isHigh = patient.riskLevel === "high";
  const initials = getInitials(patient.name);

  return (
    <div
      id={`patient-${patient.id}`}
      onClick={onClick}
      className="group cursor-pointer transition-shadow duration-200 hover:shadow-md"
      style={{
        backgroundColor: s.rowBg,
        borderRadius: 14,
        border: "1px solid var(--color-card-border)",
        borderLeft: `3px solid ${s.border}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 20px",
      }}
    >
      {/* Avatar */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: s.avatarBg,
          color: s.avatarText,
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "var(--font-sans)",
        }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4
          className="truncate"
          style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}
        >
          {patient.name}
        </h4>
        <p
          className="mt-0.5"
          style={{
            fontSize: 12,
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          Age {patient.age} · {patient.pregnancyMonth} mo · BP {patient.systolic}/{patient.diastolic}
        </p>
      </div>

      {/* Right — Badge + Time */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className="inline-flex items-center gap-1"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: s.badgeText,
            backgroundColor: s.badgeBg,
            padding: "4px 10px",
            borderRadius: 20,
          }}
        >
          {isHigh && <AlertTriangle size={12} className="animate-blink" />}
          {s.label}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-text-tertiary)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          {patient.timestamp}
        </span>
      </div>

      {/* Hover chevron */}
      <ChevronRight
        size={16}
        className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Patient Detail Modal
   ══════════════════════════════════════════════════════════════ */
function getRiskExplanation(p: Patient): string[] {
  const reasons: string[] = [];
  if (p.systolic > 140) reasons.push(`Systolic BP ${p.systolic} is above the 140 threshold.`);
  if (p.diastolic > 90) reasons.push(`Diastolic BP ${p.diastolic} is above the 90 threshold.`);
  const dangerousSymptoms = p.symptoms.filter((sym) =>
    ['blurred vision', 'severe headache'].includes(sym.toLowerCase().trim()),
  );
  if (dangerousSymptoms.length > 0)
    reasons.push(`Dangerous symptom(s): ${dangerousSymptoms.join(', ')}.`);
  if (p.systolic > 130 && p.systolic <= 140)
    reasons.push(`Systolic BP ${p.systolic} is in the elevated range (130–140).`);
  if (p.pregnancyMonth > 8)
    reasons.push(`Late-stage pregnancy (${p.pregnancyMonth} months) increases risk.`);
  if (reasons.length === 0) reasons.push('All vitals are within normal range.');
  return reasons;
}

function PatientDetailModal({
  patient,
  onClose,
  onSave,
}: {
  patient: Patient;
  onClose: () => void;
  onSave: (updated: Patient) => void;
}) {
  const s = getRiskStyle(patient.riskLevel);
  const initials = getInitials(patient.name);
  const reasons = getRiskExplanation(patient);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(patient.name);
  const [editSystolic, setEditSystolic] = useState(String(patient.systolic));
  const [editDiastolic, setEditDiastolic] = useState(String(patient.diastolic));

  const handleSaveEdit = () => {
    const updated: Patient = {
      ...patient,
      name: editName.trim() || patient.name,
      systolic: Number(editSystolic) || patient.systolic,
      diastolic: Number(editDiastolic) || patient.diastolic,
    };
    updated.riskLevel = calculateRisk(
      updated.systolic,
      updated.diastolic,
      updated.symptoms,
      updated.pregnancyMonth || undefined,
    );
    onSave(updated);
    setIsEditing(false);
  };

  return (
    <div 
      id="patient-detail-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        id="patient-detail-modal"
        className="relative animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)',
          margin: '0 16px',
        }}
      >
        {/* ── Top bar ── */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '20px 28px 16px',
            borderBottom: '1px solid var(--color-card-border)',
          }}
        >
          <button
            id="detail-back-btn"
            onClick={onClose}
            className="flex items-center gap-2 cursor-pointer border-none outline-none bg-transparent"
            style={{ fontSize: 14, fontWeight: 600, color: '#636366' }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            id="detail-close-btn"
            onClick={onClose}
            className="flex items-center justify-center cursor-pointer border-none outline-none"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#F2F2F7',
            }}
            aria-label="Close"
          >
            <X size={18} color="#636366" />
          </button>
        </div>

        {/* ── Patient Header ── */}
        <div className="flex items-center gap-5" style={{ padding: '28px 28px 0' }}>
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: s.avatarBg,
              color: s.avatarText,
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              border: `2px solid ${s.border}`,
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-card-border)',
                  borderRadius: 10,
                  padding: '6px 12px',
                  width: '100%',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            ) : (
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {patient.name}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-flex items-center gap-1"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: s.badgeText,
                  backgroundColor: s.badgeBg,
                  padding: '4px 12px',
                  borderRadius: 20,
                }}
              >
                {patient.riskLevel === 'high' && <AlertTriangle size={12} />}
                {s.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {patient.timestamp}
              </span>
            </div>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-3 gap-3" style={{ padding: '24px 28px' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '18px 12px',
              borderRadius: 14,
              backgroundColor: '#FDF8F7',
              border: '1px solid #F5D0CE',
            }}
          >
            <Activity size={18} color="#C0392B" style={{ margin: '0 auto 6px' }} />
            {isEditing ? (
              <div className="flex items-center justify-center gap-1">
                <input
                  id="edit-systolic"
                  value={editSystolic}
                  onChange={(e) => setEditSystolic(e.target.value)}
                  style={{
                    width: 42,
                    fontSize: 18,
                    fontWeight: 700,
                    textAlign: 'center' as const,
                    border: '1px solid var(--color-card-border)',
                    borderRadius: 6,
                    padding: '2px 4px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#C0392B' }}>/</span>
                <input
                  id="edit-diastolic"
                  value={editDiastolic}
                  onChange={(e) => setEditDiastolic(e.target.value)}
                  style={{
                    width: 42,
                    fontSize: 18,
                    fontWeight: 700,
                    textAlign: 'center' as const,
                    border: '1px solid var(--color-card-border)',
                    borderRadius: 6,
                    padding: '2px 4px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
              </div>
            ) : (
              <span style={{ fontSize: 22, fontWeight: 700, color: '#C0392B', fontFamily: 'var(--font-mono)', display: 'block' }}>
                {patient.systolic}/{patient.diastolic}
              </span>
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', display: 'block', marginTop: 4 }}>Blood Pressure</span>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '18px 12px',
              borderRadius: 14,
              backgroundColor: '#FAF9F7',
              border: '1px solid var(--color-card-border)',
            }}
          >
            <Heart size={18} color="#E85D27" style={{ margin: '0 auto 6px' }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', display: 'block' }}>
              {patient.age}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', display: 'block', marginTop: 4 }}>Age (years)</span>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '18px 12px',
              borderRadius: 14,
              backgroundColor: '#FAF9F7',
              border: '1px solid var(--color-card-border)',
            }}
          >
            <Calendar size={18} color="#D4860A" style={{ margin: '0 auto 6px' }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', display: 'block' }}>
              {patient.pregnancyMonth}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', display: 'block', marginTop: 4 }}>Month of Pregnancy</span>
          </div>
        </div>

        {/* ── Symptoms ── */}
        {patient.symptoms.length > 0 && (
          <div style={{ padding: '0 28px 20px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Symptoms</span>
            <div className="flex flex-wrap gap-2">
              {patient.symptoms.map((sym, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: ['blurred vision', 'severe headache'].includes(sym.toLowerCase()) ? '#C0392B' : 'var(--color-text-secondary)',
                    backgroundColor: ['blurred vision', 'severe headache'].includes(sym.toLowerCase()) ? 'rgba(192,57,43,0.08)' : '#F2F2F7',
                    padding: '5px 12px',
                    borderRadius: 20,
                  }}
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Risk Assessment ── */}
        <div style={{ padding: '0 28px 20px' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <ShieldAlert size={15} color={s.badgeText} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              Risk Assessment
            </span>
          </div>
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              backgroundColor: patient.riskLevel === 'high' ? '#FDF8F7' : patient.riskLevel === 'medium' ? '#FDF6E8' : '#E8F5EE',
              borderLeft: `3px solid ${s.border}`,
            }}
          >
            {reasons.map((r, i) => (
              <p key={i} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: i < reasons.length - 1 ? 4 : 0 }}>
                • {r}
              </p>
            ))}
          </div>
        </div>

        {/* ── Voice Note Recap ── */}
        {patient.rawTranscript && (
          <div style={{ padding: '0 28px 24px' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <MessageSquareText size={15} color="var(--color-text-tertiary)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Voice Note Recap
              </span>
            </div>
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                backgroundColor: '#FAF9F7',
                border: '1px solid var(--color-card-border)',
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "{patient.rawTranscript}"
              </p>
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div
          className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full"
          style={{
            padding: '24px',
            borderTop: '1px solid var(--color-card-border)',
          }}
        >
          {isEditing ? (
            <>
              <button
                id="save-edit-btn"
                onClick={handleSaveEdit}
                className="flex-1 flex items-center justify-center gap-2 cursor-pointer border-none outline-none w-full"
                style={{
                  minHeight: 56,
                  padding: '0 24px',
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: 'linear-gradient(145deg, #1B6E3E 0%, #27AE60 100%)',
                  boxShadow: '0 4px 14px rgba(27,110,62,0.3)',
                }}
              >
                <Save size={18} />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditName(patient.name);
                  setEditSystolic(String(patient.systolic));
                  setEditDiastolic(String(patient.diastolic));
                }}
                className="flex items-center justify-center gap-2 cursor-pointer border-none outline-none w-full sm:w-auto"
                style={{
                  minHeight: 56,
                  padding: '0 24px',
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#636366',
                  backgroundColor: '#F2F2F7',
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                id="edit-details-btn"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto flex-none flex items-center justify-center gap-2 cursor-pointer border-none outline-none transition-colors"
                style={{
                  minHeight: 56,
                  padding: '0 24px',
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#475569',
                  backgroundColor: '#F1F5F9',
                }}
              >
                <Pencil size={18} />
                <span className="sm:hidden">Edit Details</span>
              </button>
              <button
                id="notify-doctor-btn"
                onClick={() => {
                  window.open(`https://wa.me/?text=${encodeURIComponent(generateWhatsAppMessage(patient))}`, '_blank');
                  onSave({
                    ...patient,
                    notified: true,
                    notifiedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                  });
                }}
                className={`flex-1 w-full flex items-center justify-center gap-2 cursor-pointer border-none outline-none transition-colors ${patient.riskLevel === 'high' && !patient.notified ? 'animate-risk-pulse' : ''}`}
                style={{
                  minHeight: 56,
                  padding: '0 24px',
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  color: patient.notified ? '#475569' : '#FFFFFF',
                  background: patient.notified ? '#F1F5F9' : '#059669',
                  boxShadow: patient.notified ? 'none' : '0 4px 14px rgba(5,150,105,0.3)',
                }}
              >
                {patient.notified ? (
                  <>
                    <CheckCircle2 size={18} color="#059669" />
                    ✓ Notified to Doctor
                  </>
                ) : (
                  <>
                    <MessageCircle size={18} />
                    Notify Doctor
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main App
   ══════════════════════════════════════════════════════════════ */
const LS_KEY = 'awaaz_patient_data';

/** Load patients from localStorage, falling back to mock data on first visit. */
function loadPatients(): Patient[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Patient[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[App] Failed to read localStorage:', e);
  }
  return MOCK_PATIENTS;
}

export default function App() {
  const { t, setLanguage, language } = useLanguage();
  
  const MENU_ITEMS = [
    { id: "dashboard",   label: t("dashboard"),    icon: <LayoutDashboard size={18} /> },
    { id: "new-survey",  label: t("newSurvey"),   icon: <FilePlus2 size={18} /> },
    { id: "patients",    label: t("patients"),     icon: <Users size={18} /> },
    { id: "anm-summary", label: t("anmSummary"),  icon: <ClipboardList size={18} /> },
    { id: "alerts",      label: t("alerts"),       icon: <Bell size={18} /> },
  ];

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; ashaId: string; village: string; loggedInAt?: string } | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', ashaId: '', village: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'asha' | 'anm' | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('awaaz_user');
    if (session) {
      setUser(JSON.parse(session));
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // STEP 1 — Determine role from credentials and save to localStorage
    const isAnm = authForm.ashaId === 'anm01';
    const role: 'asha' | 'anm' = isAnm ? 'anm' : 'asha';
    localStorage.setItem('userRole', role);
    const newUser = {
      name: isAnm ? 'Dr. Priya Menon' : 'Savita Kale',
      ashaId: authForm.ashaId || 'ASHA-10492',
      village: isLogin ? 'Pune District' : authForm.village || 'Unknown Village',
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem('awaaz_user', JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [dateTime, setDateTime] = useState(formatDateTime());
  const [patients, setPatients] = useState<Patient[]>(loadPatients);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [anmReport, setAnmReport] = useState<ANMReport | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [summaryLang, setSummaryLang] = useState<SummaryLanguage>('en');
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const {
    isListening: isRecording,
    isSupported: isSpeechSupported,
    transcript: liveTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText('hi-IN');

  /* ── Persist patients to localStorage on every change ── */
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(patients));
      console.log('[App] 💾 Saved', patients.length, 'patients to localStorage');
    } catch (e) {
      console.warn('[App] Failed to write localStorage:', e);
    }
  }, [patients]);

  useEffect(() => {
    const t = setInterval(() => setDateTime(formatDateTime()), 60_000);
    return () => clearInterval(t);
  }, []);

  /* ── Stop recording → AI extraction → add patient ── */
  const handleStopRecording = useCallback(async () => {
    stopListening();

    const text = liveTranscript.trim();
    if (!text) {
      console.warn('[App] No transcript text — skipping extraction.');
      return;
    }

    console.log('[App] Transcript captured, sending to Groq:', text);
    setIsAnalyzing(true);

    try {
      const extracted = await extractPatientData(text);
      console.log('[App] Groq returned data:', extracted);

      // Null-safe risk: if BP values are null, default to 'stable'
      // rather than passing fake numbers that could trigger a wrong risk level.
      const hasBP = extracted.systolic != null && extracted.diastolic != null;
      const riskLevel = hasBP
        ? calculateRisk(
            extracted.systolic!,
            extracted.diastolic!,
            extracted.symptoms,
            extracted.pregnancyMonth ?? undefined,
          )
        : 'stable' as const;

      console.log('[App] Calculated risk level:', riskLevel);

      const newPatient: Patient = {
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: extracted.name ?? 'Unknown Patient',
        age: extracted.age ?? 0,
        pregnancyMonth: extracted.pregnancyMonth ?? 0,
        systolic: extracted.systolic ?? 0,
        diastolic: extracted.diastolic ?? 0,
        symptoms: extracted.symptoms,
        riskLevel,
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        rawTranscript: text,
      };

      setPatients((prev) => [newPatient, ...prev]);
      resetTranscript();
      setActiveMenu('dashboard');
      console.log('[App] ✅ New patient added:', newPatient);
    } catch (err) {
      console.error('[App] ❌ AI extraction failed:', err);
      // Don't crash — the user can try again
    } finally {
      setIsAnalyzing(false);
    }
  }, [stopListening, liveTranscript]);

  const total = patients.length;
  const highCount = patients.filter((p) => p.riskLevel === "high").length;
  const medCount = patients.filter((p) => p.riskLevel === "medium").length;
  const stableCount = patients.filter((p) => p.riskLevel === "stable").length;

  /* ── Generate ANM Summary ── */
  const handleGenerateSummary = useCallback(async (lang?: SummaryLanguage) => {
    const targetLang = lang ?? summaryLang;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    setAnmReport(null);
    setCopied(false);

    try {
      const report = await generateDailySummary(patients, targetLang);
      setAnmReport(report);
      console.log('[App] ✅ ANM Summary generated');
    } catch (err) {
      console.error('[App] ❌ ANM summary generation failed:', err);
      setSummaryError('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [patients, summaryLang]);

  /* ── Language switch handler ── */
  const handleLanguageSwitch = useCallback((lang: SummaryLanguage) => {
    setSummaryLang(lang);
    setAnmReport(null);
    // Will trigger auto-generation via the useEffect below
  }, []);

  /* ── Share via WhatsApp (copy to clipboard) ── */
  const handleShareSummary = useCallback(async () => {
    if (!anmReport) return;
    try {
      await navigator.clipboard.writeText(anmReport.plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      // Open WhatsApp web with the translated plain-text summary
      const encoded = encodeURIComponent(anmReport.plainText);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    } catch {
      console.warn('[App] Clipboard write failed');
    }
  }, [anmReport]);

  /* ── Download Register CSV ── */
  const downloadRegisterCSV = useCallback(() => {
    const headers = "Name,Age,PregnancyMonth,Systolic,Diastolic,Risk,Date\n";
    const csvContent = patients.map(p => {
      const risk = p.riskLevel.charAt(0).toUpperCase() + p.riskLevel.slice(1);
      const csvDate = p.timestamp ? p.timestamp.replace(/,/g, '') : '';
      return `"${p.name}",${p.age},${p.pregnancyMonth},${p.systolic},${p.diastolic},${risk},"${csvDate}"`;
    }).join("\n");
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Awaaz_Master_Register.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [patients]);

  /* ── Auto-generate summary when switching to ANM tab or changing language ── */
  useEffect(() => {
    if (activeMenu === 'anm-summary' && !anmReport && !isGeneratingSummary) {
      handleGenerateSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu, summaryLang]);

  /* Waveform bar config */
  const waveConfig = Array.from({ length: 28 }, (_, i) => ({
    delay: ((i * 7) % 28) * 0.045,
    height: 10 + Math.round(Math.sin(i * 0.6) * 12 + 12),
  }));

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8F3E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ backgroundColor:'white', borderRadius:'28px', padding:'40px', width:'100%', maxWidth:'400px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', border:'1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#FFF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={32} color="#E05C3A" />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, letterSpacing: '0.08em' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#E05C3A' }}>AWAAZ</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{' '}• HEALTH REGISTRY</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', marginTop: 4, textAlign: 'center' }}>{t("loginTitle") || "Welcome Back"}</h2>
          <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 }}>{t("loginSubtitle") || "Login to your account"}</p>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            
            <label style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', marginBottom: '6px', display: 'block' }}>ASHA ID</label>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                <User size={16} color="#9CA3AF" />
              </div>
              <input
                type="text"
                required
                value={authForm.ashaId}
                onChange={(e) => setAuthForm({ ...authForm, ashaId: e.target.value })}
                style={{ width:'100%', boxSizing:'border-box', backgroundColor:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:'16px', padding:'14px 16px 14px 44px', fontSize:'14px', color:'#374151', outline:'none' }}
                placeholder={t("workerId") || "Enter your ID"}
              />
            </div>

            <label style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', marginBottom: '6px', display: 'block' }}>Password</label>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="#9CA3AF" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                style={{ width:'100%', boxSizing:'border-box', backgroundColor:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:'16px', padding:'14px 16px 14px 44px', fontSize:'14px', color:'#374151', outline:'none', paddingRight: 48 }}
                placeholder={t("password") || "Enter your password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
              </button>
            </div>

            <button
              type="submit"
              style={{ width: '100%', backgroundColor: '#E05C3A', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 16, padding: '16px 0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '8px', marginBottom: '16px' }}
            >
              {t("loginButton") || "Login / लॉगिन"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div>
            <span style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, display: 'block' }}>Select your role:</span>
            <div style={{ display:'flex', gap:'10px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('asha');
                  setAuthForm({ ...authForm, ashaId: 'asha01', password: '1234' });
                }}
                style={{ flex:1, padding:'12px 8px', borderRadius:'16px', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', border: selectedRole === 'asha' ? '2px solid #374151' : '2px solid #e5e7eb', color: selectedRole === 'asha' ? 'white' : '#374151', backgroundColor: selectedRole === 'asha' ? '#374151' : 'white' }}
              >
                {selectedRole === 'asha' ? '✓' : <User size={16} />} ASHA Worker
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('anm');
                  setAuthForm({ ...authForm, ashaId: 'anm01', password: '1234' });
                }}
                style={{ flex:1, padding:'12px 8px', borderRadius:'16px', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', border:'2px solid #E05C3A', color: selectedRole === 'anm' ? 'white' : '#E05C3A', backgroundColor: selectedRole === 'anm' ? '#E05C3A' : 'white' }}
              >
                {selectedRole === 'anm' ? '✓' : <ShieldCheck size={16} />} ANM Supervisor
              </button>
            </div>
            {selectedRole === 'asha' && (
              <div style={{ color: '#2D6A4F', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                Logging in as ASHA Worker
              </div>
            )}
            {selectedRole === 'anm' && (
              <div style={{ color: '#E05C3A', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                Logging in as ANM Supervisor
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>
              Don't have an account?{' '}
            </span>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#E05C3A',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2 — Single source of truth for role
  const userRole = localStorage.getItem('userRole') || 'asha';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside
        id="sidebar"
        className="shrink-0 flex flex-col"
        style={{ width: 220, backgroundColor: "#1C1C1E" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5" style={{ padding: "28px 24px 32px" }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #E85D27 0%, #C94D1F 100%)",
              boxShadow: "0 4px 14px rgba(232,93,39,0.35)",
            }}
          >
            <Mic className="text-white" size={18} strokeWidth={2.5} />
          </div>
          <span
            className="text-white"
            style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.04em" }}
          >
            Awaaz
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1" style={{ padding: "0 10px" }}>
          {MENU_ITEMS.map((item) => {
            const active = activeMenu === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveMenu(item.id)}
                className="nav-item w-full flex items-center gap-2.5 text-left cursor-pointer border-none outline-none"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#FFFFFF" : "#8E8E93",
                  backgroundColor: active ? "#3A3A3C" : "transparent",
                  ...(active ? { boxShadow: "inset 3px 0 0 0 #E85D27" } : {}),
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#2C2C2E";
                    (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#8E8E93";
                  }
                }}
              >
                <span style={{ color: active ? "#E85D27" : "inherit" }}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.id === 'alerts' && highCount > 0 && (
                  <span
                    className="flex items-center justify-center bg-[#C0392B] text-white rounded-full font-bold animate-risk-pulse"
                    style={{ width: 20, height: 20, fontSize: 11 }}
                  >
                    {highCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Language Switcher */}
        <div style={{ padding: "0 10px 16px" }}>
          <div style={{ display: 'flex', gap: '4px', padding: '8px 12px' }}>
            {[
              { id: 'en', label: 'EN' },
              { id: 'hi', label: 'हिं' },
              { id: 'mr', label: 'मर' }
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id)}
                style={{
                  flex: 1, padding: '6px', borderRadius: '8px', fontSize: '12px',
                  fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  backgroundColor: language === l.id ? '#2D6A4F' : 'transparent',
                  color: language === l.id ? 'white' : '#9ca3af',
                }}
                onMouseEnter={e => {
                  if (language !== l.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={e => {
                  if (language !== l.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Worker Badge */}
        <div style={{ padding: "16px 14px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5" style={{ padding: "0 6px" }}>
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #E85D27, #F08A5D)",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              SK
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>
                {user?.name || (userRole === 'anm' ? 'Dr. Priya Menon' : 'Savita Kale')}
              </p>
              {/* STEP 3 — Role badge below name */}
              <span style={{
                display: 'inline-block',
                marginTop: 4,
                backgroundColor: userRole === 'anm' ? '#fef0ec' : '#e8f5ee',
                color: userRole === 'anm' ? '#E05C3A' : '#2D6A4F',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
              }}>
                {userRole === 'anm' ? 'ANM Supervisor' : 'ASHA Worker'}
              </span>
            </div>
            <button
              id="logout-btn"
              onClick={() => {
                localStorage.removeItem('awaaz_user');
                localStorage.removeItem('userRole');
                setUser(null);
                setIsAuthenticated(false);
              }}
              className="border-none outline-none bg-transparent cursor-pointer transition-colors hover:bg-white/10"
              style={{ padding: 6, borderRadius: 8 }}
              aria-label="Logout"
            >
              <LogOut size={15} color="#8E8E93" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════ MAIN PANEL ═══════════════ */}
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#F7F5F2" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 36px" }}>

        {activeMenu === 'anm-summary' && (
          /* ═══════════════ ANM SUMMARY VIEW ═══════════════ */
          <section id="anm-summary-view">
            {/* Header */}
            <header className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <div>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "var(--color-text-primary)",
                    lineHeight: 1.2,
                  }}
                >
                  ANM Daily Summary
                </h1>
                <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                  <FileText size={13} color="var(--color-text-tertiary)" />
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                    {dateTime} · {total} patients screened
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  id="regenerate-summary-btn"
                  onClick={() => handleGenerateSummary()}
                  disabled={isGeneratingSummary}
                  className="flex items-center gap-2 cursor-pointer border-none outline-none"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#636366',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--color-card-border)',
                    opacity: isGeneratingSummary ? 0.6 : 1,
                  }}
                >
                  <RefreshCw size={14} className={isGeneratingSummary ? 'animate-spin' : ''} />
                  Regenerate
                </button>

                <button
                  id="share-whatsapp-btn"
                  onClick={handleShareSummary}
                  disabled={!anmReport || isGeneratingSummary}
                  className="flex items-center gap-2 cursor-pointer border-none outline-none"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    background: copied
                      ? 'linear-gradient(135deg, #1B6E3E 0%, #27AE60 100%)'
                      : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    boxShadow: '0 4px 14px rgba(37,211,102,0.3)',
                    opacity: (!anmReport || isGeneratingSummary) ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {copied ? (
                    <><CheckCircle2 size={14} /> Copied!</>
                  ) : (
                    <><Share2 size={14} /> Share via WhatsApp</>
                  )}
                </button>
              </div>
            </header>

            {/* ── Language Toggle ── */}
            <div
              id="language-toggle"
              className="flex items-center gap-1"
              style={{
                marginBottom: 20,
                padding: 4,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-card-border)',
                display: 'inline-flex',
              }}
            >
              {([['en', 'English'], ['hi', 'हिंदी'], ['mr', 'मराठी']] as [SummaryLanguage, string][]).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageSwitch(code)}
                  className="cursor-pointer border-none outline-none"
                  style={{
                    padding: '7px 18px',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: summaryLang === code ? 700 : 500,
                    color: summaryLang === code ? '#FFFFFF' : '#636366',
                    background: summaryLang === code
                      ? 'linear-gradient(135deg, #E85D27 0%, #C94D1F 100%)'
                      : 'transparent',
                    boxShadow: summaryLang === code ? '0 2px 8px rgba(232,93,39,0.3)' : 'none',
                    transition: 'all 0.25s ease',
                    fontFamily: code !== 'en' ? '"Noto Sans Devanagari", var(--font-sans)' : 'var(--font-sans)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Summary Card ── */}
            <div
              id="anm-summary-card"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid var(--color-card-border)',
                padding: '32px 36px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.03)',
                minHeight: 200,
                fontFamily: summaryLang !== 'en' ? '"Noto Sans Devanagari", var(--font-sans)' : 'var(--font-sans)',
              }}
            >
              {isGeneratingSummary ? (
                <div className="flex flex-col items-center justify-center gap-4" style={{ padding: '48px 0' }}>
                  <Loader2 size={32} color="#E85D27" className="animate-spin" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {summaryLang === 'hi' ? 'रिपोर्ट बनाई जा रही है...' : summaryLang === 'mr' ? 'अहवाल तयार होत आहे...' : 'Generating ANM report...'}
                  </span>
                </div>
              ) : summaryError ? (
                <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '48px 0' }}>
                  <AlertTriangle size={28} color="#C0392B" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#C0392B' }}>
                    {summaryError}
                  </span>
                  <button
                    onClick={() => handleGenerateSummary()}
                    className="cursor-pointer border-none outline-none"
                    style={{
                      marginTop: 8,
                      padding: '8px 20px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      background: 'linear-gradient(145deg, #E85D27 0%, #C94D1F 100%)',
                    }}
                  >
                    Try Again
                  </button>
                </div>
              ) : anmReport ? (
                <div>
                  {/* Report header badge */}
                  <div
                    className="flex items-center gap-2"
                    style={{
                      marginBottom: 20,
                      paddingBottom: 16,
                      borderBottom: '1px solid var(--color-card-border)',
                    }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #E85D27 0%, #C94D1F 100%)',
                      }}
                    >
                      <ClipboardList size={16} color="#FFFFFF" />
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {anmReport.title}
                      </span>
                      <span
                        className="block"
                        style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
                      >
                        Generated by Awaaz AI · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>

                  {/* Overview */}
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: 'var(--color-text-primary)',
                      fontWeight: 500,
                      marginBottom: 20,
                    }}
                  >
                    {anmReport.overview}
                  </p>

                  {/* High-Risk Cases — structured bullets */}
                  {anmReport.highRiskCases.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div
                        className="flex items-center gap-2"
                        style={{
                          marginBottom: 12,
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#C0392B',
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.06em',
                        }}
                      >
                        <AlertTriangle size={14} />
                        {summaryLang === 'hi' ? 'उच्च-जोखिम मामले' : summaryLang === 'mr' ? 'उच्च-धोका रुग्ण' : 'High-Risk Cases'}
                      </div>
                      <div className="flex flex-col gap-3">
                        {anmReport.highRiskCases.map((c, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '14px 18px',
                              borderRadius: 12,
                              backgroundColor: '#FDF8F7',
                              borderLeft: '3px solid #C0392B',
                            }}
                          >
                            {/* Patient name — bold */}
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', display: 'block', marginBottom: 4 }}>
                              {c.name}
                            </span>
                            {/* Critical metric — red */}
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#C0392B', display: 'block', marginBottom: 6, lineHeight: 1.6 }}>
                              {c.detail}
                            </span>
                            {/* Recommended action — italic */}
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#636366', fontStyle: 'italic', display: 'block', lineHeight: 1.5 }}>
                              → {c.action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Closing recommendation */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 10,
                      backgroundColor: '#F7F5F2',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.6,
                      borderLeft: '3px solid #E85D27',
                    }}
                  >
                    {anmReport.closingNote}
                  </div>

                  {/* Quick stats row */}
                  <div
                    className="grid grid-cols-3 gap-3"
                    style={{
                      marginTop: 24,
                      paddingTop: 20,
                      borderTop: '1px solid var(--color-card-border)',
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: '14px 0', borderRadius: 10, backgroundColor: 'rgba(192,57,43,0.06)' }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#C0392B', fontFamily: 'var(--font-mono)' }}>{highCount}</span>
                      <span className="block" style={{ fontSize: 11, fontWeight: 600, color: '#C0392B', marginTop: 2 }}>High Risk</span>
                    </div>
                    <div style={{ textAlign: 'center', padding: '14px 0', borderRadius: 10, backgroundColor: 'rgba(212,134,10,0.06)' }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#D4860A', fontFamily: 'var(--font-mono)' }}>{medCount}</span>
                      <span className="block" style={{ fontSize: 11, fontWeight: 600, color: '#D4860A', marginTop: 2 }}>Medium Risk</span>
                    </div>
                    <div style={{ textAlign: 'center', padding: '14px 0', borderRadius: 10, backgroundColor: 'rgba(27,110,62,0.06)' }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#1B6E3E', fontFamily: 'var(--font-mono)' }}>{stableCount}</span>
                      <span className="block" style={{ fontSize: 11, fontWeight: 600, color: '#1B6E3E', marginTop: 2 }}>Stable</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}
        
        {activeMenu === 'new-survey' && (
          /* ═══════════════ NEW SURVEY VIEW ═══════════════ */
          <div className="flex flex-col items-center justify-center min-h-[80vh] relative">
            {isAnalyzing && (
              <div
                className="absolute inset-0 z-50 flex flex-col items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 14,
                }}
              >
                <div className="relative">
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: 'rgba(232,93,39,0.2)' }} />
                  <Loader2 size={48} color="#E85D27" className="animate-spin relative z-10" />
                </div>
                <h2 style={{ marginTop: 24, fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  AI is analyzing patient data...
                </h2>
                <p style={{ marginTop: 8, fontSize: 15, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                  एआई मरीज के डेटा का विश्लेषण कर रहा है...
                </p>
              </div>
            )}
            
            <button
              onClick={() => {
                if (isRecording) stopListening();
                setActiveMenu('dashboard');
              }}
              className="absolute top-0 left-0 flex items-center gap-2 cursor-pointer border-none outline-none bg-transparent hover:opacity-75 transition-opacity"
              style={{ fontSize: 15, fontWeight: 600, color: '#636366' }}
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>

            {/* Massive Mic Button */}
            <div className="flex flex-col items-center gap-8 mt-12 mb-12">
              <div className="relative flex items-center justify-center">
                {isRecording ? (
                  <>
                    <span
                      className="absolute rounded-full animate-ping"
                      style={{ width: 140, height: 140, backgroundColor: "rgba(192,57,43,0.2)", animationDuration: '1.5s' }}
                    />
                    <span
                      className="absolute rounded-full animate-pulse-saffron"
                      style={{ width: 180, height: 180, backgroundColor: "rgba(192,57,43,0.08)", animationDelay: "0.5s" }}
                    />
                  </>
                ) : null}
                <button
                  id="massive-mic-button"
                  onClick={() => (isRecording ? handleStopRecording() : startListening())}
                  disabled={isAnalyzing}
                  className={`relative z-10 flex items-center justify-center cursor-pointer border-none outline-none ${!isRecording ? 'animate-float' : ''}`}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: isRecording
                      ? "linear-gradient(145deg, #E74C3C 0%, #C0392B 50%, #A93226 100%)"
                      : "linear-gradient(145deg, #F08A5D 0%, #E85D27 50%, #C94D1F 100%)",
                    boxShadow: isRecording
                      ? "0 12px 36px -4px rgba(192,57,43,0.5), inset 0 2px 4px rgba(255,255,255,0.2)"
                      : "0 12px 36px -4px rgba(232,93,39,0.45), inset 0 2px 4px rgba(255,255,255,0.2)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {isRecording ? (
                    <Square className="text-white drop-shadow-md" size={48} strokeWidth={2.5} />
                  ) : (
                    <Mic className="text-white drop-shadow-md" size={56} strokeWidth={2.5} />
                  )}
                </button>
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isAnalyzing ? "#D4860A" : isRecording ? "#C0392B" : "#E85D27",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                }}
              >
                {isAnalyzing ? "ANALYZING... (विश्लेषण कर रहा है...)" : isRecording ? "Recording in progress..." : t("tapToSpeak")}
              </span>
            </div>

            {/* Transcript Paper Box */}
            <div
              className="w-full max-w-3xl flex flex-col shadow-sm"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                border: '1px solid var(--color-card-border)',
                minHeight: 200,
                padding: '32px 40px',
              }}
            >
              {liveTranscript ? (
                <p style={{ fontSize: 24, lineHeight: 1.6, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {liveTranscript}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50 text-center">
                  <MessageSquareText size={32} />
                  <p style={{ fontSize: 24, fontWeight: 500 }}>
                    मरीज की जानकारी बोलना शुरू करें...<br />
                    <span style={{ fontSize: 16, fontWeight: 400 }}>(Start speaking patient info...)</span>
                  </p>
                </div>
              )}
            </div>
            
            {/* Cancel Button */}
            <button
              onClick={() => {
                if (isRecording) stopListening();
                setActiveMenu('dashboard');
              }}
              className="mt-8 cursor-pointer border-none outline-none"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#8E8E93',
                backgroundColor: 'transparent',
                textDecoration: 'underline',
              }}
            >
              {t("cancelReturn")}
            </button>

            {/* Add Patient Manually Link */}
            <button
              onClick={() => {
                if (isRecording) stopListening();
                setActiveMenu('manual-entry');
              }}
              className="mt-6 cursor-pointer border-none outline-none group flex items-center justify-center bg-transparent"
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#2D6A4F',
              }}
            >
              <span className="group-hover:underline">+ {t("addPatient")}</span>
            </button>
          </div>
        )}

        {activeMenu === 'manual-entry' && (
          <ManualEntryPage
            onBack={() => setActiveMenu('new-survey')}
            onSave={(newPatient) => {
              setPatients((prev) => [newPatient, ...prev]);
              setActiveMenu('dashboard');
              // Automatically open patient details using standard single page logic
              setSelectedPatient(newPatient);
            }}
          />
        )}

        {activeMenu === 'patients' && (
          <PatientListPage
            patients={patients}
            onSelectPatient={(p) => setSelectedPatient(p)}
            onDownloadCSV={downloadRegisterCSV}
          />
        )}

        {activeMenu === 'alerts' && (
          /* ═══════════════ ALERTS PAGE VIEW ═══════════════ */
          <div className="flex flex-col p-6 sm:p-8 -mx-9 -my-7 items-center" style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
            <div className="w-full flex flex-col gap-6" style={{ maxWidth: 800 }}>
              <header className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h1 className="flex items-center gap-3" style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Urgent Alerts
                </h1>
                {highCount + medCount > 0 ? (
                  <span className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 700, color: '#C0392B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C0392B] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C0392B]"></span>
                    </span>
                    {highCount + medCount} ACTIVE CASES
                  </span>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    0 ACTIVE CASES
                  </span>
                )}
              </header>

              <div className="flex flex-col gap-5">
                {(() => {
                  // Filter High/Med, Sort High first
                  const alerts = patients
                    .filter(p => p.riskLevel === 'high' || p.riskLevel === 'medium')
                    .sort((a, b) => {
                      if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1;
                      if (a.riskLevel !== 'high' && b.riskLevel === 'high') return 1;
                      return 0;
                    });

                  if (alerts.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center p-16 mt-4 rounded-2xl bg-white shadow-sm border border-slate-200 text-center">
                        <div className="flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6">
                          <CheckCircle2 size={40} color="#16A34A" />
                        </div>
                        <h2 className="text-[24px] font-bold text-slate-800">Status: All Clear</h2>
                        <p className="mt-2 text-[16px] font-medium text-slate-500 max-w-md">
                          All patients are currently within safe parameters. No urgent actions required at this time.
                        </p>
                      </div>
                    );
                  }

                  return alerts.map((p, i) => {
                    const isHigh = p.riskLevel === 'high';
                    const dotBg = isHigh ? '#EF4444' : '#F59E0B'; // red-500 / amber-500
                    const tagBg = isHigh ? '#FEF2F2' : '#FFFBEB'; // red-50 / amber-50
                    const tagText = isHigh ? '#991B1B' : '#B45309';
                    
                    // Construct a reason for alert dynamically
                    let reason = '';
                    if (p.systolic > 140 || p.diastolic > 90) {
                      reason = `High ${p.systolic > 140 ? 'Systolic' : 'Diastolic'} BP detected (${p.systolic}/${p.diastolic} mmHg)`;
                    } else if (p.pregnancyMonth > 7 && p.symptoms.length > 0) {
                      reason = `Late Term Pregnancy (${p.pregnancyMonth}mo). Patient reported: ${p.symptoms.join(', ')}`;
                    } else if (p.symptoms.length > 0) {
                      reason = `Reported symptoms: ${p.symptoms.join(', ')}`;
                    } else {
                      reason = `Elevated general risk factors present`;
                    }

                    return (
                      <div
                        key={p.id}
                        className="flex flex-col bg-white rounded-[16px] shadow-sm animate-fade-in-up border border-[#E2E8F0] relative overflow-hidden"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Status Tag Top Right */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-[6px]" style={{ backgroundColor: tagBg }}>
                          <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: dotBg }}></span>
                          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: tagText }}>
                            {isHigh ? "High Risk" : "Review"}
                          </span>
                        </div>

                        {/* TOP SECTION / Header */}
                        <div className="px-6 pt-6 pb-2 flex items-center gap-3">
                          <div
                            className="flex items-center justify-center rounded-full shrink-0 bg-slate-100 text-slate-500"
                            style={{ width: 34, height: 34, fontSize: 13, fontWeight: 700 }}
                          >
                            {getInitials(p.name)}
                          </div>
                          <div>
                            <h3 className="text-[18px] font-bold text-slate-900">{p.name}</h3>
                          </div>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="px-6 pb-6 pt-3 flex flex-col gap-5">
                          {/* Trigger Box */}
                          <div className="flex flex-col gap-1.5 border-l-[3px]" style={{ borderColor: dotBg, paddingLeft: 12 }}>
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                              Primary Alert Reason
                            </span>
                            <p className="text-[16px] font-normal text-slate-700 leading-snug">
                              {reason}
                            </p>
                          </div>

                          {/* Metric Highlight */}
                          <div className="flex items-center gap-2 mt-2">
                            <Activity size={18} color="#94A3B8" />
                            <span className="text-[20px] font-bold text-slate-900 tracking-tight font-mono">
                              {p.systolic}/{p.diastolic}
                            </span>
                          </div>
                        </div>

                        {/* THE PROFESSIONAL FOOTER */}
                        <div className="flex items-center h-[60px] bg-[#F8FAFC] border-t border-[#E2E8F0]">
                          <a
                            href="tel:+919999999999"
                            className="flex-1 h-full flex items-center justify-center gap-2 cursor-pointer font-bold text-[13px] border-none outline-none transition-colors no-underline hover:bg-slate-100 text-slate-500"
                          >
                            <Phone size={16} />
                            CALL PATIENT
                          </a>
                          
                          <div className="w-[1px] h-[36px] bg-[#E2E8F0]" />

                          <button
                            onClick={() => {
                              const msg = generateWhatsAppMessage(p);
                              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="flex-1 h-full flex items-center justify-center gap-2 cursor-pointer font-bold text-[13px] border-none outline-none transition-colors hover:bg-slate-100"
                            style={{ color: '#059669' }} /* Medical Green */
                          >
                            <svg className="w-[16px] h-[16px] fill-current -mt-0.5" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            NOTIFY DOCTOR
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div style={{ height: 32 }} />
            </div>
          </div>
        )}
        
        {activeMenu === 'dashboard' && (
          /* ═══════════════ DASHBOARD VIEW ═══════════════ */
          <>

          {/* ──── Topbar ──── */}
          <header
            id="topbar"
            className="flex items-center justify-between"
            style={{ marginBottom: 28 }}
          >
            <div>
              {/* STEP 7 — Page title by role */}
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--color-text-primary)",
                  lineHeight: 1.2,
                }}
              >
                {userRole === 'anm' ? 'High Risk Overview' : t("todaysSurveys")}
              </h1>
              <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                <Clock size={13} color="var(--color-text-tertiary)" />
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>
                  {dateTime}
                </span>
              </div>
            </div>

            {/* High Risk Pill */}
            <div
              id="high-risk-pill"
              className="flex items-center gap-2 animate-risk-pulse"
              style={{
                padding: "8px 16px",
                borderRadius: 24,
                backgroundColor: "#FDECEC",
                border: "1px solid #F5D0CE",
              }}
            >
              <AlertTriangle size={15} color="#C0392B" className="animate-blink" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#C0392B" }}>
                {highCount} {t("highRiskAlert")}
              </span>
            </div>
          </header>

          {/* STEP 6 — Stats cards by role */}
          {userRole === 'anm' ? (
            /* ANM: only High Risk + Medium Risk, wider 2-col grid */
            <div
              id="stats-row"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}
            >
              <StatCard id="stat-high"   label={t("highRisk")}   value={highCount} color="#C0392B" active={activeFilter === 'high'}   onClick={() => setActiveFilter('high')} />
              <StatCard id="stat-medium" label={t("mediumRisk")} value={medCount}  color="#D4860A" active={activeFilter === 'medium'} onClick={() => setActiveFilter('medium')} />
            </div>
          ) : (
            /* ASHA: all 4 cards */
            <div
              id="stats-row"
              className="grid grid-cols-4 gap-4"
              style={{ marginBottom: 28 }}
            >
              <StatCard id="stat-total"  label={t("totalSurveys")}  value={total}       color="#1C1C1E" active={activeFilter === 'all'}    onClick={() => setActiveFilter('all')} />
              <StatCard id="stat-high"   label={t("highRisk")}      value={highCount}   color="#C0392B" active={activeFilter === 'high'}   onClick={() => setActiveFilter('high')} />
              <StatCard id="stat-medium" label={t("mediumRisk")}    value={medCount}    color="#D4860A" active={activeFilter === 'medium'} onClick={() => setActiveFilter('medium')} />
              <StatCard id="stat-stable" label={t("stable")}         value={stableCount} color="#1B6E3E" active={activeFilter === 'stable'} onClick={() => setActiveFilter('stable')} />
            </div>
          )}

          {/* ──── Patient List (filtered by stat card filter + role) ──── */}
          {(() => {
            // STEP 4 — ANM only sees High Risk & Medium; ASHA sees all
            const roleFiltered = userRole === 'anm'
              ? patients.filter((p) => p.riskLevel === 'high' || p.riskLevel === 'medium')
              : patients;

            const filteredPatients = activeFilter === 'all'
              ? roleFiltered
              : roleFiltered.filter((p) => p.riskLevel === activeFilter);

            const filterLabels: Record<RiskFilter, string> = {
              all: `${filteredPatients.length} records`,
              high: `${filteredPatients.length} high risk records`,
              medium: `${filteredPatients.length} medium risk records`,
              stable: `${filteredPatients.length} stable records`,
            };

            return (
              <section id="patient-list">
                {/* ANM filter notice banner */}
                {userRole === 'anm' && (
                  <div style={{
                    backgroundColor: '#fef0ec',
                    color: '#E05C3A',
                    borderRadius: 12,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <Filter size={13} />
                    Showing High Risk &amp; Medium Risk cases only
                  </div>
                )}
                <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {t("patientRecords")}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center gap-1.5"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#1B6E3E',
                        backgroundColor: 'rgba(27,110,62,0.08)',
                        padding: '4px 10px',
                        borderRadius: 20,
                      }}
                    >
                      <HardDriveDownload size={11} />
                      {t("savedLocally")}
                    </span>
                    {activeFilter !== 'all' && (
                      <button
                        onClick={() => setActiveFilter('all')}
                        className="cursor-pointer border-none outline-none"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#E85D27',
                          backgroundColor: 'rgba(232,93,39,0.08)',
                          padding: '4px 10px',
                          borderRadius: 20,
                        }}
                      >
                        ✕ Clear Filter
                      </button>
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--color-text-tertiary)",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {filterLabels[activeFilter]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((p, i) => (
                      <div
                        key={p.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${i * 0.035}s` }}
                      >
                        <PatientCard patient={p} onClick={() => setSelectedPatient(p)} />
                      </div>
                    ))
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center gap-2"
                      style={{
                        padding: '48px 0',
                        borderRadius: 14,
                        border: '1px dashed var(--color-card-border)',
                        backgroundColor: '#FAFAF8',
                      }}
                    >
                      <Users size={28} color="var(--color-text-tertiary)" style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                        No {activeFilter} risk patients found today.
                      </span>
                      <button
                        onClick={() => setActiveFilter('all')}
                        className="cursor-pointer border-none outline-none"
                        style={{
                          marginTop: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#E85D27',
                          background: 'none',
                          textDecoration: 'underline',
                        }}
                      >
                        Show all patients
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );
          })()}

          {/* Bottom spacer */}
          <div style={{ height: 32 }} />
          </>
        )}
        </div>
      </main>

      {/* ═══════════════ Patient Detail Modal ═══════════════ */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onSave={(updated) => {
            setPatients((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p)),
            );
            setSelectedPatient(updated);
            console.log('[App] ✅ Patient updated:', updated);
          }}
        />
      )}
    </div>
  );
}
