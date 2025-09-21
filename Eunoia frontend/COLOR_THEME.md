# Eunoia System Color Theme Documentation

## Overview
This document defines the default color theme and design system specifications for the entire Eunoia application. All components should follow these guidelines to maintain visual consistency and brand identity.

## Primary Color Palette

### Main Colors
- **Primary Color**: `#00B3B0` (Teal)
- **Primary Dark**: `#00A3A0` (Darker Teal for hover states)
- **Primary Light**: `rgba(0, 179, 176, 0.1)` (Light teal for backgrounds)

### Secondary Colors
- **Background**: `#f8f9fa` (Light gray)
- **Surface**: `#ffffff` (White)
- **Border**: `#e2e8f0` (Light gray border)
- **Text Primary**: `#333333` (Dark gray)
- **Text Secondary**: `#666666` (Medium gray)
- **Text Muted**: `#a0aec0` (Light gray)

### Status Colors
- **Success**: `#4caf50` (Green)
- **Warning**: `#ff9800` (Orange)
- **Error**: `#f44336` (Red)
- **Info**: `#2196f3` (Blue)

## Component-Specific Guidelines

### Headers and Navigation
```css
background: linear-gradient(135deg, #00B3B0 0%, #00A3A0 100%);
color: white;
padding: 20px;
border-radius: 8px 8px 0 0;
```

### Dropdowns and Form Elements
```css
/* Dropdown in header (semi-transparent) */
background: rgba(255, 255, 255, 0.9);
border: 1px solid rgba(255, 255, 255, 0.3);
color: #333;
border-radius: 6px;

/* Focus state */
border-color: rgba(255, 255, 255, 1);
box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);

/* Regular form elements */
background: white;
border: 1px solid #e2e8f0;
color: #333;

/* Focus state */
border-color: #00B3B0;
box-shadow: 0 0 0 2px rgba(0, 179, 176, 0.1);
```

### Search Boxes
```css
/* Container */
position: relative;

/* Icon */
color: #00B3B0;
font-size: 14px;
left: 12px;

/* Input */
padding: 10px 12px 10px 35px;
border: 1px solid #e2e8f0;
border-radius: 6px;
font-size: 14px;

/* Focus state */
border-color: #00B3B0;
box-shadow: 0 0 0 2px rgba(0, 179, 176, 0.1);

/* Placeholder */
color: #a0aec0;
```

### Loading Indicators
```css
/* Container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

/* Spinner */
.loading-spinner {
  font-size: 2rem;
  color: #00B3B0;
  margin-bottom: 15px;
  animation: spin 1s linear infinite;
}

/* Text */
.loading-text {
  font-size: 1rem;
  color: #666;
  font-weight: 600;
  margin: 0;
}

/* Animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Buttons
```css
/* Primary Button */
background: #00B3B0;
color: white;
border: none;
padding: 8px 16px;
border-radius: 6px;
transition: background-color 0.3s ease;

/* Hover state */
background: #00A3A0;

/* Secondary Button */
background: rgba(0, 179, 176, 0.1);
color: #00B3B0;
border: 1px solid #00B3B0;

/* Hover state */
background: rgba(0, 179, 176, 0.2);
```

### Tables
```css
/* Header */
background: #f8f9fa;
color: #333;
font-weight: 600;
border-bottom: 2px solid #dee2e6;

/* Rows */
border-bottom: 1px solid #eee;

/* Hover state */
background-color: #f8f9fa;

/* Links/IDs */
color: #00B3B0;
font-weight: 600;
```

### Cards and Containers
```css
/* Card */
background: white;
border-radius: 12px;
box-shadow: 0 4px 15px rgba(0,0,0,0.08);

/* Container */
background: #f8f9fa;
border-radius: 8px;
```

## CSS Variables Implementation

### Root Variables
```css
:root {
  --primary: #00B3B0;
  --primary-dark: #00A3A0;
  --primary-light: rgba(0, 179, 176, 0.1);
  --background: #f8f9fa;
  --surface: #ffffff;
  --border: #e2e8f0;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #a0aec0;
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --info: #2196f3;
}
```

### Usage Examples
```css
/* Using variables */
background: var(--primary);
color: var(--text-primary);
border: 1px solid var(--border);
```

## Responsive Design Guidelines

### Mobile Breakpoints
```css
@media (max-width: 768px) {
  /* Adjust padding and spacing */
  padding: 15px;
  font-size: 14px;
  
  /* Stack elements vertically */
  flex-direction: column;
  gap: 15px;
}
```

## Accessibility Guidelines

### Color Contrast
- Ensure minimum contrast ratio of 4.5:1 for normal text
- Ensure minimum contrast ratio of 3:1 for large text
- Primary color `#00B3B0` on white background meets WCAG AA standards

### Focus States
- Always provide visible focus indicators
- Use consistent focus styling across all interactive elements
- Focus outline: `box-shadow: 0 0 0 2px rgba(0, 179, 176, 0.3)`

## Implementation Checklist

### For New Components
- [ ] Use primary color `#00B3B0` for main actions and branding
- [ ] Implement consistent loading indicators with teal spinner
- [ ] Apply standard dropdown styling with proper focus states
- [ ] Use consistent search box design with teal icon
- [ ] Follow button styling guidelines
- [ ] Implement proper hover and focus states
- [ ] Ensure responsive design compatibility
- [ ] Test color contrast for accessibility

### For Existing Components
- [ ] Update any purple/blue colors to teal theme
- [ ] Replace old loading indicators with standard design
- [ ] Standardize dropdown and form element styling
- [ ] Update button colors to match theme
- [ ] Ensure consistent spacing and typography

## Notes
- This color theme is based on the Assessment History component design
- All loading indicators should use the FontAwesome spinner icon with teal color
- Gradients should use the primary and primary-dark colors
- Semi-transparent backgrounds should be used for overlays and header elements
- Maintain consistency across all components for better user experience

## Last Updated
January 2025 - Initial documentation based on Assessment History design implementation