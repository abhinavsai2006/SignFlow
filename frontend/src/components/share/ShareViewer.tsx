import { useLayoutEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { SignatureField } from '../../hooks/useShareDocument';
import { ShareFieldLayer } from './ShareFieldLayer';

interface ShareViewerProps {
  pdfDoc: any;
  numPages: number;
  isPdfLoading: boolean;
  fields: SignatureField[];
  viewerContainerRef: MutableRefObject<HTMLDivElement | null>;
  pageContainerRefs: MutableRefObject<Record<number, HTMLDivElement | null>>;
  signerEmail: string;
  signerName: string;
  onFieldClick: (f: SignatureField) => void;
  handleFitWidth: () => void;
}

export function ShareViewer({
  pdfDoc,
  numPages,
  isPdfLoading,
  fields,
  viewerContainerRef,
  pageContainerRefs,
  signerEmail,
  signerName,
  onFieldClick,
  handleFitWidth,
}: ShareViewerProps) {
  // Trigger fit-width after the viewer container is in the DOM
  useLayoutEffect(() => {
    if (pdfDoc && viewerContainerRef.current) {
      handleFitWidth();
    }
  }, [pdfDoc, handleFitWidth, viewerContainerRef]);

  if (isPdfLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse">Loading document…</p>
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate">
        <div className="w-10 h-10 border-2 border-slate-600 border-t-transparent rounded-full animate-spin opacity-40" />
        <p className="text-sm opacity-50">Preparing viewer…</p>
      </div>
    );
  }

  return (
    <div
      ref={viewerContainerRef}
      className="w-full h-full overflow-auto flex flex-col items-center gap-8 py-6 px-4"
    >
      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
        <div
          key={pageNum}
          ref={(el) => { pageContainerRefs.current[pageNum] = el; }}
          className="relative shadow-2xl bg-white rounded overflow-visible shrink-0"
          style={{ display: 'inline-block' }}
        >
          {/* PDF canvas renders here via usePdfViewer */}
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
