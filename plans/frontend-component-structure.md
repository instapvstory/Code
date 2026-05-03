# Blog CMS Admin Dashboard - Frontend Component Structure

## Overview
This document outlines the complete frontend component architecture for the Blog CMS Admin Dashboard, following a modular, reusable design pattern.

## Project Structure

```
src/
├── app/
│   ├── admin/                    # Admin dashboard pages
│   │   ├── layout.tsx           # Admin layout wrapper
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Dashboard overview
│   │   ├── posts/
│   │   │   ├── page.tsx         # Posts list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # Edit post
│   │   │   └── new/
│   │   │       └── page.tsx     # Create new post
│   │   ├── categories/
│   │   │   └── page.tsx         # Categories management
│   │   ├── media/
│   │   │   └── page.tsx         # Media library
│   │   ├── seo/
│   │   │   └── page.tsx         # SEO settings
│   │   ├── analytics/
│   │   │   └── page.tsx         # Analytics dashboard
│   │   ├── integrations/
│   │   │   └── page.tsx         # Third-party integrations
│   │   ├── domains/
│   │   │   └── page.tsx         # Domain management
│   │   ├── users/
│   │   │   └── page.tsx         # User management
│   │   └── settings/
│   │       └── page.tsx         # System settings
│   └── api/                     # API routes
│       └── admin/
│           └── ...              # Admin API endpoints
├── components/
│   ├── admin/                   # Admin-specific components
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── SidebarItem.tsx
│   │   │   │   ├── SidebarMenu.tsx
│   │   │   │   └── SidebarToggle.tsx
│   │   │   ├── TopNavbar/
│   │   │   │   ├── TopNavbar.tsx
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── Notifications.tsx
│   │   │   │   └── UserMenu.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── ui/
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── ChartWidget.tsx
│   │   │   ├── RecentPosts.tsx
│   │   │   └── TrafficChart.tsx
│   │   ├── posts/
│   │   │   ├── PostsTable.tsx
│   │   │   ├── PostStatusBadge.tsx
│   │   │   ├── PostFilters.tsx
│   │   │   └── BulkActions.tsx
│   │   ├── editor/
│   │   │   ├── RichTextEditor.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   ├── EditorSidebar.tsx
│   │   │   ├── blocks/
│   │   │   │   ├── HeadingBlock.tsx
│   │   │   │   ├── ParagraphBlock.tsx
│   │   │   │   ├── ImageBlock.tsx
│   │   │   │   ├── VideoBlock.tsx
│   │   │   │   ├── CodeBlock.tsx
│   │   │   │   ├── QuoteBlock.tsx
│   │   │   │   ├── ListBlock.tsx
│   │   │   │   ├── ButtonBlock.tsx
│   │   │   │   ├── TableBlock.tsx
│   │   │   │   └── DividerBlock.tsx
│   │   │   ├── SEOPanel.tsx
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── AutoSaveIndicator.tsx
│   │   │   └── EditorStatusBar.tsx
│   │   ├── media/
│   │   │   ├── MediaGrid.tsx
│   │   │   ├── MediaUpload.tsx
│   │   │   ├── MediaPreview.tsx
│   │   │   └── MediaFilters.tsx
│   │   ├── seo/
│   │   │   ├── SEOScore.tsx
│   │   │   ├── MetaPreview.tsx
│   │   │   ├── KeywordDensity.tsx
│   │   │   └── SchemaGenerator.tsx
│   │   ├── analytics/
│   │   │   ├── AnalyticsChart.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── TopPostsTable.tsx
│   │   │   └── TrafficSources.tsx
│   │   └── forms/
│   │       ├── CategoryForm.tsx
│   │       ├── UserForm.tsx
│   │       ├── DomainForm.tsx
│   │       └── SettingsForm.tsx
│   └── shared/                  # Shared components
│       ├── ThemeToggle.tsx
│       ├── ErrorBoundary.tsx
│       └── LoadingSkeleton.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useMediaUpload.ts
│   ├── useEditor.ts
│   ├── useAnalytics.ts
│   ├── useSEO.ts
│   └── useToast.ts
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── posts.ts
│   │   ├── categories.ts
│   │   ├── media.ts
│   │   ├── seo.ts
│   │   ├── analytics.ts
│   │   └── domains.ts
│   ├── editor/
│   │   ├── blocks.ts
│   │   ├── serializers.ts
│   │   └── utils.ts
│   ├── seo/
│   │   ├── analyzer.ts
│   │   ├── generator.ts
│   │   └── schemas.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── constants.ts
├── styles/
│   ├── globals.css
│   ├── admin.css
│   ├── editor.css
│   └── theme.css
└── types/
    ├── index.ts
    ├── post.ts
    ├── user.ts
    ├── seo.ts
    └── analytics.ts
```

## Component Details

### 1. Admin Layout Components

