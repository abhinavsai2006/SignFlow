import DocumentsView from './DocumentsView';

export default function CompletedDocuments() {
  return (
    <DocumentsView 
      statusFilter="Signed"
      title="Completed Documents"
      subtitle="Verify and download your legally-stamped signed files."
    />
  );
}
