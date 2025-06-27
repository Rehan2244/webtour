export class TransitionManager {
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
    
    // Newton-Raphson method for finding t given x
    let intervalStart = 0;
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