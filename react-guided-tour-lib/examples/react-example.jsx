import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GuidedTour, HeroUIProvider, CustomTooltipExample } from '../src/index';
import '../src/styles/index.css';

const tourSteps = [
  {
    selector: '#header',
    title: 'Welcome to React Example!',
    content: 'This example shows how to use the library in a React application.'
  },
  {
    selector: '#theme-toggle',
    title: 'Theme Toggle',
    content: 'Switch between light and dark themes.'
  },
  {
    selector: '#custom-tooltip-toggle',
    title: 'Custom Tooltip',
    content: 'Toggle between default and custom tooltip designs.'
  },
  {
    selector: '#content',
    title: 'Main Content',
    content: 'This is where your main application content goes.'
  }
];

function App() {
  const [theme, setTheme] = useState('light');
  const [useCustom, setUseCustom] = useState(false);

  return (
    <HeroUIProvider>
      <GuidedTour
        steps={tourSteps}
        theme={theme}
        autoStart={true}
        customTooltip={useCustom ? <CustomTooltipExample /> : null}
        options={{
          storageKey: 'reactExampleTour',
          onComplete: () => console.log('Tour completed!'),
          onSkip: () => console.log('Tour skipped!')
        }}
      >
        <div style={{ padding: '20px', minHeight: '100vh', background: theme === 'dark' ? '#1a1a1a' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }}>
          <div id="header" style={{ marginBottom: '20px' }}>
            <h1>React Guided Tour Example</h1>
            <p>This demonstrates the library usage in a React app.</p>
          </div>
          
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button
              id="theme-toggle"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Toggle Theme: {theme}
            </button>
            
            <button
              id="custom-tooltip-toggle"
              onClick={() => setUseCustom(!useCustom)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: '#10b981',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Tooltip: {useCustom ? 'Custom' : 'Default'}
            </button>
          </div>
          
          <div id="content" style={{
            padding: '20px',
            background: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
            borderRadius: '8px'
          }}>
            <h2>Main Content Area</h2>
            <p>Your application content goes here. The tour will guide users through different sections.</p>
            <ul>
              <li>Smart positioning</li>
              <li>Keyboard navigation</li>
              <li>State persistence</li>
              <li>Custom tooltips</li>
            </ul>
          </div>
        </div>
      </GuidedTour>
    </HeroUIProvider>
  );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);