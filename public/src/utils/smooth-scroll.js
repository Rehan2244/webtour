export class SmoothScroll {
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