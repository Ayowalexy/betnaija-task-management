import styles from './Tabs.module.css';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pill';
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline' }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={styles.tabsWrapper}>
        <div className={styles.pillList} role="tablist">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                className={[styles.pillTab, isActive ? styles.pillTabActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onChange(tab.id)}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={styles.count}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tabsWrapper}>
      <div className={styles.underlineList} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={[
                styles.underlineTab,
                isActive ? styles.underlineTabActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={styles.count}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
