# InstaPvStory - Site Structure Overview

## Project Information
- **Project Name**: InstaPvStory (Instagram Private Story Viewer)
- **Version**: 0.1.0
- **Framework**: Next.js 16.2.3 with App Router
- **Language**: TypeScript
- **UI Library**: React 19.2.4
- **Styling**: CSS Modules with custom design system
- **Development Server**: Running on http://localhost:3000

## Recent Feature Updates

### Highlights & Captions Feature (April 2026)
- **Objective**: Fetch 1-2 highlights from Instagram accounts and extract captions for reels/posts/stories/highlights
- **Implementation**:
  - Enhanced Instagram API integration to fetch captions for all media types
  - Added fallback logic for highlights (Instagram Business Discovery API doesn't support highlights field)
  - Created enhanced mock highlights using real post data with extracted captions
  - Updated UI components to display captions in ProfileView, PostsGrid, and MediaModal
- **Technical Changes**:
  - Updated `src/lib/instagram.ts`: Modified fields string, added highlight generation logic
  - Updated `src/components/viewer/ProfileView/ProfileView.tsx`: Enhanced Highlight interface, added caption display
  - Updated `src/components/viewer/PostsGrid/PostsGrid.tsx`: Added caption field to Post interface
  - Updated `src/components/viewer/MediaModal/MediaModal.tsx`: Added caption display section with styling
  - Updated CSS modules for proper caption styling and layout

## File Structure

### Root Directory
```
├── .env.local                    # Environment variables (Instagram API token)
├── .gitignore                    # Git ignore rules
├── AGENTS.md                     # Agent rules documentation
├── CLAUDE.md                     # Claude-specific instructions
├── eslint.config.mjs             # ESLint configuration
├── next-env.d.ts                 # Next.js TypeScript declarations
├── next.config.ts                # Next.js configuration (minimal)
├── package-lock.json             # Dependency lock file
├── package.json                  # Project dependencies and scripts
├── README.md                     # Basic Next.js README
├── temp_debug.js                 # Temporary debug files
├── temp_debug2.js
├── temp_debug3.js
├── tsconfig.json                 # TypeScript configuration
└── public/                       # Static assets
    ├── colorful-waves.png        # Background images
    ├── file.svg                  # SVG icons
    ├── globe.svg
    ├── hero-bg.png
    ├── next.svg
    ├── vercel.svg
    └── window.svg
```

### Source Code (`src/`)

#### Application Layer (`src/app/`)
```
src/app/
├── actions.ts                    # Server actions for Instagram API
├── favicon.ico                   # Site favicon
├── layout.tsx                    # Root layout with Header/Footer
├── page.module.css               # Homepage styles
├── page.tsx                      # Homepage component
│
├── [username]/                   # Dynamic route for profile viewing
│   ├── page.module.css           # Profile page styles
│   └── page.tsx                  # Profile viewer component
│
├── about/                        # About page
│   ├── About.module.css
│   └── page.tsx
│
├── blog/                         # Blog listing page
│   ├── blog.module.css
│   └── page.tsx
│   └── [slug]/                   # Individual blog posts
│       └── page.tsx
│
├── contact/                      # Contact page
│   ├── ContactForm.module.css
│   └── page.tsx
│
├── disclaimer/                   # Legal disclaimer
│   └── page.tsx
│
├── features/                     # Features page
│   ├── features.module.css
│   └── page.tsx
│
├── privacy/                      # Privacy policy
│   └── page.tsx
│
└── terms/                        # Terms of service
    └── page.tsx
```

#### Components (`src/components/`)
```
src/components/
├── layout/                       # Layout components
│   ├── Breadcrumb/               # Breadcrumb navigation
│   │   ├── Breadcrumb.module.css
│   │   └── Breadcrumb.tsx
│   │
│   ├── Footer/                   # Site footer
│   │   ├── Footer.module.css
│   │   └── Footer.tsx
│   │
│   ├── Header/                   # Site header/navigation
│   │   ├── Header.module.css
│   │   └── Header.tsx
│   │
│   ├── Hero/                     # Hero section with search
│   │   ├── Hero.module.css
│   │   └── Hero.tsx
│   │
│   └── MarketingSections/        # Marketing content sections
│       ├── MarketingSections.module.css
│       └── MarketingSections.tsx
│
└── viewer/                       # Instagram viewer components
    ├── UserList.module.css       # User list component styles
    ├── UserList.tsx              # User list component
    │
    ├── FollowersList/            # Followers list (directory exists)
    ├── FollowsList/              # Follows list (directory exists)
    │
    ├── MediaModal/               # Media modal component
    │   ├── MediaModal.module.css
    │   └── MediaModal.tsx
    │
    ├── MiniProfile/              # Mini profile component
    │   ├── MiniProfile.module.css
    │   └── MiniProfile.tsx
    │
    ├── PostsGrid/                # Posts grid component
    │   ├── PostsGrid.module.css
    │   └── PostsGrid.tsx
    │
    ├── ProfileView/              # Main profile view component
    │   ├── ProfileView.module.css
    │   └── ProfileView.tsx
    │
    ├── SkeletonLoader/           # Loading skeleton
    │   ├── SkeletonLoader.module.css
    │   └── SkeletonLoader.tsx
    │
    └── TabNav/                   # Tab navigation (directory exists)
```

#### Libraries (`src/lib/`)
```
src/lib/
├── blogData.ts                   # Static blog content data
└── instagram.ts                  # Instagram API integration
```

#### Styles (`src/styles/`)
```
src/styles/
├── components.css                # Reusable component styles
├── global.css                    # Global styles and imports
├── LegalPage.module.css          # Legal page styles
├── typography.css                # Typography system
├── variables.css                 # CSS custom properties/design tokens
└── variables.css
```

## Key Components Detailed

### 1. Layout Components

#### `Header.tsx`
- Navigation menu with links to all main pages
- Responsive design with mobile considerations
- Logo and site branding

#### `Footer.tsx`
- Site footer with links to legal pages
- Copyright information
- Social media links (placeholder)

#### `Hero.tsx`
- Main search interface for Instagram usernames
- Search history with localStorage persistence
- Auto-complete functionality
- Welcome banner and instructions

#### `MarketingSections.tsx`
- Feature highlights and value propositions
- Call-to-action sections
- Trust indicators and benefits

### 2. Viewer Components

#### `ProfileView.tsx`
- Main profile display component
- Profile stats (posts, followers, following)
- Bio information and verification badges
- Tab navigation between content types

#### `PostsGrid.tsx`
- Grid layout for Instagram posts
- Media thumbnails with like/comment counts
- Video indicators and sidecar album markers

#### `UserList.tsx`
- List of followers/following users
- Profile pictures and usernames
- Verification and privacy status indicators

#### `MiniProfile.tsx`
- Compact profile summary for tab views
- Key statistics display
- Quick actions and information

#### `SkeletonLoader.tsx`
- Loading state UI for profile data
- Animated placeholder elements
- Mimics actual component structure

### 3. Page Components

#### Homepage (`src/app/page.tsx`)
- Simple composition of Hero and MarketingSections
- Client-side component for interactivity
- Entry point for the application

#### Profile Viewer (`src/app/[username]/page.tsx`)
- Dynamic route handling for usernames
- Data fetching with loading states
- Tab management and content rendering
- Error handling and user feedback

#### Content Pages
- **About**: Company mission, values, and team
- **Blog**: Articles about Instagram privacy and usage
- **Contact**: User contact form (static)
- **Legal**: Disclaimer, Privacy Policy, Terms of Service

## Data Flow Architecture

### API Integration Flow
```
User Input → Hero Component → Router Navigation → [username]/page.tsx
    ↓
Server Action (fetchProfile) → actions.ts → instagram.ts
    ↓
Facebook Graph API → Instagram Business Discovery
    ↓
Response Processing → Profile Data → Component Rendering
```

### State Management
- **React Hooks**: `useState`, `useEffect`, `useRef`, `useRouter`
- **URL State**: Dynamic route parameters for usernames
- **Local Storage**: Search history persistence
- **Component State**: Tab selection, loading states, error messages

### Server Actions
- `fetchProfile(username)`: Main data fetching function
- Server-side execution for API key security
- Error handling and response formatting

## Styling System

### CSS Architecture
- **CSS Modules**: Scoped component styles
- **Design Tokens**: Centralized in `variables.css`
- **Typography System**: `typography.css` for font scaling
- **Component Library**: `components.css` for reusable patterns

### Design Tokens (`variables.css`)
- **Colors**: Dark theme with purple/pink accents
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl)
- **Transitions**: Cubic bezier timing functions
- **Border Radius**: Consistent rounding values
- **Glassmorphism**: Semi-transparent backgrounds with blur

