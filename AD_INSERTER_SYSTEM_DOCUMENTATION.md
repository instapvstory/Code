# Ad Inserter System Documentation

## Overview

The Ad Inserter System is a comprehensive solution for managing and displaying advertisements from Google AdSense and other ad networks anywhere on your website or within content. The system provides flexible ad placement, targeting options, and analytics tracking.

## Features

### 1. **Multi-Network Support**
- Google AdSense (automatic script injection)
- Custom HTML ads
- JavaScript-based ad scripts
- HTML banner ads

### 2. **Flexible Placement Options**
- Header, footer, sidebar
- Before/after content
- Between paragraphs (automatic insertion)
- After specific paragraphs (p1, p2, p3, etc.)
- Between content blocks

### 3. **Advanced Targeting**
- Device targeting (desktop, mobile, tablet, all)
- Category-based targeting
- Tag-based targeting
- Date range scheduling
- Impression/click limits

### 4. **Analytics & Tracking**
- Automatic view tracking
- Click tracking
- Revenue tracking (manual)
- Daily performance statistics

### 5. **Admin Management**
- Full CRUD operations for ads
- Real-time statistics dashboard
- Status management (active, inactive, testing)
- Priority-based ad selection

## Database Schema

### Ads Table
```sql
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'custom', -- 'adsense', 'custom', 'html', 'script'
    placement VARCHAR(50) NOT NULL DEFAULT 'after_content',
    code TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'testing'
    target_devices VARCHAR(50) DEFAULT 'all', -- 'all', 'desktop', 'mobile', 'tablet'
    target_categories UUID[] DEFAULT '{}',
    target_tags UUID[] DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_impressions INTEGER,
    max_clicks INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Ad Stats Table
```sql
CREATE TABLE ad_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ad_id, date)
);
```

## API Endpoints

### Public Endpoints

#### 1. GET `/api/ads`
Fetch ads for public display with filtering.

**Query Parameters:**
- `placement` - Ad placement location
- `device` - Target device (default: 'all')
- `status` - Ad status (default: 'active')
- `category` - Category ID for targeting
- `tags` - Comma-separated tag IDs
- `limit` - Maximum ads to return (default: 1)

**Response:**
```json
{
  "success": true,
  "data": [/* array of ad objects */],
  "count": 5
}
```

#### 2. POST `/api/ads`
Track ad view (for analytics).

**Request Body:**
```json
{
  "adId": "ad-uuid-here"
}
```

#### 3. POST `/api/ads/[id]/click`
Track ad click.

**Response:**
```json
{
  "success": true,
  "message": "Ad click tracked"
}
```

### Admin Endpoints

#### 1. GET `/api/admin/ads`
Fetch all ads with pagination (requires admin authentication).

#### 2. POST `/api/admin/ads`
Create new ad (requires admin authentication).

#### 3. GET/PUT/DELETE `/api/admin/ads/[id]`
Manage individual ads (requires admin authentication).

## Components

### 1. `AdInserter` Component
The core component for inserting ads anywhere in your site.

**Props:**
```typescript
interface AdInserterProps {
  placement: string;           // Ad placement location
  categoryId?: string;         // Optional category ID for targeting
  tagIds?: string[];          // Optional tag IDs for targeting
  device?: 'all' | 'desktop' | 'mobile' | 'tablet';
  className?: string;          // Additional CSS classes
  fallbackContent?: React.ReactNode; // Content to show if no ad available
}
```

**Usage:**
```jsx
<AdInserter
  placement="after_content"
  categoryId="category-uuid"
  tagIds={["tag1-uuid", "tag2-uuid"]}
  device="desktop"
  className="my-4"
  fallbackContent={<div>No ads available</div>}
/>
```

### 2. `ContentAdInserter` Component
Automatically inserts ads between paragraphs in content.

**Props:**
```typescript
interface ContentAdInserterProps {
  content: string;            // HTML content
  categoryId?: string;        // Optional category ID
  tagIds?: string[];         // Optional tag IDs
  adFrequency?: number;      // Insert ad after every N paragraphs (default: 3)
  className?: string;        // Additional CSS classes
}
```

**Usage:**
```jsx
<ContentAdInserter
  content={articleContent}
  categoryId={articleCategoryId}
  tagIds={articleTagIds}
  adFrequency={2}
  className="article-content"
/>
```

## Usage Examples

### Example 1: Basic Ad Placement
```jsx
import AdInserter from '@/components/ads/AdInserter';

function ArticlePage() {
  return (
    <div>
      <h1>Article Title</h1>
      
      {/* Ad before content */}
      <AdInserter placement="before_content" />
      
      <div className="content">
        {/* Article content here */}
      </div>
      
      {/* Ad after content */}
      <AdInserter placement="after_content" />
      
      {/* Sidebar ad */}
      <aside>
        <AdInserter placement="sidebar" />
      </aside>
    </div>
  );
}
```

### Example 2: Content with Automatic Ad Insertion
```jsx
import ContentAdInserter from '@/components/ads/ContentAdInserter';

