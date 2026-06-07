import type { ReactNode } from 'react';

interface ShareLayoutProps {
  sidebar: ReactNode;
  viewer: ReactNode;
  header: ReactNode;
}

export function ShareLayout({ sidebar, viewer, header }: ShareLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink-deep flex flex-col h-screen overflow-hidden">
      <header className="bg-surface-soft border-b border-hairline-soft h-14 shrink-0 flex items-center justify-between px-6 select-none">
        {header}
      </header>

      {/* Main Body */}
      <div className="flex-1 w-full flex overflow-hidden bg-canvas min-h-0">
        {/* Left Sidebar */}
        <aside 
          className="bg-surface-soft border-r border-hairline-soft p-4 w-[320px] min-w-[320px] shrink-0 hidden md:flex flex-col gap-4 overflow-y-auto whitespace-normal"
          style={{ wordBreak: 'normal' }}
        >
          {sidebar}
        </aside>

        {/* Right Viewer */}
        <main className="flex-1 min-w-0 overflow-auto p-6 pb-20 md:pb-6 flex-col items-center gap-6 bg-[#0d0d14] flex">
          {viewer}
        </main>
      </div>
    </div>
  );
}
