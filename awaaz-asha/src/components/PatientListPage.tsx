import { useState, useMemo, type CSSProperties } from 'react';
import {
  Search,
  Download,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Users,
  Filter,
} from 'lucide-react';
import type { Patient } from '../types/patient';
import { useLanguage } from '../context/LanguageContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type RiskFilter = 'all' | 'high' | 'medium' | 'stable';
type SortKey = 'name' | 'age' | 'bp' | 'timestamp';
type SortDir = 'asc' | 'desc';

interface PatientListPageProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onDownloadCSV: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Inline Style Tokens                                                */
/* ------------------------------------------------------------------ */
const PAGE: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#F8F3E8',
  padding: '32px 32px',
  margin: '-28px -36px',   // bleed out of App.tsx parent padding
};
const INNER: CSSProperties = { maxWidth: 1024, margin: '0 auto' };

const CARD_BASE: CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: '18px 22px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  position: 'relative',
  overflow: 'hidden',
};

const ACCENT_BAR = (color: string): CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 4,
  borderRadius: '16px 0 0 16px',
  backgroundColor: color,
});

const PILL_BASE: CSSProperties = {
  padding: '8px 20px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1.5px solid #E5E7EB',
  backgroundColor: '#FFFFFF',
  color: '#6B7280',
  transition: 'all 0.2s',
};
const PILL_ACTIVE: CSSProperties = {
  ...PILL_BASE,
  backgroundColor: '#2D6A4F',
  color: '#FFFFFF',
  border: '1.5px solid #2D6A4F',
  boxShadow: '0 2px 8px rgba(45,106,79,0.25)',
};

const SEARCH_WRAP: CSSProperties = { position: 'relative', marginBottom: 14 };
const SEARCH_ICON: CSSProperties = {
  position: 'absolute',
  left: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#9CA3AF',
  pointerEvents: 'none',
};
const SEARCH_INPUT: CSSProperties = {
  width: '100%',
  backgroundColor: '#FFFFFF',
  border: '1.5px solid #E5E7EB',
  borderRadius: 16,
  padding: '13px 16px 13px 44px',
  fontSize: 14,
  color: '#374151',
  outline: 'none',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box' as const,
};

const TABLE_CARD: CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  border: '1px solid #F3F4F6',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  overflow: 'hidden',
  marginTop: 8,
};
const TH: CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '14px 24px',
  borderBottom: '1px solid #F3F4F6',
  backgroundColor: '#FAFAFA',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};