#### `AdminLayout.tsx`
- Main layout wrapper for admin dashboard
- Handles sidebar state, theme, and authentication
- Provides context for toast notifications

#### `Sidebar/`
- **`Sidebar.tsx`**: Main sidebar navigation with collapsible sections
- **`SidebarItem.tsx`**: Individual menu item with icons and active states
- **`SidebarMenu.tsx`**: Groups related menu items
- **`SidebarToggle.tsx`**: Button to collapse/expand sidebar

#### `TopNavbar/`
- **`TopNavbar.tsx`**: Top navigation bar with search and user menu
- **`SearchBar.tsx`**: Global search with autocomplete
- **`Notifications.tsx`**: Notification bell with dropdown
- **`UserMenu.tsx`**: User avatar with dropdown menu (profile, settings, logout)

### 2. Dashboard Components

#### `StatsCard.tsx`
- Displays key metrics with icons and trends
- Supports different variants (primary, success, warning, danger)
- Shows percentage changes with up/down arrows

#### `ChartWidget.tsx`
- Reusable chart component using Recharts
- Supports line, bar, area, and pie charts
- Configurable with different data sources

#### `RecentPosts.tsx`
- Table showing recently published posts
- Quick actions (edit, view, delete)
- Status indicators

#### `TrafficChart.tsx`
- Line chart for website traffic
- Time period selector (7d, 30d, 90d)
- Comparison with previous period

### 3. Post Management Components

#### `PostsTable.tsx`
- Data table with pagination, sorting, and filtering
- Column toggles for custom views
- Bulk selection and actions
- Row actions (edit, duplicate, delete)

#### `PostStatusBadge.tsx`
- Color-coded status badges
- Draft, Published, Scheduled, Archived, Trash
- Interactive status changes

#### `PostFilters.tsx`
- Advanced filtering panel
- Category, tag, author, date range filters
- Status and featured filters
- Search by title/content

#### `BulkActions.tsx`
- Bulk operations toolbar
- Publish, draft, delete, move to category
- Progress indicator for batch operations

### 4. Rich Text Editor Components

#### `RichTextEditor.tsx`
- Main editor component using TipTap
- Block-based editing with drag & drop
- Real-time collaboration support
- Auto-save functionality

#### `EditorToolbar.tsx`
- Floating toolbar for text formatting
- Block type selector
- Link, image, video insert buttons
- Undo/redo, clear formatting

#### `EditorSidebar.tsx`
- Document outline
- Block settings
- SEO suggestions
- Reading time calculator

#### Block Components
- **`HeadingBlock.tsx`**: H1-H6 headings with level selector
- **`ParagraphBlock.tsx`**: Text paragraph with formatting
- **`ImageBlock.tsx`**: Image upload with alt text and caption
- **`VideoBlock.tsx`**: Video embed with provider selection
- **`CodeBlock.tsx`**: Syntax-highlighted code with language selector
- **`QuoteBlock.tsx`**: Blockquote with citation
- **`ListBlock.tsx`**: Ordered/unordered lists with nesting
- **`ButtonBlock.tsx`**: CTA button with styling options
- **`TableBlock.tsx`**: Editable table with row/column controls
- **`DividerBlock.tsx`**: Horizontal rule with style options

### 5. SEO Components

#### `SEOPanel.tsx`
- Meta title with character counter (60 chars optimal)
- Meta description with character counter (155 chars optimal)
- Focus keyword input
- Slug generator
- Canonical URL field
- Open Graph and Twitter card previews

#### `SEOScore.tsx`
- Overall SEO score (0-100)
- Individual factor scores
- Improvement suggestions
- Color-coded indicators (red/yellow/green)

#### `MetaPreview.tsx`
- Google search result preview
- Facebook/Twitter card preview
- Real-time updates as user types

#### `KeywordDensity.tsx`
- Keyword frequency analysis
- Density percentage
- Distribution across headings/content
- Suggestions for optimization

#### `SchemaGenerator.tsx`
- JSON-LD schema markup generator
- Article, BlogPosting, Organization schemas
- Preview and validation
- Auto-injection option

### 6. Media Library Components

#### `MediaGrid.tsx`
- Masonry grid layout for images/videos
- Thumbnail previews with file info
- Selection mode with checkboxes
- Infinite scroll loading

#### `MediaUpload.tsx`
- Drag & drop file upload
- Multiple file selection
- Progress indicators
- File type validation
- Image optimization options

#### `MediaPreview.tsx`
- Full-size preview modal
- Image editing (crop, rotate, resize)
- Alt text and caption editing
- Copy URL functionality

#### `MediaFilters.tsx`
- Filter by file type, date, size
- Search by filename or alt text
- Sort by date, size, name
- Folder organization

### 7. Analytics Components

#### `AnalyticsChart.tsx`
- Interactive charts using Recharts
- Time series data visualization
- Multiple metric comparison
- Export as PNG/CSV

