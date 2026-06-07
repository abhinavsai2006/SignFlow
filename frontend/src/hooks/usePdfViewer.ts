import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export function usePdfViewer(pdfUrl: string | null) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const pageContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const renderTaskRefs = useRef<Record<number, any>>({});

  const loadPdfFile = useCallback(async () => {
    if (!pdfUrl) return;
    try {
      setIsPdfLoading(true);
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load PDF file:', err);
    } finally {
      setIsPdfLoading(false);
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (pdfUrl && !pdfDoc && !isPdfLoading) {
      loadPdfFile();
    }
  }, [pdfUrl, pdfDoc, isPdfLoading, loadPdfFile]);

  const handleFitWidth = useCallback(() => {
    if (!pdfDoc || !viewerContainerRef.current) return;
    const containerWidth = viewerContainerRef.current.clientWidth - 48; // padding
    if (containerWidth <= 0) return;
    
    pdfDoc.getPage(1).then((page) => {
      const originalViewport = page.getViewport({ scale: 1 });
      const fitScale = containerWidth / originalViewport.width;
      setScale(fitScale);
    });
  }, [pdfDoc]);

  // Use ResizeObserver for immediate fit width on layout changes (P0-1)
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container || !pdfDoc) return;
    
    let resizeTimer: any;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        handleFitWidth();
      }, 50); // slight debounce for smooth resizing
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [pdfDoc, handleFitWidth]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    const container = pageContainerRefs.current[pageNum];
    if (!container) return;

    let canvas = container.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'block';
      container.insertBefore(canvas, container.firstChild);
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    if (renderTaskRefs.current[pageNum]) {
      renderTaskRefs.current[pageNum].cancel();
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const dpr = (window.devicePixelRatio || 1) * 2;
      const viewport = page.getViewport({ scale: scale * dpr });
      const cssViewport = page.getViewport({ scale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${cssViewport.width}px`;
      canvas.style.height = `${cssViewport.height}px`;

      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({ canvasContext: context, viewport } as any);
      renderTaskRefs.current[pageNum] = renderTask;
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Page ${pageNum} render error:`, err);
      }
    }
  }, [pdfDoc, scale]);

  useEffect(() => {
    if (!pdfDoc) return;
    const timer = setTimeout(() => {
      for (let p = 1; p <= numPages; p++) {
        renderPage(p);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pdfDoc, numPages, scale, renderPage]);

  return {
    pdfDoc,
    numPages,
    currentPage,
    setCurrentPage,
    scale,
    setScale,
    isPdfLoading,
    viewerContainerRef,
    pageContainerRefs,
    handleFitWidth
  };
}
