---
title: Onboarding Experience Design
description: Premium onboarding flow for SaaS pricing intelligence platform
feature: onboarding
last-updated: 2025-08-06
version: 2.0.0
related-files: 
  - ./user-journey.md
  - ./screen-states.md
  - ./interactions.md
dependencies:
  - WealthFlow design system
  - Calculator feature
status: approved
---

# Onboarding Experience Design

## Overview

The onboarding experience transforms first-time users from curious visitors to confident pricing analysts in under 3 minutes. This premium experience embodies the "Tesla of pricing tools" positioning through progressive disclosure, intelligent defaults, and delightful micro-interactions.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [User Journey Overview](#user-journey-overview)
3. [Screen-by-Screen Specifications](#screen-by-screen-specifications)
4. [Interaction Patterns](#interaction-patterns)
5. [Success Metrics](#success-metrics)
6. [Implementation Guidelines](#implementation-guidelines)

## Design Philosophy

**From curiosity to confidence in 180 seconds** - The onboarding experience must demonstrate immediate value while progressively revealing the platform's sophisticated capabilities without overwhelming business decision-makers.

### Core Principles

- **Immediate Value**: Show pricing insights within the first 30 seconds
- **Progressive Confidence**: Build trust through small wins before complex analysis
- **Professional Polish**: B2B-appropriate onboarding that conveys credibility
- **Smart Defaults**: Industry templates accelerate time-to-value
- **Effortless Sophistication**: Complex analysis feels simple and intuitive

### Success Definition

A successful onboarding experience achieves:
- **85% completion rate** (industry average: 60%)
- **<3 minute time-to-first-insight** 
- **90% user satisfaction** on post-onboarding survey
- **60% return rate** within 7 days

## User Journey Overview

### Phase 1: Welcome & Value Proposition (0-30 seconds)
**Goal**: Establish credibility and demonstrate immediate value potential
- Hero section with clear value proposition
- Social proof and credibility indicators  
- Quick start options with smart templates
- Real-time preview of potential insights

### Phase 2: Smart Template Selection (30-60 seconds)
**Goal**: Reduce cognitive load through intelligent defaults
- Industry-specific templates with benchmark data
- Visual comparison of template options
- One-click template selection with preview
- Option to customize or start from scratch

### Phase 3: Progressive Data Input (60-150 seconds)
**Goal**: Gather essential data while building excitement for results
- Step-by-step wizard with clear progress indication
- Real-time insights building as data is entered
- Smart validation and helpful suggestions
- Preview of upcoming analysis sections

### Phase 4: First Results & Next Steps (150-180 seconds)
**Goal**: Deliver initial value and guide toward deeper engagement
- Immediate pricing insights and recommendations
- Clear visualization of optimization opportunities
- Guided tour of advanced features
- Account creation and personalization options

## Screen-by-Screen Specifications

### Screen 1: Welcome Hero

**Purpose**: First impression that establishes premium positioning and immediate value

**Layout Structure**: Full-screen hero with glassmorphic elements

**Visual Design Specifications**:
```css
.onboarding-hero {
  min-height: 100vh;
  background: var(--gradient-premium);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, var(--glass-blue) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, var(--glass-success) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, var(--glass-gold) 0%, transparent 50%);
  animation: gentle-float 20s ease-in-out infinite alternate;
}

.hero-content {
  max-width: 800px;
  text-align: center;
  padding: var(--space-8);
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: var(--text-display-lg);
  font-weight: var(--weight-extrabold);
  color: var(--primary-50);
  margin-bottom: var(--space-6);
  line-height: 1.1;
  letter-spacing: var(--tracking-display);
}

.hero-subtitle {
  font-size: var(--text-body-xl);
  color: var(--primary-200);
  margin-bottom: var(--space-8);
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

@keyframes gentle-float {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-10px, -10px) rotate(1deg); }
}
```

**Content Structure**:
- **Main Headline**: "The Tesla of Pricing Tools"
- **Subheading**: "Transform pricing guesswork into strategic advantage with AI-powered analysis in under 3 minutes"
- **Value Props**: "Consultant-level insights • Beautiful visualizations • Instant recommendations"
- **Primary CTA**: "Start Free Analysis" (Premium gradient button)
- **Secondary CTA**: "Watch Demo" (Ghost button)
- **Trust Indicators**: Customer logos, testimonials, security badges

**Interactive Elements**:
```css
.hero-cta-primary {
  /* Inherits from .button-primary .button-lg */
  background: var(--gradient-trust);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
  min-width: 200px;
  margin-bottom: var(--space-4);
}

.hero-cta-primary:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 16px 48px rgba(59, 130, 246, 0.4);
}

.trust-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-6);
  margin-top: var(--space-8);
  opacity: 0.7;
}

.trust-logo {
  height: 32px;
  filter: grayscale(100%) brightness(2);
  transition: all var(--duration-quick) var(--ease-out);
}

.trust-logo:hover {
  filter: grayscale(0%) brightness(1);
  opacity: 1;
}
```

**Mobile Adaptations**:
```css
@media (max-width: 767px) {
  .hero-title {
    font-size: var(--text-display-md);
  }
  
  .hero-subtitle {
    font-size: var(--text-body-lg);
  }
  
  .trust-indicators {
    flex-wrap: wrap;
    gap: var(--space-4);
  }
  
  .trust-logo {
    height: 24px;
  }
}
```

### Screen 2: Smart Template Selection

**Purpose**: Reduce setup friction through intelligent industry defaults

**Layout Structure**: Card-based selection with preview capabilities

**Visual Design Specifications**:
```css
.template-selection {
  min-height: 100vh;
  background: var(--primary-900);
  padding: var(--space-8) 0;
  position: relative;
}

.template-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto var(--space-12);
}

.template-title {
  font-size: var(--text-display-md);
  font-weight: var(--weight-bold);
  color: var(--primary-50);
  margin-bottom: var(--space-4);
}

.template-subtitle {
  font-size: var(--text-body-lg);
  color: var(--primary-300);
  line-height: 1.6;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.template-card {
  background: var(--glass-primary);
  backdrop-filter: blur(12px);
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  cursor: pointer;
  transition: all var(--duration-standard) var(--ease-out);
  position: relative;
  overflow: hidden;
}

.template-card:hover {
  transform: translateY(-4px);
  border-color: var(--glass-border-light);
  box-shadow: var(--shadow-glass-elevated);
}

.template-card.selected {
  border-color: var(--blue-400);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  background: var(--glass-elevated);
}

.template-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-trust);
  opacity: 0;
  transition: opacity var(--duration-quick) var(--ease-out);
}

.template-card.selected::before {
  opacity: 1;
}
```

**Template Card Content**:
```css
.template-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-4);
  background: var(--gradient-trust);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.template-name {
  font-size: var(--text-h3);
  font-weight: var(--weight-semibold);
  color: var(--primary-100);
  margin-bottom: var(--space-2);
}

.template-description {
  font-size: var(--text-body-md);
  color: var(--primary-300);
  line-height: 1.5;
  margin-bottom: var(--space-4);
}

.template-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.template-metric {
  text-align: center;
  padding: var(--space-3);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
}

.metric-value {
  font-size: var(--text-h4);
  font-weight: var(--weight-bold);
  color: var(--success-400);
  display: block;
}

.metric-label {
  font-size: var(--text-body-sm);
  color: var(--primary-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

**Available Templates**:
1. **B2B SaaS** - Average LTV: $2,400, Churn: 5%
2. **B2C Subscription** - Average LTV: $180, Churn: 12%
3. **Enterprise Software** - Average LTV: $25,000, Churn: 3%
4. **E-learning Platform** - Average LTV: $650, Churn: 8%
5. **Marketplace** - Average Take Rate: 12%, GMV: $2.5M
6. **Custom Template** - Start from scratch with guided setup

### Screen 3: Progressive Data Input Wizard

**Purpose**: Gather essential pricing data through an engaging, step-by-step process

**Layout Structure**: Multi-step form with progress indication and real-time preview

**Visual Design Specifications**:
```css
.data-input-wizard {
  min-height: 100vh;
  background: var(--primary-900);
  display: flex;
  flex-direction: column;
  position: relative;
}

.wizard-progress {
  position: sticky;
  top: 0;
  background: var(--glass-primary);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--glass-border);
  padding: var(--space-6) 0;
  z-index: 10;
}

.progress-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.progress-steps {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.progress-step {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--glass-primary);
  border: 2px solid var(--glass-border);
  color: var(--primary-400);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--weight-bold);
  font-size: var(--text-body-md);
  transition: all var(--duration-quick) var(--ease-out);
  position: relative;
}

.progress-step.completed {
  background: var(--success-500);
  border-color: var(--success-500);
  color: white;
}

.progress-step.completed::after {
  content: '✓';
  font-size: 16px;
}

.progress-step.active {
  background: var(--blue-500);
  border-color: var(--blue-500);
  color: white;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  animation: active-pulse 2s ease-in-out infinite;
}

.progress-connector {
  width: 60px;
  height: 2px;
  background: var(--glass-border);
  transition: background var(--duration-quick) var(--ease-out);
}

.progress-connector.completed {
  background: var(--success-500);
}

@keyframes active-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1); }
}
```

**Step Content Container**:
```css
.wizard-content {
  flex: 1;
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
  gap: var(--space-8);
  align-items: flex-start;
}