function BlogPost({ post }) {
  return (
    <div className="blog-post">
      <h1>{post.title}</h1>
      <ContentAdInserter
        content={post.content}
        categoryId={post.categoryId}
        tagIds={post.tags.map(tag => tag.id)}
        adFrequency={3}
      />
    </div>
  );
}
```

### Example 3: Targeted Ads
```jsx
function CategoryPage({ category }) {
  return (
    <div>
      <h1>{category.name}</h1>
      
      {/* Category-specific ad */}
      <AdInserter
        placement="header"
        categoryId={category.id}
        device="desktop"
      />
      
      {/* List of articles */}
      {category.articles.map(article => (
        <div key={article.id}>
          <h2>{article.title}</h2>
          <AdInserter
            placement="after_content"
            categoryId={category.id}
            tagIds={article.tags.map(tag => tag.id)}
          />
        </div>
      ))}
    </div>
  );
}
```

## Admin Interface

### Accessing Admin Panel
1. Navigate to `/admin/login`
2. Login with admin credentials
3. Go to `/admin/ads` to manage advertisements

### Admin Features
- **Create Ads**: Add new ads with targeting options
- **Edit Ads**: Modify existing ads
- **Delete Ads**: Remove ads from the system
- **Status Management**: Activate/deactivate ads
- **Statistics View**: See performance metrics
- **Priority Setting**: Control which ads show first

## Ad Types

### 1. Google AdSense
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-123456789"
     data-ad-slot="1234567890"
     data-ad-format="auto"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

### 2. Custom HTML
```html
<div class="custom-ad">
  <a href="https://example.com">
    <img src="/ads/banner.jpg" alt="Advertisement" />
  </a>
</div>
```

### 3. JavaScript Script
```html
<script src="https://adnetwork.com/widget.js" async></script>
<div id="ad-widget-container"></div>
```

## Best Practices

### 1. **Ad Placement**
- Place ads where they're visible but not intrusive
- Use `before_content` and `after_content` for article pages
- Use `sidebar` for sidebar widgets
- Use `header` and `footer` for site-wide ads

### 2. **Targeting Strategy**
- Use category targeting for relevant content
- Use tag targeting for specific topics
- Schedule ads for peak traffic times
- Set impression limits to avoid ad fatigue

### 3. **Performance Optimization**
- Use lazy loading for ads below the fold
- Implement ad blocking detection
- Monitor ad performance regularly
- Rotate ads to maintain user engagement

### 4. **User Experience**
- Ensure ads don't interfere with content
- Use appropriate ad sizes
- Implement responsive ad designs
- Provide fallback content when ads are blocked

## Testing

### Demo Page
Visit `/ads-demo` to see the ad inserter system in action with examples of all placement options.

### Testing Ads
1. Create test ads with status "testing"
2. Use the demo page to verify placement
3. Check analytics tracking
4. Test different targeting options

## Troubleshooting

### Common Issues

#### 1. **Ads Not Showing**
- Check ad status is "active"
- Verify placement matches component placement prop
- Check date range (start_date/end_date)
- Verify targeting criteria match current page

#### 2. **Analytics Not Tracking**
- Check API endpoints are accessible
- Verify ad ID exists in database
- Check browser console for errors
- Ensure CORS headers are properly set

#### 3. **Ad Code Not Executing**
- For script-based ads, ensure scripts are allowed
- Check for content security policy restrictions
- Verify HTML is properly sanitized
- Test ad code in isolation first

#### 4. **Performance Issues**
- Implement lazy loading for below-fold ads
- Use ad placeholders during loading
- Monitor network requests
- Consider ad caching strategies

## Security Considerations

### 1. **Input Sanitization**
- All ad code is sanitized before rendering
- Script tags are allowed for AdSense and custom scripts
- HTML is escaped to prevent XSS attacks

### 2. **API Security**
- Admin endpoints require authentication
- Public endpoints have rate limiting
- Input validation on all API requests
- SQL injection prevention through Supabase

### 3. **Content Security**
- Implement CSP headers for external scripts
- Sandbox iframe-based ads
- Monitor for malicious ad code
- Regular security audits

## Deployment

### 1. **Database Setup**
Run the SQL scripts in `database/seo_monetization_schema.sql` to create the necessary tables.

### 2. **Environment Variables**
Ensure these environment variables are set:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. **Build Process**
```bash
npm run build
npm start
```

### 4. **Monitoring**
- Monitor ad performance metrics
- Track revenue and CTR
- Watch for ad blocking rates
- Monitor page load performance

## Conclusion

The Ad Inserter System provides a robust, flexible solution for monetizing your website with advertisements. With support for multiple ad networks, advanced targeting options, and comprehensive analytics, it's designed to maximize revenue while maintaining a good user experience.

For additional support or feature requests, refer to the admin documentation or contact the development team.