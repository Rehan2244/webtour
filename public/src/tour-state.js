export class TourState {
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