.wizard-main {
  flex: 2;
  max-width: 600px;
}

.wizard-preview {
  flex: 1;
  position: sticky;
  top: 120px;
}

.step-card {
  background: var(--glass-primary);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  margin-bottom: var(--space-6);
}

.step-header {
  margin-bottom: var(--space-6);
}

.step-title {
  font-size: var(--text-h2);
  font-weight: var(--weight-bold);
  color: var(--primary-100);
  margin-bottom: var(--space-2);
}

.step-description {
  font-size: var(--text-body-lg);
  color: var(--primary-300);
  line-height: 1.6;
}

.step-fields {
  display: grid;
  gap: var(--space-6);
}
```

**Real-time Preview Panel**:
```css
.preview-panel {
  background: var(--glass-primary);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  position: sticky;
  top: 120px;
}

.preview-title {
  font-size: var(--text-h4);
  font-weight: var(--weight-semibold);
  color: var(--primary-100);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.preview-title::before {
  content: '👁️';
  font-size: 20px;
}

.preview-metrics {
  display: grid;
  gap: var(--space-4);
}

.preview-metric {
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--blue-400);
}

.metric-label {
  font-size: var(--text-body-sm);
  color: var(--primary-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.metric-value {
  font-size: var(--text-h3);
  font-weight: var(--weight-bold);
  color: var(--primary-100);
}

.metric-change {
  font-size: var(--text-body-sm);
  margin-top: var(--space-1);
}

.metric-change.positive {
  color: var(--success-400);
}

.metric-change.negative {
  color: var(--error-400);
}

.metric-change::before {
  content: '↗️';
  margin-right: var(--space-1);
}

.metric-change.negative::before {
  content: '↘️';
}
```

**Wizard Steps**:

#### Step 1: Current Pricing
- Monthly price input with currency symbol
- Billing frequency selection (monthly/annual)
- Pricing model type (per seat, per feature, usage-based)
- Current customer count

#### Step 2: Business Context
- Industry/market selection with auto-complete
- Company stage (startup, growth, enterprise)
- Primary target customer type
- Average contract length

#### Step 3: Competition & Goals
- Key competitors (smart suggestion system)
- Primary business goal (growth, profitability, market share)
- Pricing change timeline
- Risk tolerance level

### Screen 4: Initial Results & Engagement

**Purpose**: Deliver immediate value and guide users toward deeper platform engagement

**Layout Structure**: Dashboard-style results with clear next steps

**Visual Design Specifications**:
```css
.results-hero {
  background: var(--gradient-premium);
  padding: var(--space-12) 0 var(--space-8);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.results-celebration {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.celebration-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-6);
  background: var(--gradient-luxury);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  animation: celebration-bounce 1s ease-out;
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3);
}

.celebration-title {
  font-size: var(--text-display-md);
  font-weight: var(--weight-extrabold);
  color: var(--primary-50);
  margin-bottom: var(--space-4);
}

.celebration-subtitle {
  font-size: var(--text-body-xl);
  color: var(--primary-200);
  line-height: 1.6;
  margin-bottom: var(--space-8);
}

@keyframes celebration-bounce {
  0% { transform: scale(0.8) translateY(20px); opacity: 0; }
  50% { transform: scale(1.1) translateY(-10px); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
```

**Key Insights Grid**:
```css
.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
  max-width: 1200px;
  margin: var(--space-8) auto;
  padding: 0 var(--space-6);
}

.insight-card {
  background: var(--glass-primary);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  position: relative;
  transition: all var(--duration-standard) var(--ease-out);
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glass-elevated);
  border-color: var(--glass-border-light);
}

.insight-card.opportunity {
  border-left: 4px solid var(--success-500);
}

.insight-card.risk {
  border-left: 4px solid var(--warning-500);
}

.insight-card.competitive {
  border-left: 4px solid var(--blue-500);
}

.insight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.insight-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.insight-card.opportunity .insight-icon {
  background: var(--gradient-growth);
}

.insight-card.risk .insight-icon {
  background: linear-gradient(135deg, var(--warning-600), var(--warning-400));
}

.insight-card.competitive .insight-icon {
  background: var(--gradient-trust);
}

.insight-impact {
  font-size: var(--text-h2);
  font-weight: var(--weight-extrabold);
  color: var(--success-400);
}

.insight-title {
  font-size: var(--text-h4);
  font-weight: var(--weight-semibold);
  color: var(--primary-100);
  margin-bottom: var(--space-2);
}

.insight-description {
  font-size: var(--text-body-md);
  color: var(--primary-300);
  line-height: 1.6;
  margin-bottom: var(--space-4);
}

.insight-action {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--blue-400);
  font-size: var(--text-body-sm);
  font-weight: var(--weight-medium);
  text-decoration: none;
  transition: color var(--duration-quick) var(--ease-out);
}

