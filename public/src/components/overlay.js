import { EventEmitter } from '../utils/event-emitter.js';

export class Overlay extends EventEmitter {
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