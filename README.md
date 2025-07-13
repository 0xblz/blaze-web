# blaze.design

## Tech Stack

- **Jekyll** - Static site generator
- **SCSS** - Advanced CSS with custom animations
- **Vanilla JavaScript** - Interactive effects and animations
- **GitHub Pages** - Deployment platform

## Local Development

### Prerequisites

- Ruby (version 2.7 or higher)
- Bundler gem

### Setup

1. Clone the repository:
```bash
git clone https://github.com/0xblz/blaze-web.git
cd blaze-web
```

2. Install dependencies:
```bash
bundle install
```

3. Run the development server:
```bash
bundle exec jekyll serve
```

4. Open your browser and navigate to `http://localhost:4000`

### Building for Production

```bash
bundle exec jekyll build
```

The generated site will be in the `_site/` directory.

## Customization

### Colors
The interactive background generates dynamic colors using split-complementary color schemes. The color generation algorithm considers user's dark/light mode preference and applies appropriate filters.

### Animations
Custom animations are defined in `_sass/_animations.scss` and controlled by the JavaScript in `assets/js/bg.js`.

### Content
Update the main content in `index.html` and experience/project information in the same file.

## Interactive Features

- **Dynamic Color Generation**: Colors change on every click using split-complementary color theory
- **Mouse Tracking**: Crosshair grid follows cursor movement
- **Click Effects**: Ripple animations and floating star effects
- **Responsive Animations**: Smooth transitions and backdrop blur effects

## Deployment

This site is configured for GitHub Pages deployment with a custom domain. The `CNAME` file contains the domain configuration.

## Contact

- Website: [blaze.design](https://blaze.design)
- Twitter: [@0xblz](https://x.com/0xblz)

## AI Development Notes

### Code Organization
- **SCSS Structure**: Uses partials system with `_variables.scss`, `_layout.scss`, `_animations.scss`, etc. Main styles imported in `assets/css/main.scss`
- **JavaScript**: Single file `assets/js/bg.js` handles all interactive features - color generation, mouse tracking, click effects
- **Layout**: Uses Jekyll's `_layouts/default.html` template system

### Key Implementation Details
- **Color System**: Uses split-complementary color theory with HSL to hex conversion
- **Interactive Elements**: Mouse tracking creates crosshair grid, click events trigger color changes + animations
- **CSS Variables**: Colors and positions set dynamically via `document.documentElement.style.setProperty()`
- **Animations**: Custom CSS keyframes for ripple effects and star animations injected via JavaScript
- **Responsive**: Handles dark/light mode preferences and different browser behaviors (Chrome scroll adjustments)

### Development Patterns
- **Modular Functions**: Each feature (color generation, grid tracking, effects) in separate functions
- **Event-Driven**: Uses DOM event listeners for mouse movement and clicks
- **Performance**: Uses `transform: translateZ(0)` for GPU acceleration, `will-change` properties
- **Cross-Browser**: Includes Chrome-specific fixes for scroll behavior and line positioning

### File Structure Context
- `_config.yml`: Jekyll configuration, collections, and plugins
- `index.html`: Main content with portfolio information and experience timeline
- `_sass/_layout.scss`: Core layout styles with glassmorphism effects and responsive design
- `assets/js/bg.js`: All interactive JavaScript functionality
- `_site/`: Generated Jekyll output (ignored in development) 