import { EventEmitter } from '../utils/event-emitter.js';

export class ToggleButton extends EventEmitter {
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