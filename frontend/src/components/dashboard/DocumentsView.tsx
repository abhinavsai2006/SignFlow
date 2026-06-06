import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import MetaCard from '../ui/MetaCard';
import MetaBadge from '../ui/MetaBadge';
import type { MetaBadgeVariant } from '../ui/MetaBadge';
import MetaButton from '../ui/MetaButton';
import MetaSearch from '../ui/MetaSearch';
import { FileText, ArrowUpDown } from 'lucide-react';

interface Document {
  _id: string;
  filename: string;
  originalPath: string;
  status: 'Draft' | 'Pending' | 'Viewed' | 'PartiallySigned' | 'Signed' | 'Rejected' | 'Expired' | 'Archived';
  createdAt: string;
}

interface DocumentsViewProps {
  statusFilter?: 'all' | 'Pending' | 'Signed' | 'Rejected';
  title: string;
  subtitle: string;
}

export default function DocumentsView({ statusFilter = 'all', title, subtitle }: DocumentsViewProps) {
  const navigate = useNavigate();
  const { activeWorkspace } = useOutletContext<{ activeWorkspace: any }>() || { activeWorkspace: null };
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha'>('newest');
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, searchQuery, sortBy, currentPage, activeWorkspace]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/docs', {
        params: {
          search: searchQuery,
          status: statusFilter,
          sortBy,
          page: currentPage,
          limit: itemsPerPage,
          workspaceId: activeWorkspace?._id || 'personal'
        }
      });
      
      const data = response.data;
      if (data.documents) {
        setDocuments(data.documents);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      } else {
        // Fallback for simple array responses
        setDocuments(data);
        setTotalPages(1);
        setTotalCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): MetaBadgeVariant => {
    switch (status) {
      case 'Signed': return 'success';
      case 'PartiallySigned': return 'attention';
      case 'Rejected': return 'critical';
      case 'Expired': return 'critical';
      case 'Archived': return 'warning';
      case 'Viewed': return 'attention';
      default: return 'attention';
    }
  };

  const getStatusLabel = (status: string): string => {
    if (status === 'PartiallySigned') return 'Partially Signed';
    return status;
  };

  const needsAction = (status: string) => ['Pending', 'PartiallySigned', 'Viewed'].includes(status);

  return (
    <div className="space-y-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="text-heading-lg font-bold text-ink-deep mb-xxs">{title}</h1>
          <p className="text-body-sm text-slate">{subtitle}</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-sm">
          <MetaSearch 
            placeholder="Search files..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset page on type
            }}
            className="w-full sm:w-[220px]"
          />
          <div className="relative inline-flex items-center bg-canvas border border-hairline-soft rounded-full px-md py-xs">
            <ArrowUpDown className="w-4 h-4 text-slate mr-2" />
            <select 
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-body-sm font-bold text-ink-deep outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="space-y-md">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-[80px] bg-canvas/50 border border-hairline-soft rounded-xl animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <MetaCard variant="product-feature" className="text-center py-xxl">
          <p className="text-subtitle-md text-ink-deep mb-xxs font-bold">No documents found</p>
          <p className="text-body-sm text-slate">Try adjusting your search query or uploading a document.</p>
        </MetaCard>
      ) : (
        <div className="space-y-md">
          {documents.map((doc) => (
            <MetaCard key={doc._id} variant="checkout-summary" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
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
                  {getStatusLabel(doc.status)}
                </MetaBadge>

                <MetaButton 
                  variant={needsAction(doc.status) ? 'primary' : 'secondary'}
                  onClick={() => navigate(`/edit/${doc._id}`)}
                >
                  {needsAction(doc.status) ? 'Sign' : 'View'}
                </MetaButton>
              </div>
            </MetaCard>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-hairline-soft pt-xl mt-xl select-none">
              <p className="text-body-sm text-slate">
                Showing Page <span className="font-bold text-ink-deep">{currentPage}</span> of {totalPages} (Total {totalCount} files)
              </p>
              <div className="flex space-x-md">
                <MetaButton 
                  variant="ghost" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="!py-[6px] !px-[16px] text-body-sm"
                >
                  Previous
                </MetaButton>
                <MetaButton 
                  variant="ghost" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="!py-[6px] !px-[16px] text-body-sm"
                >
                  Next
                </MetaButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