#### `MetricCard.tsx`
- Key performance indicators
- Comparison with previous period
- Sparkline mini-charts
- Goal progress indicators

#### `TopPostsTable.tsx`
- Table of top-performing content
- Metrics: views, engagement, conversions
- Sortable columns
- Quick action to edit post

#### `TrafficSources.tsx`
- Pie/donut chart for traffic sources
- Direct, organic, social, referral
- Drill-down capability
- Conversion rates by source

### 8. Domain Management Components

#### `DomainForm.tsx`
- Add/edit domain form
- Domain validation
- Verification method selector
- SSL status display

#### `VerificationInstructions.tsx`
- Step-by-step verification guide
- DNS TXT record instructions
- HTML file upload instructions
- Meta tag instructions
- Auto-check verification status

#### `SSLStatusCard.tsx`
- SSL certificate information
- Expiration countdown
- Renewal reminders
- Security grade indicator

### 9. Form Components

#### `CategoryForm.tsx`
- Create/edit category form
- Parent category selector
- Slug auto-generation
- SEO fields for categories

#### `UserForm.tsx`
- User creation/editing form
- Role selection (admin, editor, author)
- Password strength indicator
- Avatar upload

#### `SettingsForm.tsx`
- Site settings form
- General, SEO, social media tabs
- Validation and error handling
- Save/Reset/Cancel actions

## UI Design System

### Colors (Tailwind CSS)
```css
:root {
  --primary: #3B82F6;
  --primary-dark: #1D4ED8;
  --secondary: #10B981;
  --danger: #EF4444;
  --warning: #F59E0B;
  --success: #10B981;
  --background: #F9FAFB;
  --card: #FFFFFF;
  --text: #111827;
  --text-muted: #6B7280;
  --border: #E5E7EB;
}
```

### Typography
- Font family: Inter, system-ui, sans-serif
- Base size: 16px
- Scale: 0.75rem → 1rem → 1.25rem → 1.5rem → 1.875rem → 2.25rem

### Spacing
- Base unit: 0.25rem (4px)
- Scale: 0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, 3rem, 4rem

### Shadows
```css
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
```

### Border Radius
- Small: 0.375rem (6px)
- Medium: 0.5rem (8px)
- Large: 0.75rem (12px)
- Extra Large: 1rem (16px)

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile-First Approach
1. **Mobile**: Stacked layout, simplified navigation
2. **Tablet**: Sidebar becomes collapsible, two-column layouts
3. **Desktop**: Full sidebar, multi-column dashboards

### Responsive Behaviors
- Sidebar collapses to icons on tablet
- Top navbar becomes sticky on mobile
- Tables switch to card layout on mobile
- Editor switches to single-column on mobile

## Performance Optimizations

### Code Splitting
- Dynamic imports for heavy components (editor, charts)
- Route-based code splitting
- Lazy loading for below-the-fold content

### Image Optimization
- Next.js Image component for automatic optimization
- WebP format with fallbacks
- Lazy loading with blur placeholders
- Responsive image sizes

### State Management
- React Query for server state
- Zustand for client state
- Optimistic updates for better UX
- Request deduplication and caching

### Bundle Optimization
- Tree shaking with ES modules
- Code splitting by route
- Dynamic imports for third-party libraries
- Compression with Brotli/Gzip

## Accessibility Features

### ARIA Labels
- Proper labels for all interactive elements
- Descriptive alt text for images
- Screen reader announcements for dynamic content

### Keyboard Navigation
- Tab navigation with focus indicators
- Keyboard shortcuts for common actions
- Skip to main content link

### Color Contrast
- WCAG AA compliance (4.5:1 minimum)
- High contrast mode support
- Color-blind friendly palettes

### Screen Reader Support
- Semantic HTML structure
- ARIA roles and properties
- Live regions for dynamic updates

## Dark Mode Support

### Implementation
- CSS custom properties for theming
- System preference detection
- Manual toggle with persistence
- Smooth transitions between themes

### Dark Theme Colors
```css
.dark {
  --background: #111827;
  --card: #1F2937;
  --text: #F9FAFB;
  --text-muted: #9CA3AF;
  --border: #374151;
}
```

## Development Guidelines

### Component Patterns
- Use TypeScript for type safety
- Follow React hooks best practices
- Implement proper error boundaries
- Use React.memo for expensive components

### Styling Approach
- Tailwind CSS for utility-first styling
- CSS Modules for component-specific styles
- CSS custom properties for theming
- Responsive design with mobile-first approach

### Testing Strategy
- Unit tests with Jest and React Testing Library
- Component tests for UI components
- Integration tests for user flows
- E2E tests with Cypress

### Code Quality
- ESLint with TypeScript rules
- Prettier for code formatting
- Husky for pre-commit hooks
- Conventional commits for changelog generation