import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import UploadDropzone from '../upload/UploadDropzone';
import MetaCard from '../ui/MetaCard';
import MetaBadge from '../ui/MetaBadge';
import type { MetaBadgeVariant } from '../ui/MetaBadge';
import MetaButton from '../ui/MetaButton';
import MetaInput from '../ui/MetaInput';
import { 
  FileText, Clock, CheckCircle, Search, Trash2, Archive, 
  Eye, XCircle, AlertTriangle, Plus, Send, Link as LinkIcon, 
  CheckCircle2, Activity, Calendar
} from 'lucide-react';

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

  useEffect(() => {
    fetchDocuments();
  }, [search, statusFilter, showArchived, sortBy, page, activeWorkspace]);

  const fetchDocuments = async () => {
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
  };

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

  return (
    <div className="space-y-xxl">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md border-b border-hairline-soft pb-xl">
        <div>
          <h1 className="text-heading-lg font-bold tracking-tight text-ink-deep mb-xxs">
            Hello, {user?.name}
          </h1>
          <p className="text-body-md text-slate">
            Manage and trace your secure digital signatures on the {activeWorkspace ? activeWorkspace.name : 'Personal'} workspace.
          </p>
        </div>
        
        {/* Quick Upload Button */}
        <MetaButton 
          variant="buy-cta" 
          onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center self-start sm:self-center"
        >
          <Plus className="w-4 h-4 mr-2" /> New Document
        </MetaButton>
      </div>

      {/* Six Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-sm">
        {/* Total Documents */}
        <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[100px] hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Total</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-heading-lg font-bold leading-none text-ink-deep">{totalDocs}</p>
            <p className="text-[10px] text-slate mt-1">Files uploaded</p>
          </div>
        </MetaCard>

        {/* Pending */}
        <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[100px] hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div>
            <p className="text-heading-lg font-bold leading-none text-ink-deep">{pendingDocs}</p>
            <p className="text-[10px] text-slate mt-1">Needs action</p>
          </div>
        </MetaCard>

        {/* Viewed */}
        <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[100px] hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Viewed</span>
            <Eye className="w-4 h-4 text-oculus-purple" />
          </div>
          <div>
            <p className="text-heading-lg font-bold leading-none text-ink-deep">{viewedDocs}</p>
            <p className="text-[10px] text-slate mt-1">Opened by signers</p>
          </div>
        </MetaCard>

        {/* Signed */}
        <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[100px] hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Signed</span>
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-heading-lg font-bold leading-none text-ink-deep">{signedDocs}</p>
            <p className="text-[10px] text-slate mt-1">Completed docs</p>
          </div>
        </MetaCard>

        {/* Rejected */}
        <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[100px] hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-critical" />
          </div>
          <div>
            <p className="text-heading-lg font-bold leading-none text-ink-deep">{rejectedDocs}</p>
            <p className="text-[10px] text-slate mt-1">Declined docs</p>
          </div>
        </MetaCard>

        {/* Expiring Soon */}
        <MetaCard variant="product-feature" className="!p-md flex flex-col justify-between h-[100px] hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Urgent</span>
            <AlertTriangle className="w-4 h-4 text-critical-strong" />
          </div>
          <div>
            <p className="text-heading-lg font-bold leading-none text-ink-deep">{expiringSoonDocs}</p>
            <p className="text-[10px] text-slate mt-1">Expires within 3d</p>
          </div>
        </MetaCard>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* Left Column: Quick Actions & Charts */}
        <div className="space-y-xl lg:col-span-1">
          {/* Quick Actions Panel */}
          <MetaCard variant="checkout-summary" className="space-y-md">
            <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-sm">
              <button 
                onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="p-sm bg-surface-soft border border-hairline-soft rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col justify-between h-[85px] group select-none"
              >
                <Plus className="w-5 h-5 text-slate group-hover:text-primary transition-colors" />
                <div>
                  <span className="block text-body-sm-bold font-bold text-ink-deep">Upload File</span>
                  <span className="text-[9px] text-slate">PDF contract</span>
                </div>
              </button>

              <button 
                onClick={() => navigate('/dashboard/workspace')}
                className="p-sm bg-surface-soft border border-hairline-soft rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col justify-between h-[85px] group select-none"
              >
                <Calendar className="w-5 h-5 text-slate group-hover:text-primary transition-colors" />
                <div>
                  <span className="block text-body-sm-bold font-bold text-ink-deep">Templates</span>
                  <span className="text-[9px] text-slate">Workspace drafts</span>
                </div>
              </button>

              <button 
                onClick={() => navigate('/dashboard')}
                className="p-sm bg-surface-soft border border-hairline-soft rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col justify-between h-[85px] group select-none"
              >
                <Send className="w-5 h-5 text-slate group-hover:text-primary transition-colors" />
                <div>
                  <span className="block text-body-sm-bold font-bold text-ink-deep">Invite Signer</span>
                  <span className="text-[9px] text-slate">Send invitation</span>
                </div>
              </button>

              <button 
                onClick={() => navigate('/dashboard')}
                className="p-sm bg-surface-soft border border-hairline-soft rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col justify-between h-[85px] group select-none"
              >
                <LinkIcon className="w-5 h-5 text-slate group-hover:text-primary transition-colors" />
                <div>
                  <span className="block text-body-sm-bold font-bold text-ink-deep">Get Link</span>
                  <span className="text-[9px] text-slate">Generate share link</span>
                </div>
              </button>
            </div>
          </MetaCard>

          {/* Completion Rate Chart */}
          <MetaCard variant="product-feature" className="flex flex-col items-center justify-between p-lg text-center h-[200px]">
            <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider self-start">Completion Rate</h3>
            <div className="relative flex items-center justify-center my-2 select-none">
              {/* Circular progress bar SVG */}
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="var(--color-hairline-soft)" strokeWidth="6" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="var(--color-primary)" strokeWidth="6" fill="transparent"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - completionRate / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-heading-lg font-bold text-ink-deep">{completionRate}%</span>
                <span className="text-[9px] text-slate font-bold uppercase">Signed</span>
              </div>
            </div>
            <p className="text-body-xs text-slate">You have signed {signedDocs} out of {totalDocs} total contracts.</p>
          </MetaCard>
        </div>

        {/* Center / Right Column: Activity charts and document lists */}
        <div className="space-y-xl lg:col-span-2">
          {/* Document Activity Chart Card */}
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
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </MetaCard>

          {/* Upload Dropzone */}
          <div ref={uploadSectionRef} className="space-y-sm">
            <h2 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Upload Document</h2>
            <UploadDropzone onUploadSuccess={handleUploadSuccess} workspaceId={activeWorkspace?._id} />
          </div>

          {/* Your Documents List */}
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
              <div className="text-center py-xl text-slate text-body-md">
                Loading documents...
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
                          title={doc.isArchived ? "Unarchive Document" : "Archive Document"}
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

          {/* Recent Activity Timeline */}
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
                              {new Date(act.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
        </div>
      </div>
    </div>
  );
}
