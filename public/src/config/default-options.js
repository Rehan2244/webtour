export const defaultOptions = {
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
  
  audio: {
    enabled: true,
    autoPlay: false,
    showControls: true,
    showProgress: true,
    showDuration: true,
    showVolumeControl: true,
    showPlaybackSpeed: true,
    playbackSpeeds: [0.5, 0.75, 1, 1.25, 1.5, 2],
    defaultVolume: 0.7,
    theme: 'light' // 'light', 'dark'
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