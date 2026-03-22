"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function Tabs({ tabs, defaultTab, className, onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Tab Headers */}
      <div style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              style={
                activeTab === tab.id
                  ? {
                      borderBottomColor: "var(--color-accent)",
                      color: "var(--color-accent)",
                    }
                  : {
                      borderBottomColor: "transparent",
                      color: "var(--color-text-muted)",
                    }
              }
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--color-text-secondary)";
                  (e.currentTarget as HTMLElement).style.borderBottomColor =
                    "var(--color-border)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--color-text-muted)";
                  (e.currentTarget as HTMLElement).style.borderBottomColor =
                    "transparent";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">{activeTabContent}</div>
    </div>
  );
}
