export class Animator {
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