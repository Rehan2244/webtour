import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import GuidedTour from './components/GuidedTour';
import Overlay from './components/Overlay';
import Tooltip from './components/Tooltip';
import ToggleButton from './components/ToggleButton';
import CustomTooltipExample from './components/CustomTooltipExample';
import { useGuidedTour } from './hooks/useGuidedTour';
import './styles/index.css';

// Export components for use in React apps
export {
  GuidedTour,
  Overlay,
  Tooltip,
  ToggleButton,
  CustomTooltipExample,
  useGuidedTour,
  HeroUIProvider
};

// Initialization function for non-React apps
class ReactGuidedTourLib {
  constructor() {
    this.instances = new Map();
  }

  init(config) {
    const {
      targetElement,
      steps,
      options = {},
      theme = 'light',
      autoStart = false,
      showToggleButton = true,
      customTooltip = null
    } = config;

    // Ensure target element exists
    const target = typeof targetElement === 'string' 
      ? document.querySelector(targetElement) 
      : targetElement;

    if (!target) {
      console.error('ReactGuidedTour: Target element not found');
      return null;
    }

    // Create a wrapper div for the tour
    const wrapper = document.createElement('div');
    wrapper.className = 'rgt-wrapper';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '9999';
    document.body.appendChild(wrapper);

    // Create root and render
    const root = ReactDOM.createRoot(wrapper);
    
    const App = () => (
      <HeroUIProvider>
        <GuidedTour
          steps={steps}
          options={options}
          theme={theme}
          autoStart={autoStart}
          showToggleButton={showToggleButton}
          customTooltip={customTooltip}
        />
      </HeroUIProvider>
    );

    root.render(<App />);

    // Store instance
    const instanceId = Date.now().toString();
    this.instances.set(instanceId, { root, wrapper });

    // Return control object
    return {
      id: instanceId,
      destroy: () => this.destroy(instanceId),
      start: () => {
        // Trigger tour start programmatically
        wrapper.dispatchEvent(new CustomEvent('start-tour'));
      },
      reset: () => {
        // Reset tour state
        wrapper.dispatchEvent(new CustomEvent('reset-tour'));
      }
    };
  }

  destroy(instanceId) {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.root.unmount();
      instance.wrapper.remove();
      this.instances.delete(instanceId);
    }
  }

  destroyAll() {
    this.instances.forEach((instance, id) => {
      this.destroy(id);
    });
  }
}

// Create and export the library instance
const reactGuidedTourInstance = new ReactGuidedTourLib();

// Create global instance for non-React usage
if (typeof window !== 'undefined') {
  window.ReactGuidedTour = reactGuidedTourInstance;
}

// Export both the class and instance
export { ReactGuidedTourLib };
export default reactGuidedTourInstance;