.insight-action:hover {
  color: var(--blue-300);
}

.insight-action::after {
  content: '→';
  transition: transform var(--duration-quick) var(--ease-out);
}

.insight-action:hover::after {
  transform: translateX(2px);
}
```

**Next Steps Section**:
```css
.next-steps {
  background: var(--glass-primary);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--glass-border);
  padding: var(--space-12) 0;
  text-align: center;
}

.next-steps-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.next-steps-title {
  font-size: var(--text-h2);
  font-weight: var(--weight-bold);
  color: var(--primary-100);
  margin-bottom: var(--space-6);
}

.next-steps-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.next-step-card {
  background: var(--glass-elevated);
  border: 1px solid var(--glass-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  max-width: 240px;
  text-align: center;
  transition: all var(--duration-quick) var(--ease-out);
  cursor: pointer;
}

.next-step-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--blue-400);
}

.next-step-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--space-3);
  background: var(--gradient-trust);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.next-step-title {
  font-size: var(--text-h5);
  font-weight: var(--weight-semibold);
  color: var(--primary-100);
  margin-bottom: var(--space-2);
}

.next-step-description {
  font-size: var(--text-body-sm);
  color: var(--primary-400);
  line-height: 1.5;
}
```

## Interaction Patterns

### Progressive Enhancement
- Initial screen loads with essential content immediately
- Secondary animations and effects load progressively
- Fallback experiences for slower connections

### Smart Defaults
- Template selection pre-populates relevant industry data
- Form fields suggest common values based on selection
- Previous user inputs inform intelligent suggestions

### Real-time Feedback
- Input validation provides immediate guidance
- Preview panel updates in real-time as data is entered
- Progress indicators show completion status

### Micro-interactions
- Smooth transitions between steps
- Hover effects provide interactive feedback
- Success animations celebrate completions
- Loading states maintain user engagement

## Success Metrics

### Completion Metrics
- **Onboarding Completion Rate**: 85% target
- **Time to First Insight**: <3 minutes average
- **Step Completion Rates**: 95% step 1, 85% step 2, 80% step 3, 85% step 4

### Engagement Metrics
- **Return Visit Rate**: 60% within 7 days
- **Feature Discovery Rate**: 70% explore advanced features
- **Account Creation Rate**: 75% create accounts

### Quality Metrics
- **User Satisfaction Score**: 90% positive rating
- **Task Success Rate**: 95% complete primary goal
- **Error Rate**: <5% encounter blocking errors

### Business Impact
- **Trial to Paid Conversion**: 25% convert within 30 days
- **Revenue per User**: $149 average (premium positioning)
- **Customer Lifetime Value**: $450 with onboarding optimization

## Implementation Guidelines

### Technical Requirements
- Progressive Web App (PWA) capabilities for offline access
- Lazy loading for optimal performance on slower connections
- Service worker for background data sync
- Analytics integration for user behavior tracking

### Accessibility Standards
- WCAG 2.1 AA compliance throughout onboarding flow
- Screen reader compatible with proper ARIA labels
- Keyboard navigation support for all interactions
- High contrast mode support for visual accessibility

### Performance Targets
- First Contentful Paint: <1.2 seconds
- Time to Interactive: <2.5 seconds
- Smooth 60fps animations on all supported devices
- <500ms response time for all user interactions

## Related Documentation

- [Calculator Feature](../calculator/README.md) - Core pricing analysis experience
- [User Journey Mapping](./user-journey.md) - Detailed flow documentation
- [Screen State Specifications](./screen-states.md) - All screen variations
- [Interaction Specifications](./interactions.md) - Animation and feedback details

---

## Version History

### v2.0.0 (2025-08-06) - Premium Transformation
- **Major**: Complete redesign with glassmorphic premium experience
- **Added**: Smart template system with industry-specific defaults
- **Added**: Progressive data input with real-time preview
- **Enhanced**: Celebration and success states for user engagement
- **Added**: Professional B2B styling throughout onboarding flow
- **Enhanced**: Mobile-first responsive design with touch optimization

### v1.0.0 (2025-08-05) - Foundation
- **Initial**: Basic onboarding flow specifications
- **Added**: Multi-step wizard with progress indication
- **Status**: Production implementation baseline

---

*This onboarding experience transforms first-time users into confident pricing analysts while establishing the premium, professional positioning that defines "the Tesla of pricing tools."*