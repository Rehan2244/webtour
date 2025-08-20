# React Guided Tour Library

A reusable guided tour library that can be integrated into any web application, built with React and HeroUI.

## Installation

### Using NPM/Yarn (React Apps)
```bash
npm install react-guided-tour-lib
# or
yarn add react-guided-tour-lib
```

### Using CDN (Non-React Apps)
```html
<!-- React and React-DOM (required) -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- React Guided Tour -->
<link rel="stylesheet" href="path/to/react-guided-tour.css">
<script src="path/to/react-guided-tour.umd.js"></script>
```

## Usage

### In React Applications

```jsx
import { GuidedTour, HeroUIProvider } from 'react-guided-tour-lib';
import 'react-guided-tour-lib/dist/react-guided-tour.css';

const steps = [
  {
    selector: '#step1',
    title: 'Welcome!',
    content: 'This is the first step of the tour.'
  },
  {
    selector: '#step2',
    title: 'Features',
    content: 'Here are some amazing features.'
  }
];

function App() {
  return (
    <HeroUIProvider>
      <GuidedTour
        steps={steps}
        autoStart={true}
        theme="light"
        options={{
          storageKey: 'myAppTour',
          onComplete: () => console.log('Tour completed!'),
          onSkip: () => console.log('Tour skipped!')
        }}
      >
        <YourAppContent />
      </GuidedTour>
    </HeroUIProvider>
  );
}
```

### With Custom Tooltip

```jsx
import { GuidedTour, HeroUIProvider } from 'react-guided-tour-lib';
import MyCustomTooltip from './MyCustomTooltip';

function App() {
  return (
    <HeroUIProvider>
      <GuidedTour
        steps={steps}
        customTooltip={<MyCustomTooltip />}
      >
        <YourAppContent />
      </GuidedTour>
    </HeroUIProvider>
  );
}
```

### In Non-React Applications

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="path/to/react-guided-tour.css">
</head>
<body>
  <div id="app">
    <button id="step1">Start Here</button>
    <div id="step2">Feature Section</div>
  </div>

  <script src="path/to/react-guided-tour.umd.js"></script>
  <script>
    // Define tour steps
    const steps = [
      {
        selector: '#step1',
        title: 'Welcome!',
        content: 'Click this button to get started.'
      },
      {
        selector: '#step2',
        title: 'Features',
        content: 'This section contains important features.'
      }
    ];

    // Initialize the tour
    const tour = window.ReactGuidedTour.init({
      steps: steps,
      targetElement: document.body,
      autoStart: true,
      theme: 'light',
      showToggleButton: true,
      options: {
        storageKey: 'myAppTour',
        onComplete: () => console.log('Tour completed!'),
        onSkip: () => console.log('Tour skipped!')
      }
    });

    // Programmatic control
    document.getElementById('startTourBtn').addEventListener('click', () => {
      tour.start();
    });

    document.getElementById('resetTourBtn').addEventListener('click', () => {
      tour.reset();
    });

    // Cleanup when needed
    // tour.destroy();
  </script>
</body>
</html>
```

## API Reference

### GuidedTour Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | Array | required | Array of step objects |
| `options` | Object | {} | Tour configuration options |
| `theme` | 'light' \| 'dark' | 'light' | Color theme |
| `autoStart` | boolean | false | Start tour automatically |
| `showToggleButton` | boolean | true | Show the toggle button |
| `customTooltip` | React.Element | null | Custom tooltip component |

### Step Object

```typescript
{
  selector: string;      // CSS selector for target element
  title: string;         // Step title
  content: string;       // Step description
  media?: {             // Optional media
    type: 'image' | 'video';
    url: string;
    alt?: string;
  };
}
```

### Options Object

```typescript
{
  storageKey?: string;           // LocalStorage key for state
  onComplete?: () => void;       // Tour completion callback
  onSkip?: () => void;          // Tour skip callback
  onStepChange?: (step) => void; // Step change callback
  startDelay?: number;           // Delay before starting (ms)
  overlayPadding?: number;       // Padding around highlighted element
  overlayBorderRadius?: number;  // Border radius for highlight
  toggleButtonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}
```

### Custom Tooltip Props

Your custom tooltip component will receive these props:

```typescript
{
  step: StepObject;
  currentStep: number;
  totalSteps: number;
  progress: number;        // 0-100
  isFirstStep: boolean;
  isLastStep: boolean;
  targetRect: DOMRect;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  goToStep: (index: number) => void;
  theme: 'light' | 'dark';
}
```

## Features

- 🎯 **Smart Positioning** - Tooltips automatically adjust based on viewport
- ⌨️ **Keyboard Navigation** - Arrow keys and ESC support
- 💾 **State Persistence** - Remembers tour completion
- 🎨 **Customizable** - Full control over styling and behavior
- 📱 **Responsive** - Works on all screen sizes
- 🌈 **Animations** - Smooth transitions with Framer Motion
- 🎭 **Theme Support** - Light and dark themes
- 🔧 **Framework Agnostic** - Use in any web application

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT