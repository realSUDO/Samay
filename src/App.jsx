import { useState } from 'react'
import Clock from './components/Clock'
import Stopwatch from './components/Stopwatch'
import Timer from './components/Timer'
import styles from './App.module.css'

const tabs = [
  { id: 'watch', label: 'Watch' },
  { id: 'stopwatch', label: 'Stopwatch' },
  { id: 'timer', label: 'Timer' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('watch')

  const activeView = {
    stopwatch: <Stopwatch />,
    timer: <Timer />,
    watch: <Clock />,
  }[activeTab]

  return (
    <div className={styles.shell}>
      {/* Top bar */}
      <header className={styles.header}>
        <span className={styles.brand}>Waqt</span>

        <nav className={styles.nav} role="navigation" aria-label="Mode">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <button className={styles.settingsBtn} aria-label="Settings" style={{ visibility: 'hidden', pointerEvents: 'none' }} />
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {activeView}
      </main>
    </div>
  )
}