const TD: CSSProperties = { padding: '16px 24px', fontSize: 14, color: '#6B7280' };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function PatientListPage({
  patients,
  onSelectPatient,
  onDownloadCSV,
}: PatientListPageProps) {
  const { t } = useLanguage();
  // STEP 5 — Single source of truth for role
  const userRole = localStorage.getItem('userRole') || 'asha';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ANM: pre-filter to High Risk + Medium only; ASHA: show all
  const roleFilteredPatients = userRole === 'anm'
    ? patients.filter((p) => p.riskLevel === 'high' || p.riskLevel === 'medium')
    : patients;

  /* ── derived counts (from full patient list) ── */
  const highCount = patients.filter((p) => p.riskLevel === 'high').length;
  const medCount = patients.filter((p) => p.riskLevel === 'medium').length;
  const stableCount = patients.filter((p) => p.riskLevel === 'stable').length;

  /* ── filter + sort (applied on role-pre-filtered patients) ── */
  const filteredPatients = useMemo(() => {
    let result = roleFilteredPatients.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = activeFilter === 'all' || p.riskLevel === activeFilter;
      return matchesSearch && matchesRisk;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'age':
          cmp = a.age - b.age;
          break;
        case 'bp':
          cmp = a.systolic - b.systolic;
          break;
        case 'timestamp':
          cmp = a.timestamp.localeCompare(b.timestamp);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [roleFilteredPatients, searchTerm, activeFilter, sortKey, sortDir]);

  /* ── sort toggle ── */
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? (
      <ArrowUp size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
    ) : (
      <ArrowDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
    );
  };

  /* ── stat cards config (always show all 4 counts from full list) ── */
  const STATS: { label: string; value: number; numColor: string; accent: string; labelColor: string; borderColor: string }[] = [
    { label: 'Total Patients', value: patients.length, numColor: '#1F2937', accent: '#9CA3AF', labelColor: '#9CA3AF', borderColor: '#F3F4F6' },
    { label: t("highRisk"), value: highCount, numColor: '#EF4444', accent: '#EF4444', labelColor: '#FCA5A5', borderColor: '#FEE2E2' },
    { label: t("mediumRisk"), value: medCount, numColor: '#F59E0B', accent: '#F59E0B', labelColor: '#FCD34D', borderColor: '#FEF3C7' },
    { label: t("stable"), value: stableCount, numColor: '#10B981', accent: '#10B981', labelColor: '#6EE7B7', borderColor: '#D1FAE5' },
  ];

  /* ── filter pills — ANM hides 'stable' option ── */
  const ALL_FILTERS: { key: RiskFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'stable', label: 'Stable' },
  ];
  const FILTERS = userRole === 'anm'
    ? ALL_FILTERS.filter(f => f.key !== 'stable' && f.key !== 'all')
    : ALL_FILTERS;

  /* ── badge helpers ── */
  const badgeBg = (r: string) => r === 'high' ? '#FEF2F2' : r === 'medium' ? '#FFFBEB' : '#ECFDF5';
  const badgeColor = (r: string) => r === 'high' ? '#EF4444' : r === 'medium' ? '#F59E0B' : '#059669';
  const badgeBorder = (r: string) => r === 'high' ? '#FEE2E2' : r === 'medium' ? '#FEF3C7' : '#D1FAE5';
  const badgeLabel = (r: string) => r === 'high' ? t("highRisk") : r === 'medium' ? t("mediumRisk") : t("stable");
  const avatarBg = (r: string) => r === 'high' ? '#FEE2E2' : r === 'medium' ? '#FEF3C7' : '#D1FAE5';
  const avatarColor = (r: string) => r === 'high' ? '#EF4444' : r === 'medium' ? '#D97706' : '#059669';

  /* ── render ── */
  return (
    <div style={PAGE}>
      <div style={INNER}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1F2937', letterSpacing: '-0.03em', margin: 0 }}>
              {t("masterRegister")}
            </h1>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, fontWeight: 500 }}>
              मास्टर स्वास्थ्य रजिस्टर · {roleFilteredPatients.length} Registered Patients
            </p>
          </div>
          <button
            onClick={onDownloadCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12,
              fontSize: 13, fontWeight: 600,
              color: '#2D6A4F', backgroundColor: 'transparent',
              border: '1.5px solid #2D6A4F', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2D6A4F'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#2D6A4F'; }}
          >
            <Download size={15} />
            Download Register
          </button>
        </div>

        {/* ═══ STAT CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ ...CARD_BASE, border: `1.5px solid ${s.borderColor}` }}>
              <div style={ACCENT_BAR(s.accent)} />
              <div style={{ paddingLeft: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: s.labelColor, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 0' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 32, fontWeight: 900, color: s.numColor, margin: 0, lineHeight: 1 }}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ SEARCH ═══ */}
        <div style={SEARCH_WRAP}>
          <div style={SEARCH_ICON}>
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder={t("searchByName")}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={SEARCH_INPUT}
            onFocus={e => { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.12)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
          />
        </div>

        {/* ═══ ANM FILTER NOTICE BANNER (Step 5) ═══ */}
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

        {/* ═══ FILTER PILLS ═══ */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={activeFilter === f.key ? PILL_ACTIVE : PILL_BASE}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ═══ TABLE ═══ */}
        <div style={TABLE_CARD}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={TH} onClick={() => toggleSort('name')}>Patient Name <SortIcon col="name" /></th>
                  <th style={TH} onClick={() => toggleSort('age')}>Age <SortIcon col="age" /></th>
                  <th style={{ ...TH, cursor: 'default' }}>Pregnancy</th>
                  <th style={TH} onClick={() => toggleSort('bp')}>Blood Pressure <SortIcon col="bp" /></th>
                  <th style={{ ...TH, cursor: 'default' }}>Status</th>
                  <th style={TH} onClick={() => toggleSort('timestamp')}>Last Survey <SortIcon col="timestamp" /></th>
                  <th style={{ ...TH, cursor: 'default', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '64px 0', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          <Users size={32} color="#D1D5DB" />
                        </div>
                        <p style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 500 }}>No patients found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p, i) => {
                    const isLast = i === filteredPatients.length - 1;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => onSelectPatient(p)}
                        style={{
                          borderBottom: isLast ? 'none' : '1px solid #F9FAFB',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0FDF8')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Name */}
                        <td style={TD}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              backgroundColor: avatarBg(p.riskLevel), color: avatarColor(p.riskLevel),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: 12, flexShrink: 0,
                            }}>
                              {getInitials(p.name)}
                            </div>
                            <span style={{ fontWeight: 600, color: '#1F2937', fontSize: 14 }}>{p.name}</span>
                          </div>
                        </td>

                        {/* Age */}
                        <td style={TD}>{p.age} yrs</td>

                        {/* Pregnancy */}
                        <td style={TD}>{p.pregnancyMonth > 0 ? `${p.pregnancyMonth} mo` : 'NA'}</td>

                        {/* BP */}
                        <td style={TD}>
                          <span style={{
                            fontFamily: 'ui-monospace, monospace',
                            fontWeight: 600,
                            fontSize: 14,
                            color: p.diastolic === 0 ? '#9CA3AF' :
                              p.systolic > 140 ? '#EF4444' :
                                p.systolic >= 130 ? '#FB923C' : '#374151',
                          }}>
                            {p.diastolic ? `${p.systolic}/${p.diastolic}` : '—'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={TD}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 12px', borderRadius: 999,
                            fontSize: 12, fontWeight: 600,
                            backgroundColor: badgeBg(p.riskLevel),
                            color: badgeColor(p.riskLevel),
                            border: `1px solid ${badgeBorder(p.riskLevel)}`,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badgeColor(p.riskLevel) }} />
                            {badgeLabel(p.riskLevel)}
                          </span>
                        </td>

                        {/* Last Survey */}
                        <td style={{ ...TD, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{p.timestamp}</td>

                        {/* Actions */}
                        <td style={{ ...TD, textAlign: 'center' }}>
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#2D6A4F', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            View <ChevronRight size={14} />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom spacer */}
        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
