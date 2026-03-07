# Theme Toggle Feature

## Overview
NgaoMaternal Care now includes a comprehensive theme toggle feature that allows users to switch between light mode, dark mode, and system preference.

## Features

### 1. Three Theme Options
- **Light Mode**: Bright, clean interface optimized for daytime use
- **Dark Mode**: Easy on the eyes for low-light environments
- **System**: Automatically matches your device's theme preference

### 2. Persistent Preference
- Theme choice is saved to localStorage
- Preference persists across sessions
- Automatically applied on page load

### 3. Smooth Transitions
- Seamless switching between themes
- No page reload required
- All components adapt instantly

## How to Use

### Accessing the Theme Toggle

**Location**: Top-right corner of the header (sun/moon icon)

**Steps**:
1. Click the theme toggle button (☀️/🌙 icon)
2. Select your preferred theme:
   - **Light**: Bright, high-contrast interface
   - **Dark**: Dark background, light text
   - **System**: Follows your device settings
3. Theme applies immediately

### For Different User States

**Logged In Users**:
- Theme toggle appears next to user avatar
- Available on all pages

**Logged Out Users**:
- Theme toggle appears next to login/signup buttons
- Available on landing page and auth pages

## Technical Implementation

### Components

**ThemeProvider** (`src/contexts/ThemeContext.tsx`)
- Manages theme state globally
- Handles localStorage persistence
- Listens for system theme changes
- Applies theme to document root

**ThemeToggle** (`src/components/features/ThemeToggle.tsx`)
- Dropdown menu with three options
- Visual indicators (sun/moon icons)
- Checkmark shows current selection
- Accessible keyboard navigation

### Integration

**App.tsx**:
```tsx
<ThemeProvider>
  <AuthProvider>
    {/* App content */}
  </AuthProvider>
</ThemeProvider>
```

**Header.tsx**:
```tsx
import { ThemeToggle } from '@/components/features/ThemeToggle';

// In render:
<ThemeToggle />
```

### Theme Colors

**Light Mode** (Default):
- Background: Soft white/light blue
- Text: Dark gray/blue
- Primary: Medical blue (#2563eb)
- Accent: Calming green
- Cards: Pure white

**Dark Mode**:
- Background: Deep blue-gray
- Text: Light gray/white
- Primary: Brighter blue
- Accent: Muted green
- Cards: Dark blue-gray

All colors defined in `src/index.css` with CSS variables.

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ✅ System preference detection

## Accessibility

### Features
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **High Contrast**: Both themes meet WCAG AA standards
- **Focus Indicators**: Clear focus states
- **Icon + Text**: Visual and textual indicators

### WCAG Compliance
- Color contrast ratios meet AA standards
- Text remains readable in both themes
- Interactive elements clearly distinguishable
- No information conveyed by color alone

## User Benefits

### Health & Comfort
- **Reduced Eye Strain**: Dark mode for nighttime use
- **Better Sleep**: Less blue light exposure at night
- **Flexibility**: Choose what's comfortable for you
- **Accessibility**: Better for light-sensitive users

### Use Cases
- **Daytime**: Use light mode for clarity
- **Nighttime**: Switch to dark mode for comfort
- **Low Light**: Dark mode reduces screen glare
- **Bright Environments**: Light mode improves visibility

## Developer Notes

### Adding Theme Support to New Components

All shadcn/ui components automatically support theming. For custom components:

```tsx
// Use semantic color tokens
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Available Color Tokens

**Backgrounds**:
- `bg-background` - Main background
- `bg-card` - Card backgrounds
- `bg-muted` - Muted backgrounds
- `bg-popover` - Popover backgrounds

**Text**:
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `text-primary` - Primary color text
- `text-secondary` - Secondary color text

**Borders**:
- `border-border` - Standard borders
- `border-input` - Input borders

**Interactive**:
- `bg-primary` - Primary buttons/actions
- `bg-secondary` - Secondary actions
- `bg-accent` - Accent elements
- `bg-destructive` - Destructive actions

### Testing Themes

**Manual Testing**:
1. Toggle between all three theme options
2. Verify all pages render correctly
3. Check component contrast and readability
4. Test on different devices/browsers

**Automated Testing**:
```bash
# Run linting (includes theme checks)
npm run lint
```

## Troubleshooting

### Theme Not Persisting
**Issue**: Theme resets on page reload
**Solution**: Check browser localStorage is enabled

### Theme Not Applying
**Issue**: Theme toggle doesn't change appearance
**Solution**: 
1. Clear browser cache
2. Check console for errors
3. Verify ThemeProvider wraps app

### System Theme Not Working
**Issue**: System option doesn't follow device theme
**Solution**: 
1. Check browser supports `prefers-color-scheme`
2. Verify device has theme preference set
3. Try toggling device theme

### Colors Look Wrong
**Issue**: Colors don't match design
**Solution**:
1. Check `src/index.css` for correct color values
2. Verify using semantic tokens (not direct colors)
3. Clear browser cache

## Future Enhancements

### Planned Features
- [ ] Custom theme colors
- [ ] High contrast mode
- [ ] Color blind friendly themes
- [ ] Theme preview before applying
- [ ] Scheduled theme switching (auto dark at night)
- [ ] Per-page theme preferences

### Potential Improvements
- Animated theme transitions
- More theme options (blue, green, purple)
- Theme customization UI
- Export/import theme settings
- Accessibility theme presets

## Best Practices

### For Users
✅ Choose theme based on environment
✅ Use dark mode in low light
✅ Use system mode for automatic switching
✅ Adjust device brightness along with theme

### For Developers
✅ Always use semantic color tokens
✅ Test components in both themes
✅ Ensure proper contrast ratios
✅ Avoid hardcoded colors
✅ Use CSS variables for consistency

## Related Documentation

- **Design System**: See `src/index.css` for color definitions
- **Component Library**: All shadcn/ui components support theming
- **Accessibility**: WCAG AA compliant color schemes
- **User Guide**: See USER_GUIDE.md for user instructions

---

**Version**: 1.0.0
**Last Updated**: 2026-03-08
**Supported Themes**: Light, Dark, System
