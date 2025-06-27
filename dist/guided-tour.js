(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.GuidedTour = {}));
})(this, (function (exports) { 'use strict';

  class TourState {
    constructor() {
      this.isPaused = false;
      this.completedSteps = [];
      this.completedTours = [];
      this.currentTour = null;
      this.currentStep = -1;
    }
    
    setPaused(paused) {
      this.isPaused = paused;
    }
    
    markStepComplete(stepIndex) {
      if (!this.completedSteps.includes(stepIndex)) {
        this.completedSteps.push(stepIndex);
      }
    }
    
    markTourComplete(tourId) {
      if (!this.completedTours.includes(tourId)) {
        this.completedTours.push(tourId);
      }
    }
    
    isTourCompleted(tourId) {
      return this.completedTours.includes(tourId);
    }
    
    reset() {
      this.isPaused = false;
      this.completedSteps = [];
      this.currentStep = -1;
    }
    
    resetAll() {
      this.reset();
      this.completedTours = [];
      this.currentTour = null;
    }
  }

  class EventEmitter {
    constructor() {
      this.events = {};
    }
    
    on(event, listener) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
      return this;
    }
    
    off(event, listenerToRemove) {
      if (!this.events[event]) return;
      
      this.events[event] = this.events[event].filter(
        listener => listener !== listenerToRemove
      );
      return this;
    }
    
    emit(event, data) {
      if (!this.events[event]) return;
      
      this.events[event].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
      return this;
    }
    
    once(event, listener) {
      const onceWrapper = (data) => {
        listener(data);
        this.off(event, onceWrapper);
      };
      return this.on(event, onceWrapper);
    }
    
    removeAllListeners(event) {
      if (event) {
        delete this.events[event];
      } else {
        this.events = {};
      }
      return this;
    }
  }

  class Overlay extends EventEmitter {
    constructor(options = {}) {
      super();
      
      this.options = {
        opacity: 0.5,
        color: '#000000',
        clickToClose: true,
        zIndex: 9998,
        ...options
      };
      
      this.element = null;
      this.svgElement = null;
      this.currentHighlight = null;
    }
    
    mount() {
      if (this.element) return;
      
      // Create overlay container
      this.element = document.createElement('div');
      this.element.className = 'guided-tour-overlay';
      this.element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: ${this.options.zIndex};
      display: none;
      pointer-events: ${this.options.clickToClose ? 'auto' : 'none'};
    `;
      
      // Create SVG for highlight
      this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
      
      // Create mask elements
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
      mask.id = 'guided-tour-mask';
      
      // Background rect (visible area)
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', '0');
      bgRect.setAttribute('y', '0');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', 'white');
      mask.appendChild(bgRect);
      
      // Highlight rect (cutout area)
      this.highlightElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      this.highlightElement.setAttribute('fill', 'black');
      this.highlightElement.setAttribute('rx', '4');
      this.highlightElement.setAttribute('ry', '4');
      mask.appendChild(this.highlightElement);
      
      defs.appendChild(mask);
      this.svgElement.appendChild(defs);
      
      // Overlay rect with mask
      const overlayRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      overlayRect.setAttribute('x', '0');
      overlayRect.setAttribute('y', '0');
      overlayRect.setAttribute('width', '100%');
      overlayRect.setAttribute('height', '100%');
      overlayRect.setAttribute('fill', this.options.color);
      overlayRect.setAttribute('fill-opacity', this.options.opacity);
      overlayRect.setAttribute('mask', 'url(#guided-tour-mask)');
      this.svgElement.appendChild(overlayRect);
      
      this.element.appendChild(this.svgElement);
      document.body.appendChild(this.element);
      
      // Set up event listeners
      if (this.options.clickToClose) {
        this.element.addEventListener('click', (e) => {
          if (e.target === this.element) {
            this.emit('click', e);
          }
        });
      }
    }
    
    show() {
      if (!this.element) return;
      
      this.element.style.display = 'block';
      this.element.offsetHeight; // Force reflow
      this.element.classList.add('guided-tour-overlay-visible');
    }
    
    hide() {
      if (!this.element) return;
      
      this.element.classList.remove('guided-tour-overlay-visible');
      setTimeout(() => {
        this.element.style.display = 'none';
      }, 300);
    }
    
    async highlight(area, options = {}) {
      if (!this.highlightElement) return;
      
      const { animate = true, shape = 'rectangle' } = options;
      
      // Update highlight position and size
      this.highlightElement.setAttribute('x', area.left);
      this.highlightElement.setAttribute('y', area.top);
      this.highlightElement.setAttribute('width', area.width);
      this.highlightElement.setAttribute('height', area.height);
      
      // Apply shape
      if (shape === 'circle') {
        const radius = Math.max(area.width, area.height) / 2;
        this.highlightElement.setAttribute('rx', radius);
        this.highlightElement.setAttribute('ry', radius);
      } else {
        this.highlightElement.setAttribute('rx', '8');
        this.highlightElement.setAttribute('ry', '8');
      }
      
      // Add smooth animation
      if (animate) {
        this.highlightElement.style.transition = `
        x 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
        y 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
        width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
        height 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
        rx 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
        ry 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)
      `;
      } else {
        this.highlightElement.style.transition = 'none';
      }
      
      this.currentHighlight = area;
      
      // Enable pointer events for highlighted area
      this._updatePointerEvents(area);
    }
    
    clearHighlight() {
      if (!this.highlightElement) return;
      
      // Move highlight out of view
      this.highlightElement.setAttribute('x', '-9999');
      this.highlightElement.setAttribute('y', '-9999');
      this.highlightElement.setAttribute('width', '0');
      this.highlightElement.setAttribute('height', '0');
      
      // Remove any existing click area
      const clickArea = document.querySelector('.guided-tour-click-area');
      if (clickArea) {
        clickArea.remove();
      }
      
      this.currentHighlight = null;
    }
    
    _updatePointerEvents(area) {
      // Create a temporary element to allow clicks through to the highlighted area
      const existing = document.querySelector('.guided-tour-click-area');
      if (existing) {
        existing.remove();
      }
      
      const clickArea = document.createElement('div');
      clickArea.className = 'guided-tour-click-area';
      clickArea.style.cssText = `
      position: fixed;
      top: ${area.top - window.scrollY}px;
      left: ${area.left - window.scrollX}px;
      width: ${area.width}px;
      height: ${area.height}px;
      z-index: ${this.options.zIndex + 1};
      pointer-events: auto;
    `;
      
      document.body.appendChild(clickArea);
      
      // Remove click area when overlay is hidden
      this.once('hide', () => {
        clickArea.remove();
      });
    }
    
    destroy() {
      if (this.element) {
        this.element.remove();
        this.element = null;
        this.svgElement = null;
        this.highlightElement = null;
      }
      
      const clickArea = document.querySelector('.guided-tour-click-area');
      if (clickArea) {
        clickArea.remove();
      }
      
      this.removeAllListeners();
    }
  }

  class Tooltip extends EventEmitter {
    constructor(options = {}) {
      super();
      
      this.options = {
        position: 'auto',
        maxWidth: 400,
        offset: 10,
        showProgress: true,
        showNavigation: true,
        showClose: true,
        zIndex: 9999,
        viewport: {
          padding: 20 // Minimum distance from viewport edges
        },
        scrollBehavior: 'reposition', // 'reposition', 'hide', 'fixed'
        ...options
      };
      
      this.element = null;
      this.arrowElement = null;
      this.currentPosition = null;
      this.targetElement = null;
      this.scrollHandler = null;
      this.resizeHandler = null;
      this.isVisible = false;
    }
    
    mount() {
      if (this.element) return;
      
      // Create tooltip container
      this.element = document.createElement('div');
      this.element.className = 'guided-tour-tooltip';
      this.element.style.cssText = `
      position: ${this.options.scrollBehavior === 'fixed' ? 'fixed' : 'absolute'};
      max-width: ${this.options.maxWidth}px;
      z-index: ${this.options.zIndex};
      display: none;
      opacity: 0;
    `;
      
      // Create arrow
      this.arrowElement = document.createElement('div');
      this.arrowElement.className = 'guided-tour-tooltip-arrow';
      this.element.appendChild(this.arrowElement);
      
      // Create content container
      const content = document.createElement('div');
      content.className = 'guided-tour-tooltip-content';
      
      // Header with close button
      this.headerElement = document.createElement('div');
      this.headerElement.className = 'guided-tour-tooltip-header';
      
      this.titleElement = document.createElement('h3');
      this.titleElement.className = 'guided-tour-tooltip-title';
      this.headerElement.appendChild(this.titleElement);
      
      if (this.options.showClose) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'guided-tour-tooltip-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close tour');
        closeBtn.addEventListener('click', () => this.emit('close'));
        this.headerElement.appendChild(closeBtn);
      }
      
      content.appendChild(this.headerElement);
      
      // Body
      this.bodyElement = document.createElement('div');
      this.bodyElement.className = 'guided-tour-tooltip-body';
      content.appendChild(this.bodyElement);
      
      // Footer with navigation
      this.footerElement = document.createElement('div');
      this.footerElement.className = 'guided-tour-tooltip-footer';
      
      // Progress indicator
      if (this.options.showProgress) {
        this.progressElement = document.createElement('div');
        this.progressElement.className = 'guided-tour-tooltip-progress';
        this.footerElement.appendChild(this.progressElement);
      }
      
      // Navigation buttons
      if (this.options.showNavigation) {
        const nav = document.createElement('div');
        nav.className = 'guided-tour-tooltip-nav';
        
        this.prevBtn = document.createElement('button');
        this.prevBtn.className = 'guided-tour-btn guided-tour-btn-secondary';
        this.prevBtn.textContent = 'Previous';
        this.prevBtn.addEventListener('click', () => this.emit('previous'));
        nav.appendChild(this.prevBtn);
        
        this.skipBtn = document.createElement('button');
        this.skipBtn.className = 'guided-tour-btn guided-tour-btn-text';
        this.skipBtn.textContent = 'Skip tour';
        this.skipBtn.addEventListener('click', () => this.emit('skip'));
        nav.appendChild(this.skipBtn);
        
        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'guided-tour-btn guided-tour-btn-primary';
        this.nextBtn.textContent = 'Next';
        this.nextBtn.addEventListener('click', () => this.emit('next'));
        nav.appendChild(this.nextBtn);
        
        this.footerElement.appendChild(nav);
      }
      
      content.appendChild(this.footerElement);
      this.element.appendChild(content);
      
      document.body.appendChild(this.element);
      
      // Set up scroll and resize handlers
      this._setupEventHandlers();
    }
    
    _setupEventHandlers() {
      // Use RAF-based scroll handler for smoother animation
      let rafId = null;
      let lastScrollY = window.scrollY;
      
      this.scrollHandler = () => {
        if (!this.isVisible || !this.targetElement) return;
        
        // Cancel previous frame
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        
        rafId = requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = Math.abs(currentScrollY - lastScrollY);
          
          switch (this.options.scrollBehavior) {
            case 'reposition':
              // Use smooth transitions for small scroll movements
              if (scrollDelta < 100) {
                this.element.style.transition = 'top 0.2s cubic-bezier(0.4, 0, 0.2, 1), left 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
              } else {
                this.element.style.transition = 'none';
              }
              this._updatePosition();
              break;
            case 'hide':
              this._checkVisibility();
              break;
          }
          
          lastScrollY = currentScrollY;
          rafId = null;
        });
      };
      
      // Resize handler
      this.resizeHandler = this._debounce(() => {
        if (this.isVisible && this.targetElement) {
          this._updatePosition();
        }
      }, 250);
      
      // Add listeners
      window.addEventListener('scroll', this.scrollHandler, true);
      window.addEventListener('resize', this.resizeHandler);
    }
    
    setContent(data) {
      if (!this.element) return;
      
      // Update title
      if (this.titleElement) {
        this.titleElement.textContent = data.title || '';
      }
      
      // Update body
      if (this.bodyElement) {
        this.bodyElement.innerHTML = data.content || '';
      }
      
      // Update progress
      if (this.progressElement && data.step && data.total) {
        this.progressElement.innerHTML = `
        <span class="guided-tour-tooltip-step">${data.step} of ${data.total}</span>
        <div class="guided-tour-tooltip-progress-bar">
          <div class="guided-tour-tooltip-progress-fill" style="width: ${(data.step / data.total) * 100}%"></div>
        </div>
      `;
      }
      
      // Update navigation buttons
      if (this.prevBtn) {
        this.prevBtn.style.display = data.showPrevious ? 'block' : 'none';
      }
      
      if (this.nextBtn) {
        this.nextBtn.textContent = data.nextLabel || 'Next';
        this.nextBtn.style.display = data.showNext !== false ? 'block' : 'none';
      }
    }
    
    position(targetElement, preferredPosition = 'auto', options = {}) {
      if (!this.element || !targetElement) return;
      
      this.targetElement = targetElement;
      this.preferredPosition = preferredPosition;
      this.positionOptions = options;
      
      this._updatePosition();
    }
    
    _updatePosition() {
      if (!this.element || !this.targetElement) return;
      
      const { 
        offset = this.options.offset, 
        anchorPosition = 'center',
        viewport = { 
          width: window.innerWidth, 
          height: window.innerHeight,
          padding: this.options.viewport.padding
        } 
      } = this.positionOptions;
      
      // Check if target is still in DOM
      if (!document.body.contains(this.targetElement)) {
        this.emit('target-removed');
        return;
      }
      
      // First, make tooltip visible to get accurate dimensions
      this.element.style.visibility = 'hidden';
      this.element.style.display = 'block';
      
      // Get element positions
      const targetRect = this.targetElement.getBoundingClientRect();
      const tooltipRect = this.element.getBoundingClientRect();
      
      // Check if target is visible in viewport
      const targetVisible = (
        targetRect.bottom > 0 &&
        targetRect.top < viewport.height &&
        targetRect.right > 0 &&
        targetRect.left < viewport.width
      );
      
      if (!targetVisible && this.options.scrollBehavior === 'hide') {
        this.element.style.visibility = 'hidden';
        return;
      }
      
      // Calculate available space in each direction
      const space = {
        top: targetRect.top - viewport.padding,
        bottom: viewport.height - targetRect.bottom - viewport.padding,
        left: targetRect.left - viewport.padding,
        right: viewport.width - targetRect.right - viewport.padding
      };
      
      // Determine best position
      let position = this.preferredPosition;
      if (position === 'auto') {
        // Check if tooltip fits in preferred positions
        const positions = ['bottom', 'top', 'right', 'left'];
        const requiredSpace = {
          top: tooltipRect.height + offset,
          bottom: tooltipRect.height + offset,
          left: tooltipRect.width + offset,
          right: tooltipRect.width + offset
        };
        
        // Find the first position where tooltip fits
        position = positions.find(pos => space[pos] >= requiredSpace[pos]) || 'bottom';
      }
      
      // Calculate tooltip position
      let top, left;
      const isFixed = this.options.scrollBehavior === 'fixed';
      
      switch (position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - offset;
          left = this._calculateHorizontalPosition(targetRect, tooltipRect, anchorPosition);
          break;
          
        case 'bottom':
          top = targetRect.bottom + offset;
          left = this._calculateHorizontalPosition(targetRect, tooltipRect, anchorPosition);
          break;
          
        case 'left':
          top = this._calculateVerticalPosition(targetRect, tooltipRect, anchorPosition);
          left = targetRect.left - tooltipRect.width - offset;
          break;
          
        case 'right':
          top = this._calculateVerticalPosition(targetRect, tooltipRect, anchorPosition);
          left = targetRect.right + offset;
          break;
      }
      
      // Add scroll offset for absolute positioning
      if (!isFixed) {
        top += window.scrollY;
        left += window.scrollX;
      }
      
      // Constrain to viewport with padding
      const maxLeft = viewport.width - tooltipRect.width - viewport.padding + (isFixed ? 0 : window.scrollX);
      const maxTop = viewport.height - tooltipRect.height - viewport.padding + (isFixed ? 0 : window.scrollY);
      const minLeft = viewport.padding + (isFixed ? 0 : window.scrollX);
      const minTop = viewport.padding + (isFixed ? 0 : window.scrollY);
      
      // Apply constraints
      left = Math.max(minLeft, Math.min(left, maxLeft));
      top = Math.max(minTop, Math.min(top, maxTop));
      
      // If tooltip would be partially off-screen, adjust position
      if (isFixed) {
        // For fixed positioning, ensure tooltip stays fully visible
        if (top < viewport.padding) {
          position = 'bottom';
          top = targetRect.bottom + offset;
        } else if (top + tooltipRect.height > viewport.height - viewport.padding) {
          position = 'top';
          top = targetRect.top - tooltipRect.height - offset;
        }
      }
      
      // Apply position
      this.element.style.position = isFixed ? 'fixed' : 'absolute';
      this.element.style.top = `${top}px`;
      this.element.style.left = `${left}px`;
      this.element.style.visibility = 'visible';
      
      // Update class for styling
      this.element.className = `guided-tour-tooltip guided-tour-tooltip-${position}`;
      this.currentPosition = position;
      
      // Position arrow
      this._positionArrow(targetRect, position, { top, left });
    }
    
    _checkVisibility() {
      if (!this.targetElement) return;
      
      const rect = this.targetElement.getBoundingClientRect();
      const inViewport = (
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth
      );
      
      if (!inViewport) {
        this.element.style.opacity = '0';
        setTimeout(() => {
          if (this.element && !inViewport) {
            this.element.style.visibility = 'hidden';
          }
        }, 300);
      } else {
        this.element.style.visibility = 'visible';
        this.element.style.opacity = '1';
      }
    }
    
    _calculateHorizontalPosition(targetRect, tooltipRect, anchorPosition) {
      switch (anchorPosition) {
        case 'start':
          return targetRect.left;
        case 'end':
          return targetRect.right - tooltipRect.width;
        case 'center':
        default:
          return targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      }
    }
    
    _calculateVerticalPosition(targetRect, tooltipRect, anchorPosition) {
      switch (anchorPosition) {
        case 'start':
          return targetRect.top;
        case 'end':
          return targetRect.bottom - tooltipRect.height;
        case 'center':
        default:
          return targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      }
    }
    
    _positionArrow(targetRect, position, tooltipPos) {
      if (!this.arrowElement) return;
      
      const tooltipRect = this.element.getBoundingClientRect();
      const isFixed = this.options.scrollBehavior === 'fixed';
      let arrowStyle = '';
      
      switch (position) {
        case 'top':
        case 'bottom':
          // Calculate arrow horizontal position
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const tooltipLeft = tooltipPos.left - (isFixed ? 0 : window.scrollX);
          const arrowLeft = Math.max(
            15, 
            Math.min(
              targetCenterX - tooltipLeft, 
              tooltipRect.width - 15
            )
          );
          arrowStyle = `left: ${arrowLeft}px;`;
          break;
          
        case 'left':
        case 'right':
          // Calculate arrow vertical position
          const targetCenterY = targetRect.top + targetRect.height / 2;
          const tooltipTop = tooltipPos.top - (isFixed ? 0 : window.scrollY);
          const arrowTop = Math.max(
            15, 
            Math.min(
              targetCenterY - tooltipTop, 
              tooltipRect.height - 15
            )
          );
          arrowStyle = `top: ${arrowTop}px;`;
          break;
      }
      
      this.arrowElement.style.cssText = arrowStyle;
    }
    
    async show() {
      if (!this.element) return;
      
      this.isVisible = true;
      this.element.style.display = 'block';
      this.element.offsetHeight; // Force reflow
      
      // Update position one more time to ensure accuracy
      if (this.targetElement) {
        this._updatePosition();
      }
      
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          this.element.style.opacity = '1';
          this.element.classList.add('guided-tour-tooltip-visible');
          setTimeout(resolve, 300);
        });
      });
    }
    
    async hide() {
      if (!this.element) return;
      
      this.isVisible = false;
      this.element.style.opacity = '0';
      this.element.classList.remove('guided-tour-tooltip-visible');
      
      return new Promise(resolve => {
        setTimeout(() => {
          this.element.style.display = 'none';
          this.targetElement = null;
          resolve();
        }, 300);
      });
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
    
    _debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
    
    destroy() {
      // Remove event listeners
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler, true);
      }
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
      
      if (this.element) {
        this.element.remove();
        this.element = null;
        this.arrowElement = null;
        this.targetElement = null;
      }
      
      this.removeAllListeners();
    }
  }

  class ToggleButton extends EventEmitter {
    constructor(options = {}) {
      super();
      
      this.options = {
        enabled: true,
        position: 'bottom-right',
        offset: 20,
        text: '?',
        showBadge: true,
        zIndex: 9997,
        ...options
      };
      
      this.element = null;
      this.isActive = false;
    }
    
    mount() {
      if (this.element || !this.options.enabled) return;
      
      // Create toggle button
      this.element = document.createElement('button');
      this.element.className = 'guided-tour-toggle';
      this.element.setAttribute('aria-label', 'Toggle guided tour');
      this.element.style.zIndex = this.options.zIndex;
      
      // Set position
      this._setPosition();
      
      // Add content
      const content = document.createElement('span');
      content.className = 'guided-tour-toggle-content';
      content.textContent = this.options.text;
      this.element.appendChild(content);
      
      // Add badge if enabled
      if (this.options.showBadge) {
        this.badgeElement = document.createElement('span');
        this.badgeElement.className = 'guided-tour-toggle-badge';
        this.element.appendChild(this.badgeElement);
      }
      
      // Add click handler
      this.element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.emit('click');
      });
      
      // Add to DOM
      document.body.appendChild(this.element);
      
      // Animate in
      setTimeout(() => {
        this.element.classList.add('guided-tour-toggle-visible');
      }, 100);
    }
    
    _setPosition() {
      if (!this.element) return;
      
      const positions = {
        'top-left': {
          top: `${this.options.offset}px`,
          left: `${this.options.offset}px`,
          right: 'auto',
          bottom: 'auto'
        },
        'top-right': {
          top: `${this.options.offset}px`,
          right: `${this.options.offset}px`,
          left: 'auto',
          bottom: 'auto'
        },
        'bottom-left': {
          bottom: `${this.options.offset}px`,
          left: `${this.options.offset}px`,
          right: 'auto',
          top: 'auto'
        },
        'bottom-right': {
          bottom: `${this.options.offset}px`,
          right: `${this.options.offset}px`,
          left: 'auto',
          top: 'auto'
        }
      };
      
      const pos = positions[this.options.position] || positions['bottom-right'];
      Object.assign(this.element.style, pos);
    }
    
    setActive(active) {
      if (!this.element) return;
      
      this.isActive = active;
      
      if (active) {
        this.element.classList.add('guided-tour-toggle-active');
        this.hideBadge();
      } else {
        this.element.classList.remove('guided-tour-toggle-active');
      }
    }
    
    showBadge() {
      if (this.badgeElement) {
        this.badgeElement.style.display = 'block';
      }
    }
    
    hideBadge() {
      if (this.badgeElement) {
        this.badgeElement.style.display = 'none';
      }
    }
    
    show() {
      if (!this.element) return;
      
      this.element.style.display = 'block';
      setTimeout(() => {
        this.element.classList.add('guided-tour-toggle-visible');
      }, 10);
    }
    
    hide() {
      if (!this.element) return;
      
      this.element.classList.remove('guided-tour-toggle-visible');
      setTimeout(() => {
        this.element.style.display = 'none';
      }, 300);
    }
    
    destroy() {
      if (this.element) {
        this.element.classList.remove('guided-tour-toggle-visible');
        setTimeout(() => {
          if (this.element) {
            this.element.remove();
            this.element = null;
            this.badgeElement = null;
          }
        }, 300);
      }
      
      this.removeAllListeners();
    }
  }

  class Animator {
    constructor(options = {}) {
      this.options = {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        ...options
      };
    }
    
    async fadeIn(element, duration = this.options.duration) {
      element.style.opacity = '0';
      element.style.display = 'block';
      element.style.transition = `opacity ${duration}ms ${this.options.easing}`;
      
      // Force reflow
      element.offsetHeight;
      
      element.style.opacity = '1';
      
      return new Promise(resolve => {
        setTimeout(resolve, duration);
      });
    }
    
    async fadeOut(element, duration = this.options.duration) {
      element.style.transition = `opacity ${duration}ms ${this.options.easing}`;
      element.style.opacity = '0';
      
      return new Promise(resolve => {
        setTimeout(() => {
          element.style.display = 'none';
          resolve();
        }, duration);
      });
    }
    
    async slideIn(element, direction = 'bottom', duration = this.options.duration) {
      const transforms = {
        top: 'translateY(-30px)',
        bottom: 'translateY(30px)',
        left: 'translateX(-30px)',
        right: 'translateX(30px)'
      };
      
      element.style.opacity = '0';
      element.style.transform = transforms[direction];
      element.style.display = 'block';
      element.style.transition = `all ${duration}ms ${this.options.easing}`;
      
      // Force reflow
      element.offsetHeight;
      
      element.style.opacity = '1';
      element.style.transform = 'translate(0)';
      
      return new Promise(resolve => {
        setTimeout(resolve, duration);
      });
    }
    
    async slideOut(element, direction = 'bottom', duration = this.options.duration) {
      const transforms = {
        top: 'translateY(-30px)',
        bottom: 'translateY(30px)',
        left: 'translateX(-30px)',
        right: 'translateX(30px)'
      };
      
      element.style.transition = `all ${duration}ms ${this.options.easing}`;
      element.style.opacity = '0';
      element.style.transform = transforms[direction];
      
      return new Promise(resolve => {
        setTimeout(() => {
          element.style.display = 'none';
          element.style.transform = '';
          resolve();
        }, duration);
      });
    }
    
    async scale(element, from = 0.8, to = 1, duration = this.options.duration) {
      element.style.transform = `scale(${from})`;
      element.style.opacity = '0';
      element.style.display = 'block';
      element.style.transition = `all ${duration}ms ${this.options.easing}`;
      
      // Force reflow
      element.offsetHeight;
      
      element.style.opacity = '1';
      element.style.transform = `scale(${to})`;
      
      return new Promise(resolve => {
        setTimeout(resolve, duration);
      });
    }
    
    async bounce(element, duration = 600) {
      element.style.animation = `bounceIn ${duration}ms ${this.options.easing}`;
      
      return new Promise(resolve => {
        setTimeout(() => {
          element.style.animation = '';
          resolve();
        }, duration);
      });
    }
    
    async shake(element, duration = 500) {
      element.style.animation = `shake ${duration}ms`;
      
      return new Promise(resolve => {
        setTimeout(() => {
          element.style.animation = '';
          resolve();
        }, duration);
      });
    }
    
    async flip(element, duration = 600) {
      element.style.animation = `flip ${duration}ms ${this.options.easing}`;
      
      return new Promise(resolve => {
        setTimeout(() => {
          element.style.animation = '';
          resolve();
        }, duration);
      });
    }
    
    pulse(element, duration = 2000) {
      element.style.animation = `pulse ${duration}ms infinite`;
    }
    
    glow(element, duration = 3000) {
      element.style.animation = `glow ${duration}ms ease-in-out infinite`;
    }
    
    float(element, duration = 3000) {
      element.style.animation = `float ${duration}ms ease-in-out infinite`;
    }
    
    stopAnimation(element) {
      element.style.animation = '';
    }
    
    // Stagger animation for multiple elements
    async staggerIn(elements, delay = 100, animationType = 'fadeIn') {
      const animations = [];
      
      elements.forEach((element, index) => {
        setTimeout(() => {
          animations.push(this[animationType](element));
        }, index * delay);
      });
      
      return Promise.all(animations);
    }
    
    // Smooth scroll to element
    async scrollTo(element, options = {}) {
      const {
        behavior = 'smooth',
        block = 'center',
        inline = 'center',
        duration = 500
      } = options;
      
      element.scrollIntoView({ behavior, block, inline });
      
      return new Promise(resolve => {
        setTimeout(resolve, duration);
      });
    }
  }

  class SmoothScroll {
    constructor(options = {}) {
      this.options = {
        duration: 800,
        easing: 'easeInOutCubic',
        offset: 0,
        ...options
      };
      
      // Easing functions
      this.easings = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInQuart: t => t * t * t * t,
        easeOutQuart: t => 1 - (--t) * t * t * t,
        easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        easeInQuint: t => t * t * t * t * t,
        easeOutQuint: t => 1 + (--t) * t * t * t * t,
        easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
        easeOutElastic: t => {
          const p = 0.3;
          return t === 0 ? 0 : t === 1 ? 1 : 
            Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
        },
        easeOutBack: t => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
      };
    }
    
    scrollTo(target, options = {}) {
      const settings = { ...this.options, ...options };
      
      return new Promise((resolve) => {
        // Get target element and position
        const targetElement = typeof target === 'string' 
          ? document.querySelector(target) 
          : target;
          
        if (!targetElement) {
          resolve(false);
          return;
        }
        
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition - settings.offset;
        const startTime = performance.now();
        const easing = this.easings[settings.easing] || this.easings.easeInOutCubic;
        
        // Handle instant scroll
        if (settings.duration === 0) {
          window.scrollTo(0, targetPosition - settings.offset);
          resolve(true);
          return;
        }
        
        const scroll = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / settings.duration, 1);
          const easedProgress = easing(progress);
          
          window.scrollTo(0, startPosition + (distance * easedProgress));
          
          if (progress < 1) {
            requestAnimationFrame(scroll);
          } else {
            // Ensure we end at exact position
            window.scrollTo(0, targetPosition - settings.offset);
            resolve(true);
          }
        };
        
        requestAnimationFrame(scroll);
      });
    }
    
    scrollToTop(options = {}) {
      return this.scrollTo(document.body, { ...options, offset: 0 });
    }
    
    scrollToBottom(options = {}) {
      const offset = document.body.scrollHeight - window.innerHeight;
      return new Promise((resolve) => {
        window.scrollTo({
          top: offset,
          behavior: 'smooth'
        });
        setTimeout(() => resolve(true), this.options.duration);
      });
    }
  }

  class TransitionManager {
    constructor(options = {}) {
      this.options = {
        duration: 400,
        overlap: 0.2, // How much animations overlap (0-1)
        ...options
      };
      
      this.activeTransitions = new Set();
    }
    
    async transition(fromElement, toElement, actions) {
      const transitionId = Date.now();
      this.activeTransitions.add(transitionId);
      
      try {
        const {
          hideFrom,
          showTo,
          beforeTransition,
          afterTransition
        } = actions;
        
        // Call before transition hook
        if (beforeTransition) {
          await beforeTransition();
        }
        
        // Calculate timing
        const hideDuration = this.options.duration * (1 - this.options.overlap);
        const showDelay = this.options.duration * this.options.overlap;
        
        // Start hide animation
        const hidePromise = hideFrom ? hideFrom() : Promise.resolve();
        
        // Start show animation with slight overlap
        const showPromise = new Promise(async (resolve) => {
          await this.delay(showDelay);
          if (showTo) {
            await showTo();
          }
          resolve();
        });
        
        // Wait for both animations
        await Promise.all([hidePromise, showPromise]);
        
        // Call after transition hook
        if (afterTransition) {
          await afterTransition();
        }
      } finally {
        this.activeTransitions.delete(transitionId);
      }
    }
    
    async smoothTransition(actions) {
      const {
        prepare,
        execute,
        complete
      } = actions;
      
      // Prepare phase - instant
      if (prepare) {
        await prepare();
      }
      
      // Execute phase - animated
      await new Promise(async (resolve) => {
        requestAnimationFrame(async () => {
          if (execute) {
            await execute();
          }
          
          // Wait for animations to complete
          await this.delay(this.options.duration);
          
          // Complete phase
          if (complete) {
            await complete();
          }
          
          resolve();
        });
      });
    }
    
    async chainTransitions(transitions) {
      for (const transition of transitions) {
        await this.smoothTransition(transition);
        
        // Small delay between chained transitions
        await this.delay(100);
      }
    }
    
    async parallelTransitions(transitions) {
      const promises = transitions.map(transition => 
        this.smoothTransition(transition)
      );
      
      await Promise.all(promises);
    }
    
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Cubic bezier easing function
    cubicBezier(t, p1x, p1y, p2x, p2y) {
      const cx = 3 * p1x;
      const bx = 3 * (p2x - p1x) - cx;
      const ax = 1 - cx - bx;
      
      const cy = 3 * p1y;
      const by = 3 * (p2y - p1y) - cy;
      const ay = 1 - cy - by;
      
      const sampleCurveX = (t) => ((ax * t + bx) * t + cx) * t;
      const sampleCurveY = (t) => ((ay * t + by) * t + cy) * t;
      let currentT = t;
      let currentX;
      
      for (let i = 0; i < 8; i++) {
        currentX = sampleCurveX(currentT) - t;
        if (Math.abs(currentX) < 0.001) break;
        
        const currentSlope = (3 * ax * currentT + 2 * bx) * currentT + cx;
        if (Math.abs(currentSlope) < 0.001) break;
        
        currentT -= currentX / currentSlope;
      }
      
      return sampleCurveY(currentT);
    }
    
    // Smooth step interpolation
    smoothStep(from, to, progress, easingParams = [0.25, 0.46, 0.45, 0.94]) {
      const easedProgress = this.cubicBezier(progress, ...easingParams);
      return from + (to - from) * easedProgress;
    }
    
    // Cancel all active transitions
    cancelAll() {
      this.activeTransitions.clear();
    }
  }

  const defaultOptions = {
    id: 'default-tour',
    steps: [],
    
    theme: 'light', // 'light', 'dark', 'minimal', 'minimal-dark', 'neon'
    
    animation: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out'
    },
    
    overlay: {
      enabled: true,
      opacity: 0.5,
      color: '#000000',
      clickToClose: true,
      zIndex: 9998
    },
    
    highlight: {
      padding: 8,
      borderRadius: 4,
      shape: 'rectangle', // rectangle, circle, auto
      pulse: true
    },
    
    tooltip: {
      position: 'auto', // auto, top, bottom, left, right
      anchorPosition: 'center', // center, start, end
      maxWidth: 400,
      offset: 10,
      showProgress: true,
      showNavigation: true,
      showClose: true,
      zIndex: 9999,
      viewport: {
        padding: 20 // Minimum distance from viewport edges
      },
      scrollBehavior: 'reposition' // 'reposition', 'hide', 'fixed'
    },
    
    toggle: {
      enabled: true,
      position: 'bottom-right', // top-left, top-right, bottom-left, bottom-right
      offset: 20,
      text: '?',
      showBadge: true,
      zIndex: 9997
    },
    
    keyboard: {
      enabled: true,
      next: 'ArrowRight',
      previous: 'ArrowLeft',
      close: 'Escape'
    },
    
    persistence: {
      enabled: true,
      key: 'guided-tour-state',
      rememberCompleted: true
    },
    
    accessibility: {
      announceSteps: true,
      focusRestore: true,
      trapFocus: true
    },
    
    scroll: {
      duration: 800,
      easing: 'easeInOutCubic',
      offset: 0
    }
  };

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
        if (this.isActive && this.currentStepIndex >= 0) ;
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
        rect.top + window.scrollY + (rect.height / 2);
        const viewportCenter = window.innerHeight / 2;
        
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

  exports.GuidedTour = GuidedTour;
  exports.default = GuidedTour;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
