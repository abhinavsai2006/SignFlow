import DocumentsView from './DocumentsView';

export default function AllDocuments() {
  return (
    <DocumentsView 
      statusFilter="all"
      title="All Documents"
      subtitle="View, search, and track all your uploaded PDFs."
    />
  );
}