### Responsive Design
- Mobile-first approach
- Flexbox and CSS Grid layouts
- Media queries for breakpoints
- Fluid typography and spacing

## API Integration

### Instagram API (`src/lib/instagram.ts`)
- **Endpoint**: Facebook Graph API v22.0
- **Authentication**: Instagram Business Account token
- **Method**: Business Discovery query
- **Data Retrieved**:
  - Profile information (username, bio, stats)
  - Media posts (images, videos, carousels) with captions
  - Stories (if available) with captions
  - Profile picture and metadata

### Highlights & Captions Feature
- **Highlights Implementation**:
  - Instagram Business Discovery API does not support highlights field
  - Fallback logic creates enhanced mock highlights using real post data
  - Highlights include captions extracted from posts or generated descriptions
  - Each highlight contains: title, cover image, caption, media URL, media count, creation date
  
- **Caption Extraction**:
  - Posts: Captions fetched directly from Instagram API (`media.caption`)
  - Stories: Captions fetched from API (`stories.caption`)
  - Highlights: Captions derived from post captions or generated descriptions
  
- **UI Display**:
  - ProfileView: Highlights display with captions (truncated for space)
  - MediaModal: Full caption display in sidebar with dedicated styling
  - PostsGrid: Captions available in post data structure

### Environment Configuration
- **Required**: `INSTAGRAM_ACCESS_TOKEN` in `.env.local`
- **API Version**: Hardcoded to v22.0
- **Base URL**: `https://graph.facebook.com/v22.0`

