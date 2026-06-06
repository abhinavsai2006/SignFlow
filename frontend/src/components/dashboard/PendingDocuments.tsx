import DocumentsView from './DocumentsView';

export default function PendingDocuments() {
  return (
    <DocumentsView 
      statusFilter="Pending"
      title="Pending Signatures"
      subtitle="Documents requiring your attention or signature placements."
    />
  );
}
