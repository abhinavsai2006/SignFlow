import type { MutableRefObject } from 'react';
import type { SignatureField } from '../../hooks/useShareDocument';
import { ShareFieldLayer } from './ShareFieldLayer';

interface ShareViewerProps {
  pdfDoc: any;
  numPages: number;
  fields: SignatureField[];
  viewerContainerRef: MutableRefObject<HTMLDivElement | null>;
  pageContainerRefs: MutableRefObject<Record<number, HTMLDivElement | null>>;
  signerEmail: string;
  signerName: string;
  onFieldClick: (f: SignatureField) => void;
}

export function ShareViewer({
  pdfDoc,
  numPages,
  fields,
  viewerContainerRef,
  pageContainerRefs,
  signerEmail,
  signerName,
  onFieldClick
}: ShareViewerProps) {
  
  if (!pdfDoc) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={viewerContainerRef} className="w-full h-full overflow-auto flex flex-col items-center gap-6">
      {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
        <div
          key={pageNum}
          ref={el => { pageContainerRefs.current[pageNum] = el; }}
          className="relative shadow-2xl bg-white rounded-lg overflow-visible shrink-0"
          style={{ display: 'block', width: 'fit-content', margin: '0 auto' }}
        >
          <ShareFieldLayer
            fields={fields}
            pageNum={pageNum}
            signerEmail={signerEmail}
            signerName={signerName}
            onFieldClick={onFieldClick}
          />
        </div>
      ))}
    </div>
  );
}
