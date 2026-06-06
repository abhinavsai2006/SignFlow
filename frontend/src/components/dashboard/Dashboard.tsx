import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Upload, TrendingUp, Zap, ArrowUpRight
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  // Ref for scrolling to upload section
  const uploadSectionRef = useRef<HTMLDivElement | null>(null);

  // Documents and layout states
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search, Sort, Filter, Pagination state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  // Extended metrics state
  const [pendingDocs, setPendingDocs] = useState(0);
  const [viewedDocs, setViewedDocs] = useState(0);
  const [signedDocs, setSignedDocs] = useState(0);
  const [rejectedDocs, setRejectedDocs] = useState(0);
  const [expiringSoonDocs, setExpiringSoonDocs] = useState(0);

  // Recent activity logs
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const limit = 5;

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/docs', {
        params: {
          search,
          status: statusFilter,
          archived: showArchived,
          sortBy,
          page,
          limit,
          workspaceId: activeWorkspace?._id || 'personal'
        }
      });
      setDocuments(response.data.documents || response.data);
      setTotalPages(response.data.totalPages || 1);
      setTotalDocs(response.data.total || 0);

      // Fetch overall counts without filters for metrics
      const countRes = await api.get('/docs', { params: { limit: 1000 } });
      const allDocs: Document[] = countRes.data.documents || countRes.data;

      setPendingDocs(allDocs.filter(d => d.status === 'Pending' || d.status === 'PartiallySigned').length);
      setSignedDocs(allDocs.filter(d => d.status === 'Signed').length);
      setViewedDocs(allDocs.filter(d => d.status === 'Viewed').length);
      setRejectedDocs(allDocs.filter(d => d.status === 'Rejected').length);

      // Expiring soon: status is not Signed, and expiresAt is within 3 days
      const soon = allDocs.filter(d => {
        if (d.status === 'Signed') return false;
        if (!d.expiresAt) return false;
        const diff = new Date(d.expiresAt).getTime() - Date.now();
        return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
      }).length;
      setExpiringSoonDocs(soon);

      // Generate mock activities based on real documents for the audit timeline
      const activities = allDocs.slice(0, 5).map((d, i) => {
        const action = d.status === 'Signed' ? 'Sign' : d.status === 'Rejected' ? 'Reject' : d.status === 'Viewed' ? 'View' : 'Upload';
        return {
          _id: `act-${i}`,
          action,
          documentName: d.filename,
          createdAt: d.createdAt,
          ipAddress: '192.168.1.45',
          userAgent: 'Chrome - Windows'
        };
      });
      setRecentActivities(activities);

    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, showArchived, sortBy, page, limit, activeWorkspace]);

  useEffect(() => {
    Promise.resolve().then(() => fetchDocuments());
  }, [fetchDocuments]);

  // 20-second background sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDocuments();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const handleUploadSuccess = (document: any) => {
    setDocuments(prev => [document, ...prev].slice(0, limit));
    fetchDocuments();
  };

  const handleToggleArchive = async (id: string) => {
    try {
      await api.put(`/docs/${id}/archive`);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      await api.delete(`/docs/${id}`);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to soft delete document:', error);
    }
  };

  const getStatusBadgeVariant = (status: string): MetaBadgeVariant => {
    switch (status) {
      case 'Signed':
        return 'success';
      case 'Rejected':
        return 'critical';
      case 'Draft':
        return 'warning';
      case 'Expired':
        return 'attention';
      case 'Viewed':
        return 'attention';
      default:
        return 'attention';
    }
  };

  // Completion Rate math
  const completionRate = totalDocs > 0 ? Math.round((signedDocs / totalDocs) * 100) : 0;

  // Greeting helper based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!isLoading && totalDocs === 0) {
    return (
      <motion.div 
        className="space-y-xxl"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Hero Section */}
        <div
          className="relative overflow-hidden rounded-xxxl border border-hairline-soft"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(235,240,255,0.5) 100%)',
          }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-lg p-xxl">
            <div>
              <h1 className="text-heading-lg font-bold tracking-tight text-ink-deep mb-xxs" style={{ fontSize: '2rem' }}>
                {getGreeting()}, {user?.name || 'User'} 👋
              </h1>
              <p className="text-body-md text-slate" style={{ maxWidth: 480 }}>
                Get started with secure digital signatures in your{' '}
                <span className="font-bold text-ink-deep">{activeWorkspace ? activeWorkspace.name : 'Personal'}</span> workspace.
              </p>
            </div>
            <div className="flex items-center gap-sm self-start sm:self-center">
              <MetaButton
                variant="buy-cta"
                onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> New Document
              </MetaButton>
            </div>
          </div>
          <div
            className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
              transform: 'translate(30%, -30%)',
            }}
          />
        </div>

        {/* Empty KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
          {[
            { label: 'Total Documents', icon: FileText, color: 'var(--color-primary)' },
            { label: 'Pending', icon: Clock, color: '#f59e0b' },
            { label: 'Viewed', icon: Eye, color: '#8b5cf6' },
            { label: 'Signed', icon: CheckCircle, color: 'var(--color-success)' }
          ].map((kpi, idx) => (
            <MetaCard key={idx} variant="product-feature" className="!p-md flex flex-col justify-between h-[110px] cursor-default">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-slate uppercase tracking-wider">{kpi.label}</span>
                <div className="p-1.5 rounded-lg" style={{ background: kpi.color, opacity: 0.12 }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
              <div>
                <p className="text-heading-lg font-bold leading-none text-ink-deep">0</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-slate">No data yet</span>
                </div>
              </div>
            </MetaCard>
          ))}
        </div>

        {/* Layout for Empty Upload & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          <div className="lg:col-span-2 space-y-md">
            <h2 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Upload Document</h2>
            <div className="flex flex-col items-center justify-center p-xxl border border-dashed border-hairline-soft rounded-xxxl bg-canvas py-[80px] space-y-lg text-center transition-all hover:bg-surface-soft/50">
              <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                <div className="absolute inset-4 bg-primary/20 rounded-full" />
                <Upload className="w-10 h-10 text-primary relative z-10" />
              </div>
              <div className="space-y-xs max-w-md">
                <h2 className="text-heading-md font-bold text-ink-deep">Your vault is empty</h2>
                <p className="text-body-sm text-slate">
                  Drag and drop your first PDF document to set up signature fields and invite recipients.
                </p>
              </div>
              <div ref={uploadSectionRef} className="w-full max-w-xl text-left mt-8">
                <UploadDropzone onUploadSuccess={handleUploadSuccess} workspaceId={activeWorkspace?._id} />
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-md">
            <h2 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Recent Activity</h2>
            <MetaCard variant="product-feature" className="p-lg flex flex-col items-center justify-center h-[300px] text-center border-dashed">
              <Activity className="w-12 h-12 text-hairline mb-4" />
              <p className="text-body-sm-bold text-slate">No recent activity</p>
              <p className="text-caption text-stone mt-2">Activities will appear here once you send documents.</p>
            </MetaCard>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-xxl"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >

      {/* ─── Section 1: Hero Welcome ─── */}
      <div
        className="relative overflow-hidden rounded-xxxl border border-hairline-soft"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(235,240,255,0.5) 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-lg p-xxl">
          <div>
            <h1 className="text-heading-lg font-bold tracking-tight text-ink-deep mb-xxs" style={{ fontSize: '2rem' }}>
              {getGreeting()}, {user?.name || 'Abhinav Sai'} 👋
            </h1>
            <p className="text-body-md text-slate" style={{ maxWidth: 480 }}>
              Manage, track and trace your secure digital signatures across the{' '}
              <span className="font-bold text-ink-deep">{activeWorkspace ? activeWorkspace.name : 'Personal'}</span> workspace.
            </p>
          </div>
          <div className="flex items-center gap-sm self-start sm:self-center">
            <MetaButton
              variant="buy-cta"
              onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> New Document
            </MetaButton>
            <MetaButton
              variant="ghost"
              onClick={() => navigate('/dashboard/documents')}
              className="flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" /> View All Documents
            </MetaButton>
          </div>
        </div>
        {/* Decorative gradient accent */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
      </div>

      {/* ─── Section 2: Metrics Grid ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-sm">
        {/* Total Documents */}
        <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow cursor-default">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Total Documents</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--color-primary)', opacity: 0.12 }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
          <div>
            <p className="text-heading-lg font-bold leading-none text-ink-deep">{totalDocs}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-[10px] text-slate">Files uploaded</span>
            </div>
          </div>
        </MetaCard>

        {/* Pending */}
        {pendingDocs > 0 && (
          <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow cursor-default">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Pending</span>
              <div className="p-1.5 rounded-lg" style={{ background: '#f59e0b', opacity: 0.12 }}>
                <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
              </div>
            </div>
            <div>
              <p className="text-heading-lg font-bold leading-none text-ink-deep">{pendingDocs}</p>
              <div className="flex items-center gap-1 mt-1">
                <Zap className="w-3 h-3" style={{ color: '#f59e0b' }} />
                <span className="text-[10px] text-slate">Needs action</span>
              </div>
            </div>
          </MetaCard>
        )}

        {/* Viewed */}
        {viewedDocs > 0 && (
          <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow cursor-default">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Viewed</span>
              <div className="p-1.5 rounded-lg" style={{ background: '#8b5cf6', opacity: 0.12 }}>
                <Eye className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              </div>
            </div>
            <div>
              <p className="text-heading-lg font-bold leading-none text-ink-deep">{viewedDocs}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" style={{ color: '#8b5cf6' }} />
                <span className="text-[10px] text-slate">Opened by signers</span>
              </div>
            </div>
          </MetaCard>
        )}

        {/* Signed */}
        {signedDocs > 0 && (
          <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow cursor-default">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Signed</span>
              <div className="p-1.5 rounded-lg" style={{ background: 'var(--color-success)', opacity: 0.12 }}>
                <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              </div>
            </div>
            <div>
              <p className="text-heading-lg font-bold leading-none text-ink-deep">{signedDocs}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-[10px] text-slate">Completed docs</span>
              </div>
            </div>
          </MetaCard>
        )}

        {/* Rejected */}
        {rejectedDocs > 0 && (
          <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow cursor-default">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Rejected</span>
              <div className="p-1.5 rounded-lg" style={{ background: 'var(--color-critical)', opacity: 0.12 }}>
                <XCircle className="w-4 h-4" style={{ color: 'var(--color-critical)' }} />
              </div>
            </div>
            <div>
              <p className="text-heading-lg font-bold leading-none text-ink-deep">{rejectedDocs}</p>
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" style={{ color: 'var(--color-critical)' }} />
                <span className="text-[10px] text-slate">Declined docs</span>
              </div>
            </div>
          </MetaCard>
        )}

        {/* Expiring Soon */}
        {expiringSoonDocs > 0 && (
          <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow cursor-default">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Expiring Soon</span>
              <div className="p-1.5 rounded-lg" style={{ background: '#ea580c', opacity: 0.12 }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#ea580c' }} />
              </div>
            </div>
            <div>
              <p className="text-heading-lg font-bold leading-none text-ink-deep">{expiringSoonDocs}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" style={{ color: '#ea580c' }} />
                <span className="text-[10px] text-slate">Expires within 3d</span>
              </div>
            </div>
          </MetaCard>
        )}
      </div>

      {/* ─── Section 3: Two-column layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">

        {/* ── Left Column (1/3 width) ── */}
        <div className="space-y-xl lg:col-span-1">
          {/* Completion Rate Gauge */}
          <MetaCard variant="product-feature" className="flex flex-col items-center justify-between p-lg text-center h-[220px]">
            <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider self-start">Completion Rate</h3>
            <div className="relative flex items-center justify-center my-2 select-none">
              {/* Circular progress bar SVG */}
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="var(--color-hairline-soft)" strokeWidth="7" fill="transparent" />
                <circle cx="56" cy="56" r="46" stroke="var(--color-primary)" strokeWidth="7" fill="transparent"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - completionRate / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-heading-lg font-bold text-ink-deep">{completionRate}%</span>
                <span className="text-[9px] text-slate font-bold uppercase">Signed</span>
              </div>
            </div>
            <p className="text-body-xs text-slate">
              {signedDocs} of {totalDocs} documents signed.
            </p>
          </MetaCard>
        </div>

        {/* ── Right Column (2/3 width) ── */}
        <div className="space-y-xl lg:col-span-2">

          {/* Signing Activity Chart Card */}
          <MetaCard variant="product-feature" className="space-y-md p-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Signing Activity</h3>
                <p className="text-body-xs text-slate">Weekly signing performance analytics</p>
              </div>
              <div className="flex items-center space-x-md text-body-xs font-bold">
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-primary mr-1.5" /> Uploaded</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-success mr-1.5" /> Signed</span>
              </div>
            </div>

            {/* SVG Graph */}
            <div className="h-32 w-full pt-md relative">
              <svg className="w-full h-full" viewBox="0 0 600 100" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="600" y2="20" stroke="rgba(200, 200, 200, 0.1)" strokeDasharray="4 4" />
                <line x1="0" y1="55" x2="600" y2="55" stroke="rgba(200, 200, 200, 0.1)" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(200, 200, 200, 0.1)" strokeDasharray="4 4" />

                <path
                  d="M 10 80 Q 100 20, 200 45 T 400 30 T 590 15"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 95 Q 100 60, 200 80 T 400 40 T 590 20"
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                <path
                  d="M 10 80 Q 100 20, 200 45 T 400 30 T 590 15 L 590 100 L 10 100 Z"
                  fill="url(#uploadGlow)"
                  opacity="0.08"
                />
                <path
                  d="M 10 95 Q 100 60, 200 80 T 400 40 T 590 20 L 590 100 L 10 100 Z"
                  fill="url(#signedGlow)"
                  opacity="0.06"
                />

                <defs>
                  <linearGradient id="uploadGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="signedGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" />
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate uppercase tracking-wider px-xs">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </MetaCard>

          {/* Upload Dropzone */}
          <div ref={uploadSectionRef} className="space-y-sm">
            <h2 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Upload Document</h2>
            <UploadDropzone onUploadSuccess={handleUploadSuccess} workspaceId={activeWorkspace?._id} />
          </div>

          {/* ── Recent Documents List ── */}
          <div className="space-y-md pt-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
              <h2 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Your Documents</h2>
              <div className="flex items-center space-x-sm">
                <button
                  onClick={() => {
                    setShowArchived(!showArchived);
                    setPage(1);
                  }}
                  className={`px-sm py-xxs border rounded-full text-caption-bold font-bold transition-all ${
                    showArchived
                      ? 'bg-primary text-canvas border-primary'
                      : 'bg-canvas text-slate border-hairline hover:border-slate'
                  }`}
                >
                  Show Archived
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md bg-surface-soft p-md rounded-xxxl border border-hairline-soft">
              <div className="relative">
                <MetaInput
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-xl"
                />
                <Search className="w-4 h-4 text-slate absolute left-sm top-[10px]" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Viewed">Viewed</option>
                <option value="Signed">Signed</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>

            {/* Document Cards */}
            {isLoading ? (
              <div className="space-y-md">
                <SkeletonTable rows={4} />
              </div>
            ) : documents.length === 0 ? (
              <MetaCard variant="product-feature" className="text-center py-xl border-dashed">
                <p className="text-subtitle-md text-ink-deep mb-xxs font-bold">No documents found</p>
                <p className="text-body-sm text-slate">Try adjusting your filters or upload a new PDF.</p>
              </MetaCard>
            ) : (
              <div className="space-y-md">
                {documents.map((doc) => (
                  <MetaCard key={doc._id} variant="checkout-summary" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md relative group">
                    <div className="flex items-start space-x-md overflow-hidden">
                      <div className="p-sm bg-surface-soft rounded-lg border border-hairline-soft shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-subtitle-md text-ink-deep truncate font-bold" title={doc.filename}>
                          {doc.filename}
                        </p>
                        <p className="text-body-sm text-slate">
                          Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-md shrink-0 self-end sm:self-center">
                      <MetaBadge variant={getStatusBadgeVariant(doc.status)}>
                        {doc.status}
                      </MetaBadge>

                      <MetaButton
                        variant={doc.status === 'Pending' ? 'primary' : 'secondary'}
                        onClick={() => navigate(`/edit/${doc._id}`)}
                        className="!py-1.5 !px-4"
                      >
                        {doc.status === 'Pending' ? 'Sign' : 'View'}
                      </MetaButton>

                      <div className="flex items-center space-x-xxs border-l border-hairline-soft pl-sm">
                        <button
                          onClick={() => handleToggleArchive(doc._id)}
                          className="p-xs hover:bg-surface-soft rounded-circle text-slate hover:text-ink transition-colors"
                          title={doc.isArchived ? 'Unarchive Document' : 'Archive Document'}
                        >
                          <Archive className={`w-4 h-4 ${doc.isArchived ? 'text-primary fill-primary/10' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleSoftDelete(doc._id)}
                          className="p-xs hover:bg-surface-soft rounded-circle text-slate hover:text-critical transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </MetaCard>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-md select-none">
                    <span className="text-body-xs text-slate">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex space-x-sm">
                      <MetaButton
                        variant="ghost"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </MetaButton>
                      <MetaButton
                        variant="ghost"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </MetaButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Section 4: Activity Timeline ─── */}
      <MetaCard variant="product-feature" className="space-y-md p-lg">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-slate" />
          <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Recent Activity Audit</h3>
        </div>
        {recentActivities.length === 0 ? (
          <p className="text-body-sm text-slate">No recent signature events.</p>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((act, actIdx) => (
                <li key={act._id}>
                  <div className="relative pb-8">
                    {actIdx !== recentActivities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-hairline-soft" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-canvas ${
                          act.action === 'Sign' ? 'bg-success/10 text-success' :
                          act.action === 'Reject' ? 'bg-critical/10 text-critical' :
                          act.action === 'View' ? 'bg-oculus-purple/10 text-oculus-purple' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {act.action === 'Sign' && <CheckCircle2 className="w-4 h-4" />}
                          {act.action === 'Reject' && <XCircle className="w-4 h-4" />}
                          {act.action === 'View' && <Eye className="w-4 h-4" />}
                          {act.action === 'Upload' && <Plus className="w-4 h-4" />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-body-sm text-ink font-bold">
                            {act.action} event on <span className="text-ink-deep underline">{act.documentName}</span>
                          </p>
                          <p className="text-caption text-slate mt-0.5">
                            IP: {act.ipAddress} • {act.userAgent}
                          </p>
                        </div>
                        <div className="text-right text-caption font-bold text-slate whitespace-nowrap">
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </MetaCard>

    </motion.div>
  );
}
