import type { ReactNode } from 'react';

interface ShareLayoutProps {
  sidebar: ReactNode;
  viewer: ReactNode;
  header: ReactNode;
  floatingBar?: ReactNode;
}

export function ShareLayout({ sidebar, viewer, header, floatingBar }: ShareLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink-deep flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="bg-surface-soft border-b border-hairline-soft h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 select-none z-10">
        {header}
      </header>

      {/* Main Body */}
      <div className="flex-1 w-full flex overflow-hidden bg-canvas min-h-0">
        {/* Left Sidebar */}
        <aside
          className="bg-surface-soft border-r border-hairline-soft p-4 w-[300px] min-w-[300px] shrink-0 hidden md:flex flex-col gap-4 overflow-y-auto"
        >
          {sidebar}
        </aside>

        {/* Right PDF Viewer — add bottom padding for floating bar */}
        <main className="flex-1 min-w-0 overflow-hidden relative flex flex-col bg-[#1a1a2e]">
          <div className="flex-1 min-h-0 overflow-hidden">
            {viewer}
          </div>
          {/* Floating action bar sits inside the viewer column above the bottom */}
          {floatingBar && (
            <div className="shrink-0 z-20">
              {floatingBar}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