### Error Handling
- Token validation and availability checks
- API error response parsing
- Graceful fallbacks and user feedback
- Console logging for debugging

## Development Scripts

### Available Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Development Server
- **Port**: 3000 (default)
- **Hot Reload**: Enabled
- **Type Checking**: On save
- **Error Overlay**: Next.js development error overlay

## Build Configuration

### Next.js Config (`next.config.ts`)
- Minimal configuration
- TypeScript support
- App Router enabled

### TypeScript Config (`tsconfig.json`)
- Strict mode enabled
- Path aliases (`@/*` → `./src/*`)
- React JSX transform
- ES2017 target

### ESLint Config (`eslint.config.mjs`)
- Next.js recommended rules
- TypeScript integration
- Import sorting

## Deployment Considerations

### Build Output
- Static optimization for static pages
- Server components for dynamic content
- Image optimization via Next.js Image

### Environment Requirements
- Node.js environment
- Instagram Business Account token
- Sufficient memory for build process

### Performance Optimizations
- Automatic code splitting
- Image optimization
- Font optimization via `next/font`
- Route-based bundling

## Security Features

### Privacy Protection
- No user authentication required
- No personal data collection
- Local storage only for search history
- Server-side API calls protect client IP

### API Security
- Token stored server-side only
- Environment variable protection
- Error messages sanitized
- No sensitive data in client bundles

### Content Security
- Public Instagram data only
- No private account access
- Ethical use guidelines in legal pages
- Rate limiting considerations

## Testing & Quality

### Code Quality
- TypeScript strict mode
- ESLint configuration
- Consistent code formatting
- Component prop typing

### Development Tools
- VS Code integration
- Hot reload for rapid development
- Type checking on save
- Console logging for debugging

## Future Development Areas

### Potential Enhancements
1. **Testing Suite**: Jest/React Testing Library
2. **Analytics**: Privacy-focused analytics (Plausible)
3. **Internationalization**: Multi-language support
4. **PWA Features**: Offline capabilities
5. **Caching**: API response caching
6. **Rate Limiting**: Protection against abuse
7. **User Accounts**: Optional account features
8. **Export Features**: Data export capabilities

### Maintenance Considerations
- Instagram API version updates
- Token rotation and management
- Performance monitoring
- Security updates
- Dependency updates

---

*Last Updated: 2026-04-15*
*Development Server: Running on http://localhost:3000*