import { useState } from 'react';
import type { ReactNode } from 'react';
import MetaButton from './MetaButton';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface MetaTabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  className?: string;
}

export default function MetaTabs({ tabs, defaultTabId, className = '' }: MetaTabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

  const activeContent = tabs.find(t => t.id === activeTabId)?.content;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex space-x-xs mb-xl overflow-x-auto pb-xs scrollbar-hide">
        {tabs.map((tab) => (
          <MetaButton
            key={tab.id}
            variant="pill-tab"
            active={activeTabId === tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className="whitespace-nowrap"
          >
            {tab.label}
          </MetaButton>
        ))}
      </div>
      <div>
        {activeContent}
      </div>
    </div>
  );
}
