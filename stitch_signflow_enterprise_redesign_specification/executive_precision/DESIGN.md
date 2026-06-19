---
name: Executive Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
---

## Brand & Style

The design system is engineered for high-stakes enterprise environments where trust, speed, and legal validity are paramount. It adopts a **Minimalist-Corporate** aesthetic, drawing inspiration from high-performance developer tools and financial platforms. 

The visual narrative centers on "The Verified Path"—using structural alignment, intentional density, and a restricted color palette to convey security and efficiency. The interface should feel like a high-precision instrument: fast to respond, clear in its intent, and devoid of unnecessary decoration. 

**Core Principles:**
- **Clarity over Decoration:** Every element exists to facilitate a legal action.
- **High-Density Utility:** Information is packed efficiently to minimize scrolling in complex document workflows.
- **Rigid Structure:** A strict adherence to the grid ensures the UI feels stable and institutional.

## Colors

The palette is anchored by "Deep Navy" (#0F172A), representing authority and the "ink" of a digital signature. 

- **Primary:** Used for the most critical actions and active states. 
- **Surface & Borders:** A nuanced scale of cool grays defines the hierarchy. In light mode, use subtle borders (#E2E8F0) to define areas. In dark mode, borders should be slightly more prominent (#1E293B) against the #020617 canvas.
- **Semantic Colors:** Success, Error, and Warning states use high-saturation but professional tones, ensuring accessibility (WCAG AA) against both light and dark backgrounds.
- **Interactive States:** Hover states should generally involve a subtle shift in luminosity rather than a change in hue.

## Typography

This design system utilizes **Inter** for all UI elements to ensure maximum legibility and a neutral, modern tone. **JetBrains Mono** is reserved strictly for technical data, such as Document IDs, SHA256 hashes, and audit trail timestamps.

- **Weight Usage:** Use SemiBold (600) for headings to provide strong visual anchoring without the "chunkiness" of Bold (700).
- **Readability:** Body text uses a generous 1.5x line height to facilitate the reading of long legal documents.
- **Labels:** Use the `label-md` style for field headers and small captions, often coupled with `text-slate-500` for secondary hierarchy.

## Layout & Spacing

A strict **4px baseline grid** governs all spacing. This "tight" spacing model allows for high information density required by enterprise dashboards.

- **Grid:** Use a 12-column fluid grid for dashboard layouts. Content containers should have a maximum width of 1280px to prevent excessive line lengths on wide monitors.
- **Density:** Components like tables and lists should utilize `sm` (8px) or `md` (16px) padding to maximize the number of visible rows.
- **Alignment:** All text-based elements must align to the baseline. Icons within buttons should be vertically centered and utilize the same 4px increment logic for sizing (16px, 20px, 24px).

## Elevation & Depth

Elevation is used sparingly to indicate interactivity and focus. The design system avoids heavy shadows, favoring layered surfaces and crisp borders.

- **Surface Tiers:** 
  - **Level 0 (Canvas):** Background color of the application.
  - **Level 1 (Card/Section):** Primary white/navy surface with a 1px border.
  - **Level 2 (Popovers/Dropdowns):** Elevated with a subtle shadow and 1px border.
- **Shadows:**
  - **Sm:** `0 1px 2px rgba(0,0,0,0.05)` — Used for buttons and small inputs.
  - **Md:** `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` — Used for standard cards.
  - **Lg:** `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` — Used for modals and signature panels.

## Shapes

The shape language is professional and geometric. 
- **Buttons & Inputs:** Use an 8px (`0.5rem`) radius to strike a balance between modern friendliness and corporate precision.
- **Cards & Modals:** Use a 12px (`0.75rem`) radius to create a distinct container hierarchy.
- **Status Pills:** Use a fully rounded (`9999px`) radius to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid `#0F172A` background, white text. No gradient, but a subtle inner-border light highlight on hover.
- **Secondary:** White background with `#E2E8F0` border.
- **Ghost:** No background/border, used for utility actions (e.g., "Cancel").

### Form Fields
- Fields use a subtle `#F8FAFC` background in their default state to increase contrast against the white page canvas. On focus, the border shifts to `#3B82F6` with a 2px outer glow (ring).

### Data Tables
- Header rows use `label-md` typography with a subtle bottom border. Row hover states should use a very faint gray (`#F1F5F9`) to assist with horizontal eye tracking.

### Government-Style Digital Signature Stamp
This is a specialized component for high-fidelity verification.
- **Container:** Compact, rectangular box with a 1.5pt solid black border. No rounded corners (0px) for this specific sub-component to emulate paper-based stamps.
- **Metadata Area:** The top 40% of the box is separated by a horizontal line. It contains four rows of text in `mono-sm` font:
  - **Line 1:** `DIGITALLY SIGNED BY: [Name]`
  - **Line 2:** `DATE/TIME: [ISO 8601 Timestamp]`
  - **Line 3:** `REASON: [Verification Reason]`
  - **Line 4:** `SHA256: [Hash - Truncated]`
- **Signature Area:** The bottom 60% contains the signature "scribble" graphic in dark blue ink color, overlaid with a "VERIFIED" watermark at a 15-degree angle in light gray.

### Status Indicators
- Small dots (8px) accompanied by text for "Active," "Pending," and "Expired." Use the semantic colors defined in the color section.