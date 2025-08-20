import { TourState } from './tour-state.js';
import { Overlay } from './components/overlay.js';
import { Tooltip } from './components/tooltip.js';
import { ToggleButton } from './components/toggle-button.js';
import { Animator } from './utils/animator.js';
import { SmoothScroll } from './utils/smooth-scroll.js';
import { TransitionManager } from './utils/transition-manager.js';
import { EventEmitter } from './utils/event-emitter.js';
import { defaultOptions } from './config/default-options.js';

class GuidedTour extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = { ...defaultOptions, ...options };
    this.state = new TourState();
    this.overlay = new Overlay(this.options.overlay);
    this.tooltip = new Tooltip(this.options.tooltip);
    this.toggleButton = new ToggleButton(this.options.toggle);
    this.animator = new Animator(this.options.animation);
    this.smoothScroll = new SmoothScroll(this.options.scroll);
    this.transitionManager = new TransitionManager(this.options.transition);
    
    this.steps = this.options.steps || [];
    this.currentStepIndex = -1;
    this.isActive = false;
    
    this._init();
  }
  
  _init() {
    // Initialize components
    this.overlay.mount();
    this.tooltip.mount();
    this.toggleButton.mount();
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Apply theme
    this._applyTheme();
    
    // Restore state if persistence is enabled
    if (this.options.persistence.enabled) {
      this._restoreState();
    }
  }
  
  _applyTheme() {
    const themeClasses = {
      'minimal': 'guided-tour-minimal',
      'minimal-dark': 'guided-tour-minimal guided-tour-minimal-dark',
      'dark': 'guided-tour-dark',
      'neon': 'guided-tour-neon'
    };
    
    if (themeClasses[this.options.theme]) {
      this.themeClass = themeClasses[this.options.theme];
    }
  }
  
  _setupEventListeners() {
    // Toggle button events
    this.toggleButton.on('click', () => {
      if (this.isActive) {
        this.stop();
      } else {
        this.start();
      }
    });
    
    // Tooltip navigation events
    this.tooltip.on('next', () => this.next());
    this.tooltip.on('previous', () => this.previous());
    this.tooltip.on('skip', () => this.skip());
    this.tooltip.on('close', () => this.stop());
    
    // Overlay events
    this.overlay.on('click', (e) => {
      if (this.options.overlay.clickToClose && e.target === this.overlay.element) {
        this.stop();
      }
    });
    
    // Window events
    this._handleResize = this._debounce(() => {
      if (this.isActive && this.currentStepIndex >= 0) {
        this._positionTooltip();
      }
    }, 300);
    
    this._handleScroll = this._throttle(() => {
      if (this.isActive && this.currentStepIndex >= 0) {
        // Let tooltip handle its own scroll behavior
        // This is just for overlay adjustment if needed
      }
    }, 16);
    
    window.addEventListener('resize', this._handleResize);
    window.addEventListener('scroll', this._handleScroll, true);
  }
  
  start() {
    if (this.isActive || this.steps.length === 0) return;
    
    this.isActive = true;
    this.currentStepIndex = 0;
    
    // Apply theme class if set
    if (this.themeClass) {
      document.body.classList.add(...this.themeClass.split(' '));
    }
    
    this.emit('start', { totalSteps: this.steps.length });
    
    this.overlay.show();
    this.toggleButton.setActive(true);
    this._showStep(0);
  }
  
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.currentStepIndex = -1;
    
    // Remove theme class if set
    if (this.themeClass) {
      document.body.classList.remove(...this.themeClass.split(' '));
    }
    
    this.emit('stop');
    
    this.overlay.hide();
    this.tooltip.hide();
    this.toggleButton.setActive(false);
    this._clearHighlight();
    
    if (this.options.persistence.enabled) {
      this._saveState();
    }
  }
  
  pause() {
    if (!this.isActive) return;
    
    this.state.setPaused(true);
    this.emit('pause', { step: this.currentStepIndex });
  }
  
  resume() {
    if (!this.isActive || !this.state.isPaused) return;
    
    this.state.setPaused(false);
    this.emit('resume', { step: this.currentStepIndex });
  }
  
  next() {
    if (!this.isActive || this.currentStepIndex >= this.steps.length - 1) {
      if (this.currentStepIndex === this.steps.length - 1) {
        this.complete();
      }
      return;
    }
    
    this.currentStepIndex++;
    this._showStep(this.currentStepIndex);
  }
  
  previous() {
    if (!this.isActive || this.currentStepIndex <= 0) return;
    
    this.currentStepIndex--;
    this._showStep(this.currentStepIndex);
  }
  
  goToStep(index) {
    if (!this.isActive || index < 0 || index >= this.steps.length) return;
    
    this.currentStepIndex = index;
    this._showStep(index);
  }
  
  skip() {
    this.emit('skip', { step: this.currentStepIndex });
    this.stop();
  }
  
  complete() {
    this.emit('complete', { totalSteps: this.steps.length });
    
    if (this.options.persistence.enabled) {
      this._markComplete();
    }
    
    this.stop();
  }
  
  async _showStep(index) {
    const step = this.steps[index];
    if (!step) {
      console.error('No step found at index:', index);
      return;
    }
    
    console.log('Showing step:', index, step);
    
    this.emit('stepChange', {
      index,
      step,
      total: this.steps.length
    });
    
    try {
      // Hide current tooltip smoothly
      if (this.currentStepIndex >= 0) {
        await this.tooltip.hide();
      }
      
      // Clear previous highlight
      this._clearHighlight();
      
      // Find and highlight element
      const element = document.querySelector(step.element);
      if (!element) {
        console.error('Element not found:', step.element);
        this.emit('error', {
          type: 'element-not-found',
          step: index,
          selector: step.element
        });
        
        // Try to continue to next step if element not found
        if (index < this.steps.length - 1) {
          setTimeout(() => this.next(), 100);
        }
        return;
      }
    
      // Scroll element into view
      await this._scrollToElement(element);
      
      // Highlight element
      await this._highlightElement(element, step);
      
      // Update tooltip content
      this.tooltip.setContent({
        title: step.title,
        content: step.content,
        step: index + 1,
        total: this.steps.length,
        showPrevious: index > 0,
        showNext: true, // Always show next button
        nextLabel: index === this.steps.length - 1 ? 'End Tour' : 'Next'
      });
      
      // Position and show tooltip
      this._positionTooltip();
      await this.tooltip.show();
    } catch (error) {
      console.error('Error showing step:', error);
      this.emit('error', {
        type: 'show-step-error',
        step: index,
        error: error.message
      });
    }
  }
  
  async _highlightElement(element, step) {
    const rect = element.getBoundingClientRect();
    const padding = step.padding || this.options.highlight.padding;
    
    // Create highlight area
    const highlight = {
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding + window.scrollX,
      width: rect.width + (padding * 2),
      height: rect.height + (padding * 2)
    };
    
    // Update overlay to show highlight
    await this.overlay.highlight(highlight, {
      animate: this.options.animation.enabled,
      shape: step.shape || this.options.highlight.shape
    });
    
    // Add highlight class to element
    element.classList.add('guided-tour-target');
    
    // Apply highlight effect
    if (this.options.highlight.pulse) {
      element.classList.add('guided-tour-pulse');
    }
    
    this.currentElement = element;
    this.currentHighlight = highlight;
  }
  
  _clearHighlight() {
    if (this.currentElement) {
      this.currentElement.classList.remove('guided-tour-target', 'guided-tour-pulse');
      this.currentElement = null;
    }
    
    this.overlay.clearHighlight();
  }
  
  async _scrollToElement(element) {
    const rect = element.getBoundingClientRect();
    const viewportPadding = 100; // Extra padding for better visibility
    
    const isInViewport = (
      rect.top >= viewportPadding &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight - viewportPadding &&
      rect.right <= window.innerWidth
    );
    
    if (!isInViewport) {
      // Calculate optimal scroll position
      const elementCenter = rect.top + window.scrollY + (rect.height / 2);
      const viewportCenter = window.innerHeight / 2;
      const targetScrollY = elementCenter - viewportCenter;
      
      // Use smooth scroll utility for better animation
      await this.smoothScroll.scrollTo(element, {
        offset: viewportCenter - (rect.height / 2),
        duration: this.options.scroll?.duration || 800,
        easing: this.options.scroll?.easing || 'easeInOutCubic'
      });
      
      // Small delay to ensure scroll completes
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  _positionTooltip() {
    if (!this.currentElement || !this.currentHighlight) return;
    
    const step = this.steps[this.currentStepIndex];
    const position = step.position || this.options.tooltip.position;
    const anchorPosition = step.anchorPosition || this.options.tooltip.anchorPosition || 'center';
    
    this.tooltip.position(this.currentElement, position, {
      offset: this.options.tooltip.offset,
      anchorPosition: anchorPosition,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        padding: this.options.tooltip.viewport?.padding || 20
      }
    });
  }
  
  _saveState() {
    const state = {
      completed: this.state.completedSteps,
      lastStep: this.currentStepIndex,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.options.persistence.key, JSON.stringify(state));
  }
  
  _restoreState() {
    try {
      const saved = localStorage.getItem(this.options.persistence.key);
      if (saved) {
        const state = JSON.parse(saved);
        this.state.completedSteps = state.completed || [];
      }
    } catch (e) {
      console.error('Failed to restore tour state:', e);
    }
  }
  
  _markComplete() {
    const tourId = this.options.id || 'default';
    this.state.markTourComplete(tourId);
    this._saveState();
  }
  
  _debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  _throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  destroy() {
    this.stop();
    
    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('scroll', this._handleScroll, true);
    
    this.overlay.destroy();
    this.tooltip.destroy();
    this.toggleButton.destroy();
    
    this.removeAllListeners();
  }
}

// Export for different module systems
export default GuidedTour;
export { GuidedTour };