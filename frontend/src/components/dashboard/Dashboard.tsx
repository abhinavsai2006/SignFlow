import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import UploadDropzone from '../upload/UploadDropzone';
import MetaCard from '../ui/MetaCard';
import MetaBadge from '../ui/MetaBadge';
import type { MetaBadgeVariant } from '../ui/MetaBadge';
import MetaButton from '../ui/MetaButton';
import MetaInput from '../ui/MetaInput';
import {
  FileText, Clock, CheckCircle, Search, Trash2, Archive,
  Eye, XCircle, AlertTriangle, Plus,
  CheckCircle2, Activity,
  Upload, TrendingUp, Zap, ArrowUpRight, ChevronRight,
  Layers
} from 'lucide-react';
import { SkeletonTable } from '../ui/Skeleton';

interface Document {
  _id: string;
  filename: string;
  originalPath: string;
  status: 'Draft' | 'Pending' | 'Viewed' | 'PartiallySigned' | 'Signed' | 'Rejected' | 'Expired' | 'Archived';
  createdAt: string;
  expiresAt?: string;
  isArchived: boolean;
  isDeleted: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, activeWorkspace } = useOutletContext<{ user: any; activeWorkspace: any }>();

  const uploadSectionRef = useRef<HTMLDivElement | null>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  const [pendingDocs, setPendingDocs] = useState(0);
  const [viewedDocs, setViewedDocs] = useState(0);
  const [signedDocs, setSignedDocs] = useState(0);
  const [rejectedDocs, setRejectedDocs] = useState(0);
  const [expiringSoonDocs, setExpiringSoonDocs] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const limit = 5;

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/docs', {
        params: {
          search, status: statusFilter, archived: showArchived,
          sortBy, page, limit, workspaceId: activeWorkspace?._id || 'personal'
        }
      });
      setDocuments(response.data.documents || response.data);
      setTotalPages(response.data.totalPages || 1);
      setTotalDocs(response.data.total || 0);

      const countRes = await api.get('/docs', { params: { limit: 1000 } });
      const allDocs: Document[] = countRes.data.documents || countRes.data;

      setPendingDocs(allDocs.filter(d => d.status === 'Pending' || d.status === 'PartiallySigned').length);
      setSignedDocs(allDocs.filter(d => d.status === 'Signed').length);
      setViewedDocs(allDocs.filter(d => d.status === 'Viewed').length);
      setRejectedDocs(allDocs.filter(d => d.status === 'Rejected').length);
      setExpiringSoonDocs(allDocs.filter(d => {
        if (d.status === 'Signed') return false;
        if (!d.expiresAt) return false;
        const diff = new Date(d.expiresAt).getTime() - Date.now();
        return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
      }).length);

      setRecentActivities(allDocs.slice(0, 6).map((d, i) => ({
        _id: `act-${i}`,
        action: d.status === 'Signed' ? 'Signed' : d.status === 'Rejected' ? 'Rejected' : d.status === 'Viewed' ? 'Viewed' : 'Uploaded',
        documentName: d.filename,
        createdAt: d.createdAt
      })));
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, showArchived, sortBy, page, limit, activeWorkspace]);

  useEffect(() => { Promise.resolve().then(() => fetchDocuments()); }, [fetchDocuments]);
  useEffect(() => {
    const interval = setInterval(() => fetchDocuments(), 30000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const handleUploadSuccess = (document: any) => {
    setDocuments(prev => [document, ...prev].slice(0, limit));
    fetchDocuments();
  };

  const handleToggleArchive = async (id: string) => {
    try { await api.put(`/docs/${id}/archive`); fetchDocuments(); }
    catch (e) { console.error(e); }
  };

  const handleSoftDelete = async (id: string) => {
    try { await api.delete(`/docs/${id}`); fetchDocuments(); }
    catch (e) { console.error(e); }
  };

  const getStatusBadgeVariant = (status: string): MetaBadgeVariant => {
    switch (status) {
      case 'Signed': return 'success';
      case 'Rejected': return 'critical';
      case 'Draft': return 'warning';
      default: return 'attention';
    }
  };

  const completionRate = totalDocs > 0 ? Math.round((signedDocs / totalDocs) * 100) : 0;

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  const getActivityMeta = (action: string) => {
    switch (action) {
      case 'Signed':   return { Icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
      case 'Rejected': return { Icon: XCircle,     color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
      case 'Viewed':   return { Icon: Eye,          color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
      default:         return { Icon: Upload,       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    }
  };

  const kpiCards = [
    { label: 'Total',    sub: 'All files',       value: totalDocs,        Icon: Layers,        color: '#3b82f6', TrendIcon: TrendingUp  },
    { label: 'Pending',  sub: 'Needs action',    value: pendingDocs,      Icon: Clock,         color: '#f59e0b', TrendIcon: Zap         },
    { label: 'Viewed',   sub: 'Opened',          value: viewedDocs,       Icon: Eye,           color: '#a855f7', TrendIcon: ArrowUpRight },
    { label: 'Signed',   sub: 'Completed',       value: signedDocs,       Icon: CheckCircle,   color: '#22c55e', TrendIcon: TrendingUp  },
    { label: 'Rejected', sub: 'Declined',        value: rejectedDocs,     Icon: XCircle,       color: '#ef4444', TrendIcon: AlertTriangle},
    { label: 'Expiring', sub: 'Within 3 days',   value: expiringSoonDocs, Icon: AlertTriangle, color: '#f97316', TrendIcon: Clock       },
  ];

  // Unified layout logic: Dashboard is never completely blanked. We render the KPI strip, and inside the main body we conditional-render the document list or the upload zone.

  /* ── Main dashboard ── */
  return (
    <motion.div className="space-y-xxl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      {/* Hero */}
      <motion.div
        className="relative overflow-hidden rounded-xxxl border border-hairline-soft"
        style={{ background: 'linear-gradient(135deg, var(--color-canvas) 0%, rgba(59,130,246,0.04) 100%)' }}
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-lg p-xxl">
          <div>
            <h1 className="font-bold tracking-tight text-ink-deep mb-xxs" style={{ fontSize: '1.875rem' }}>
              {getGreeting()}, {user?.name || 'User'} 👋
            </h1>
            <p className="text-body-md text-slate" style={{ maxWidth: 480 }}>
              Manage signing activity in the{' '}
              <span className="font-bold text-ink-deep">{activeWorkspace?.name || 'Personal'}</span> workspace.
            </p>
          </div>
          <div className="flex items-center gap-sm self-start sm:self-center flex-wrap">
            <MetaButton variant="buy-cta" onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" /> New Document
            </MetaButton>
            <MetaButton variant="ghost" onClick={() => navigate('/dashboard/documents')} className="flex items-center">
              <FileText className="w-4 h-4 mr-2" /> All Documents
            </MetaButton>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
      </motion.div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-sm">
        {kpiCards.map((kpi, idx) => (
          <motion.div key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.055, duration: 0.3 }}
            className="group bg-canvas border border-hairline-soft rounded-xxl p-md flex flex-col gap-2 cursor-default hover:border-slate/30 hover:shadow-sm transition-all"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone uppercase tracking-wider leading-tight">{kpi.label}</span>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: kpi.color + '18' }}>
                <kpi.Icon className="w-3 h-3" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-ink-deep leading-none tabular-nums">{kpi.value}</p>
            <div className="flex items-center gap-1">
              <kpi.TrendIcon className="w-2.5 h-2.5 flex-shrink-0" style={{ color: kpi.color }} />
              <span className="text-[10px] text-stone">{kpi.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">

        {/* Left: Gauge + Activity */}
        <div className="space-y-xl lg:col-span-1">

          {/* Completion Gauge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}>
            <MetaCard variant="product-feature" className="flex flex-col items-center p-lg gap-4">
              <div className="flex w-full justify-between items-center">
                <h3 className="text-body-sm-bold font-bold text-stone uppercase tracking-wider">Completion</h3>
                <span className="text-caption font-bold text-ink-deep">{signedDocs}/{totalDocs}</span>
              </div>
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="48" stroke="var(--color-hairline-soft)" strokeWidth="8" fill="transparent" />
                  <circle cx="60" cy="60" r="48" stroke="url(#gaugeGrad)" strokeWidth="8" fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - completionRate / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-ink-deep">{completionRate}%</span>
                  <span className="text-[10px] text-stone font-bold uppercase">Signed</span>
                </div>
              </div>
              <div className="w-full grid grid-cols-2 gap-sm text-xs">
                <div className="bg-surface-soft rounded-xl p-sm text-center border border-hairline-soft">
                  <p className="font-bold text-ink-deep">{signedDocs}</p>
                  <p className="text-stone text-[10px]">Completed</p>
                </div>
                <div className="bg-surface-soft rounded-xl p-sm text-center border border-hairline-soft">
                  <p className="font-bold text-ink-deep">{pendingDocs}</p>
                  <p className="text-stone text-[10px]">Pending</p>
                </div>
              </div>
            </MetaCard>
          </motion.div>

          {/* Activity feed */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.35 }}>
            <MetaCard variant="product-feature" className="p-lg space-y-md">
              <div className="flex items-center justify-between">
                <h3 className="text-body-sm-bold font-bold text-stone uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Activity
                </h3>
                <span className="text-[10px] text-stone">Recent events</span>
              </div>
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Activity className="w-8 h-8 text-hairline mb-2" />
                  <p className="text-caption text-stone">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-sm">
                  {recentActivities.map((act, i) => {
                    const { Icon, color, bg } = getActivityMeta(act.action);
                    return (
                      <motion.div key={act._id} className="flex items-start gap-sm"
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: bg }}>
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-caption font-bold text-ink-deep truncate">{act.documentName}</p>
                          <p className="text-[10px] text-stone">{act.action} · {new Date(act.createdAt).toLocaleDateString()}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </MetaCard>
          </motion.div>
        </div>

        {/* Right: Chart + Upload + Documents */}
        <div className="space-y-xl lg:col-span-2">

          {/* Activity chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.35 }}>
            <MetaCard variant="product-feature" className="p-lg space-y-md">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-body-sm-bold font-bold text-stone uppercase tracking-wider">Signing Activity</h3>
                  <p className="text-caption text-stone">Weekly document overview</p>
                </div>
                <div className="flex items-center gap-md text-caption font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#3b82f6' }} />Uploaded
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#22c55e' }} />Signed
                  </span>
                </div>
              </div>
              <div className="h-28 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 600 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="signedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[20, 50, 80].map(y => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--color-hairline-soft)" strokeDasharray="4 4" />
                  ))}
                  <path d="M 10 78 C 100 22, 180 48, 290 42 S 420 28, 590 14"
                    fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 10 92 C 100 62, 180 80, 290 68 S 420 38, 590 20"
                    fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 10 78 C 100 22, 180 48, 290 42 S 420 28, 590 14 L 590 100 L 10 100 Z"
                    fill="url(#uploadGrad)" />
                  <path d="M 10 92 C 100 62, 180 80, 290 68 S 420 38, 590 20 L 590 100 L 10 100 Z"
                    fill="url(#signedGrad)" />
                </svg>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-stone uppercase tracking-wider px-xs">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
              </div>
            </MetaCard>
          </motion.div>

          {/* Upload dropzone */}
          <motion.div ref={uploadSectionRef}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}
            className="space-y-sm">
            <div className="text-body-sm-bold font-bold text-stone uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Upload Document
            </div>
            <UploadDropzone onUploadSuccess={handleUploadSuccess} workspaceId={activeWorkspace?._id} />
          </motion.div>

          {/* Documents list */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.35 }} className="space-y-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-stone" />
                <h2 className="text-body-sm-bold font-bold text-stone uppercase tracking-wider">Your Documents</h2>
                {totalDocs > 0 && (
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">{totalDocs}</span>
                )}
              </div>
              <div className="flex items-center gap-sm flex-wrap">
                <button
                  onClick={() => { setShowArchived(!showArchived); setPage(1); }}
                  className={`px-sm py-xxs border rounded-full text-caption-bold font-bold transition-all ${showArchived ? 'bg-primary text-canvas border-primary' : 'bg-canvas text-slate border-hairline hover:border-slate'}`}
                >
                  {showArchived ? 'Hide Archived' : 'Show Archived'}
                </button>
                <button onClick={() => navigate('/dashboard/documents')}
                  className="flex items-center gap-1 text-caption font-bold text-blue-400 hover:text-blue-300 transition">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md bg-surface-soft p-md rounded-xxl border border-hairline-soft">
              <div className="relative">
                <MetaInput type="text" placeholder="Search documents..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-xl" />
                <Search className="w-4 h-4 text-stone absolute left-sm top-[10px] pointer-events-none" />
              </div>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none focus:border-blue-400/60 transition">
                <option value="all">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Viewed">Viewed</option>
                <option value="Signed">Signed</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none focus:border-blue-400/60 transition">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>

            {/* Document cards */}
            {isLoading ? (
              <div className="space-y-md"><SkeletonTable rows={4} /></div>
            ) : documents.length === 0 ? (
              <MetaCard variant="product-feature" className="text-center py-xl border-dashed">
                <FileText className="w-10 h-10 text-hairline mx-auto mb-3" />
                <p className="text-subtitle-md font-bold text-ink-deep mb-xxs">No documents found</p>
                <p className="text-body-sm text-slate">Adjust your filters or upload a new PDF.</p>
              </MetaCard>
            ) : (
              <AnimatePresence>
                <div className="space-y-sm">
                  {documents.map((doc, idx) => (
                    <motion.div key={doc._id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: idx * 0.04, duration: 0.25 }}>
                      <MetaCard variant="checkout-summary"
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md group hover:border-slate/30 transition-all">
                        <div className="flex items-start gap-md overflow-hidden flex-1 min-w-0">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-500/8 border border-blue-500/15 rounded-xl flex-shrink-0 group-hover:bg-blue-500/12 transition">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="overflow-hidden min-w-0">
                            <p className="text-body-sm font-bold text-ink-deep truncate" title={doc.filename}>{doc.filename}</p>
                            <p className="text-caption text-stone">
                              {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-sm shrink-0 self-end sm:self-center flex-wrap">
                          <MetaBadge variant={getStatusBadgeVariant(doc.status)}>{doc.status}</MetaBadge>
                          <MetaButton
                            variant={doc.status === 'Pending' || doc.status === 'PartiallySigned' ? 'primary' : 'secondary'}
                            onClick={() => navigate(`/edit/${doc._id}`)}
                            className="!py-1.5 !px-4"
                          >
                            {doc.status === 'Pending' || doc.status === 'PartiallySigned' ? 'Sign' : 'View'}
                          </MetaButton>
                          <div className="flex items-center gap-xs border-l border-hairline-soft pl-sm">
                            <button onClick={() => handleToggleArchive(doc._id)}
                              className="p-xs hover:bg-surface-soft rounded-lg text-stone hover:text-ink transition-colors"
                              title={doc.isArchived ? 'Unarchive' : 'Archive'}>
                              <Archive className={`w-4 h-4 ${doc.isArchived ? 'text-primary' : ''}`} />
                            </button>
                            <button onClick={() => handleSoftDelete(doc._id)}
                              className="p-xs hover:bg-surface-soft rounded-lg text-stone hover:text-critical transition-colors"
                              title="Delete Document">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </MetaCard>
                    </motion.div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-md select-none">
                      <span className="text-caption text-stone">Page {page} of {totalPages}</span>
                      <div className="flex gap-sm">
                        <MetaButton variant="ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                          Previous
                        </MetaButton>
                        <MetaButton variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                          Next
                        </MetaButton>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
