# Guided Tour Web Application

A lightweight, customizable JavaScript library for creating interactive guided tours in web applications. Perfect for user onboarding, feature discovery, and contextual help.

## Features

- 🎯 **Smart Element Targeting** - Target any HTML element using CSS selectors
- ✨ **Smooth Animations** - Beautiful transitions and highlight effects
- 🎨 **Multiple Themes** - Light, dark, minimal, and neon themes with full customization
- 📱 **Mobile Responsive** - Works perfectly on all devices
- ⚡ **Lightweight** - No dependencies, minimal footprint
- ♿ **Accessible** - Keyboard navigation and screen reader support
- 🔧 **Easy Integration** - Simple API with extensive configuration options
- 📍 **Smart Positioning** - Tooltips stay in viewport with customizable anchoring
- 📜 **Scroll Behaviors** - Reposition, hide, or fix tooltips during scroll
- ⬜ **Minimal Mode** - Clean, distraction-free tours without animations

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/guided-tour.git

# Install dependencies
npm install

# Build the library
npm run build

# Start demo server
npm run serve
```

Then open http://localhost:8080/demo in your browser.

### Basic Usage

```javascript
// Create a tour
const tour = new GuidedTour({
  steps: [
    {
      element: '#welcome-button',
      title: 'Welcome!',
      content: 'Click this button to get started',
      position: 'bottom'
    },
    {
      element: '.search-box',
      title: 'Search Feature',
      content: 'Find anything quickly with our search',
      position: 'top'
    }
  ]
});

// Start the tour
tour.start();
```

## API Reference

### Constructor Options

```javascript
new GuidedTour({
  // Tour configuration
  id: 'my-tour',              // Unique tour identifier
  steps: [...],               // Array of tour steps
  
  // Theme
  theme: 'light',             // 'light', 'dark', 'minimal', 'minimal-dark', 'neon'
  
  // Animation settings
  animation: {
    enabled: true,
    duration: 300,
    easing: 'ease-in-out'
  },
  
  // Overlay settings
  overlay: {
    enabled: true,
    opacity: 0.5,
    color: '#000000',
    clickToClose: true
  },
  
  // Highlight settings
  highlight: {
    padding: 8,
    borderRadius: 4,
    shape: 'rectangle',     // 'rectangle', 'circle', 'auto'
    pulse: true
  },
  
  // Tooltip settings
  tooltip: {
    position: 'auto',       // 'auto', 'top', 'bottom', 'left', 'right'
    maxWidth: 400,
    offset: 10,
    showProgress: true,
    showNavigation: true,
    showClose: true
  },
  
  // Toggle button settings
  toggle: {
    enabled: true,
    position: 'bottom-right',
    offset: 20,
    text: '?',
    showBadge: true
  },
  
  // Persistence
  persistence: {
    enabled: true,
    key: 'guided-tour-state',
    rememberCompleted: true
  }
});
```

### Methods

```javascript
tour.start()           // Start the tour
tour.stop()            // Stop the tour
tour.pause()           // Pause the tour
tour.resume()          // Resume the tour
tour.next()            // Go to next step
tour.previous()        // Go to previous step
tour.goToStep(index)   // Jump to specific step
tour.destroy()         // Clean up and remove tour
```

### Events

```javascript
tour.on('start', (data) => {
  console.log('Tour started', data);
});

tour.on('complete', (data) => {
  console.log('Tour completed', data);
});

tour.on('stepChange', (data) => {
  console.log('Step changed', data);
});

tour.on('skip', (data) => {
  console.log('Tour skipped', data);
});

tour.on('error', (error) => {
  console.error('Tour error', error);
});
```

### Step Configuration

Each step in the tour can have the following properties:

```javascript
{
  element: '#my-element',     // CSS selector for target element (required)
  title: 'Step Title',        // Title text (required)
  content: 'Step content',    // Content HTML/text (required)
  position: 'auto',           // Tooltip position
  padding: 10,                // Highlight padding
  shape: 'rectangle',         // Highlight shape
  onEnter: () => {},          // Callback when step is shown
  onExit: () => {}            // Callback when step is hidden
}
```

## Advanced Usage

### Theme Options

```javascript
// Minimal theme - no animations, clean design
const minimalTour = new GuidedTour({
  theme: 'minimal',
  steps: [...],
  animation: {
    enabled: false
  }
});

// Dark minimal theme
const darkMinimalTour = new GuidedTour({
  theme: 'minimal-dark',
  steps: [...]
});

// Neon theme - cyberpunk style with glowing effects
const neonTour = new GuidedTour({
  theme: 'neon',
  steps: [...]
});

// Custom theme
const style = document.createElement('style');
style.textContent = `
  .guided-tour-tooltip {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .guided-tour-tooltip-arrow {
    background: #667eea;
  }
`;
document.head.appendChild(style);

const customTour = new GuidedTour({
  theme: 'custom',
  steps: [...]
});
```

### Conditional Steps

```javascript
const steps = [
  {
    element: '#feature',
    title: 'Premium Feature',
    content: 'This feature is available for premium users',
    onEnter: () => {
      // Check if user has access
      if (!user.isPremium) {
        tour.next(); // Skip this step
      }
    }
  }
];
```

### Dynamic Content

```javascript
const tour = new GuidedTour({
  steps: [
    {
      element: '#profile',
      title: `Welcome, ${user.name}!`,
      content: `You have ${user.notifications} new notifications`,
      position: 'bottom'
    }
  ]
});
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting PRs.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with ❤️ for creating better user experiences.