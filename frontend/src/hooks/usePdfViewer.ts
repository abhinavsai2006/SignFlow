import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export function usePdfViewer(pdfUrl: string | null) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [initialFitDone, setInitialFitDone] = useState(false);

  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const pageContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const renderTaskRefs = useRef<Record<number, any>>({});

  const loadPdfFile = useCallback(async () => {
    if (!pdfUrl) return;
    try {
      setIsPdfLoading(true);
      setInitialFitDone(false);
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
    const containerWidth = viewerContainerRef.current.clientWidth - 48;
    if (containerWidth <= 0) return;

    pdfDoc.getPage(1).then((page) => {
      const originalViewport = page.getViewport({ scale: 1 });
      const fitScale = containerWidth / originalViewport.width;
      setScale(fitScale);
    });
  }, [pdfDoc]);

  // Trigger initial fit-width once after PDF doc is available and container is mounted
  useEffect(() => {
    if (!pdfDoc || initialFitDone) return;
    // Use two requestAnimationFrames to ensure DOM refs are fully laid out
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        handleFitWidth();
        setInitialFitDone(true);
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [pdfDoc, initialFitDone, handleFitWidth]);

  // ResizeObserver: re-fit when container resizes (sidebar open/close, window resize)
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container || !pdfDoc) return;

    let resizeTimer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        handleFitWidth();
      }, 60);
    });

    observer.observe(container);
    return () => {
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [pdfDoc, handleFitWidth]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    const container = pageContainerRefs.current[pageNum];
    if (!container) return;

    // Remove any existing canvas to avoid duplicates
    const existingCanvases = container.querySelectorAll<HTMLCanvasElement>('canvas');
    let canvas: HTMLCanvasElement;
    if (existingCanvases.length > 1) {
      // Duplicate canvases — remove extras, keep one
      existingCanvases.forEach((c, idx) => { if (idx > 0) c.remove(); });
      canvas = existingCanvases[0];
    } else if (existingCanvases.length === 1) {
      canvas = existingCanvases[0];
    } else {
      canvas = document.createElement('canvas');
      canvas.className = 'block';
      container.insertBefore(canvas, container.firstChild);
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    if (renderTaskRefs.current[pageNum]) {
      try { renderTaskRefs.current[pageNum].cancel(); } catch (_) { /* ignore */ }
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for performance
      const viewport = page.getViewport({ scale: scale * dpr });
      const cssViewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${cssViewport.width}px`;
      canvas.style.height = `${cssViewport.height}px`;
      canvas.style.display = 'block';

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

  // Re-render all pages when doc or scale changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;
    const timer = setTimeout(() => {
      for (let p = 1; p <= numPages; p++) {
        renderPage(p);
      }
    }, 150);
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
    handleFitWidth,
  };
}
