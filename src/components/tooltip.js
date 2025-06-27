import { EventEmitter } from '../utils/event-emitter.js';

export class Tooltip extends EventEmitter {
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
          case 'fixed':
            // Fixed positioning doesn't need updates
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