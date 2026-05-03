# Blog CMS Admin Dashboard - API Endpoints Structure

## Overview
This document outlines the complete REST API architecture for the Blog CMS Admin Dashboard, following RESTful principles with proper authentication, validation, and error handling.

## Base URL
```
https://api.yourdomain.com/admin/v1
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header.

## Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

## API Endpoints

### 1. Authentication

#### `POST /auth/login`
**Description:** Authenticate admin user
**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "avatar_url": "https://..."
    },
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

#### `POST /auth/logout`
**Description:** Invalidate current session
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `POST /auth/refresh`
**Description:** Refresh access token
**Request Body:**
```json
{
  "refresh_token": "refresh_token"
}
```
**Response:** Same as login response

#### `GET /auth/validate`
**Description:** Validate current session
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    },
    "valid": true
  }
}
```

### 2. Dashboard

#### `GET /dashboard/stats`
**Description:** Get dashboard statistics
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `period`: `today`, `week`, `month`, `year` (default: `month`)
- `compare_with_previous`: `true`/`false` (default: `true`)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_posts": 150,
      "published_posts": 120,
      "draft_posts": 30,
      "total_views": 50000,
      "total_comments": 1200,
      "total_users": 50
    },
    "traffic": {
      "current_period": {
        "visitors": 10000,
        "pageviews": 25000,
        "bounce_rate": 45.5,
        "avg_session_duration": "00:03:45"
      },
      "previous_period": {
        "visitors": 8500,
        "pageviews": 21000,
        "bounce_rate": 48.2,
        "avg_session_duration": "00:03:20"
      },
      "change_percentage": {
        "visitors": 17.6,
        "pageviews": 19.0,
        "bounce_rate": -5.6,
        "avg_session_duration": 7.8
      }
    },
    "top_posts": [
      {
        "id": "uuid",
        "title": "How to Optimize SEO",
        "views": 5000,
        "likes": 120,
        "comments": 45,
        "published_at": "2024-01-15T10:30:00Z"
      }
    ],
    "recent_activity": [
      {
        "id": "uuid",
        "user": {
          "name": "John Doe",
          "avatar_url": "https://..."
        },
        "action": "post_published",
        "resource": {
          "type": "post",
          "id": "uuid",
          "title": "New Blog Post"
        },
        "timestamp": "2024-01-20T14:30:00Z"
      }
    ]
  }
}
```

### 3. Posts Management

#### `GET /posts`
**Description:** List posts with filtering and pagination
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: `draft`, `published`, `scheduled`, `archived`, `trash`
- `category_id`: Filter by category
- `author_id`: Filter by author
- `search`: Search in title and content
- `sort_by`: `created_at`, `updated_at`, `published_at`, `title`, `views`
- `sort_order`: `asc`, `desc` (default: `desc`)
- `date_from`: Filter posts from date (YYYY-MM-DD)
- `date_to`: Filter posts to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid",
        "title": "Blog Post Title",
        "slug": "blog-post-slug",
        "excerpt": "Post excerpt...",
        "featured_image": "https://...",
        "author": {
          "id": "uuid",
          "name": "Author Name",
          "avatar_url": "https://..."
        },
        "category": {
          "id": "uuid",
          "name": "Category Name",
          "slug": "category-slug"
        },
        "tags": [
          {
            "id": "uuid",
            "name": "Tag Name",
            "slug": "tag-slug"
          }
        ],
        "status": "published",
        "published_at": "2024-01-15T10:30:00Z",
        "reading_time": 5,
        "word_count": 1200,
        "view_count": 5000,
        "comment_count": 25,
        "like_count": 120,
        "seo_score": 85,
        "created_at": "2024-01-10T14:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

#### `GET /posts/{id}`
**Description:** Get single post by ID
**Headers:** `Authorization: Bearer {token}`
**Response:** Single post object with full details

#### `POST /posts`
**Description:** Create new post
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "title": "New Blog Post",
  "slug": "new-blog-post",
  "content": {
    "type": "doc",
    "content": [...]
  },
  "excerpt": "Post excerpt...",
  "featured_image": "https://...",
  "category_id": "uuid",
  "tag_ids": ["uuid1", "uuid2"],
  "status": "draft",
  "published_at": "2024-01-25T10:00:00Z",
  "seo_title": "SEO Optimized Title",
  "meta_description": "SEO meta description...",
  "focus_keyword": "blog seo",
  "canonical_url": "https://...",
  "og_title": "Open Graph Title",
  "og_description": "Open Graph Description",
  "og_image": "https://...",
  "twitter_title": "Twitter Card Title",
  "twitter_description": "Twitter Card Description",
  "twitter_image": "https://...",
  "allow_comments": true,
  "is_featured": false
}
```

#### `PUT /posts/{id}`
**Description:** Update existing post
**Headers:** `Authorization: Bearer {token}`
**Request Body:** Same as POST but partial updates allowed

#### `DELETE /posts/{id}`
**Description:** Delete post (move to trash)
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "message": "Post moved to trash"
}
```

#### `POST /posts/{id}/restore`
**Description:** Restore post from trash
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "message": "Post restored successfully"
}
```

#### `DELETE /posts/{id}/permanent`
**Description:** Permanently delete post
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "message": "Post permanently deleted"
}
```

#### `POST /posts/bulk`
**Description:** Bulk operations on posts
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "action": "publish", // publish, draft, trash, delete, move_category
  "post_ids": ["uuid1", "uuid2", "uuid3"],
  "data": {
    "category_id": "uuid" // for move_category action
  }
}
```

#### `GET /posts/{id}/revisions`
**Description:** Get post revision history
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "data": {
    "revisions": [
      {
        "id": "uuid",
        "version": 1,
        "title": "Original Title",
        "content": "...",
        "author": {
          "name": "Author Name",
          "avatar_url": "https://..."
        },
        "created_at": "2024-01-10T14:30:00Z",
        "changes": {
          "title_changed": true,
          "content_changed": true
        }
      }
    ]
  }
}
```

#### `POST /posts/{id}/restore-revision/{revision_id}`
**Description:** Restore post to specific revision
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "message": "Post restored to revision"
}
```

### 4. Categories Management

#### `GET /categories`
**Description:** List categories with hierarchy
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `include_posts_count`: `true`/`false` (default: `true`)
- `parent_id`: Filter by parent category

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Category Name",
        "slug": "category-slug",
        "description": "Category description...",
        "parent_id": null,
        "parent": null,
        "children": [
          {
            "id": "uuid",
            "name": "Subcategory",
            "slug": "subcategory-slug",
            "post_count": 25
          }
        ],
        "post_count": 50,
        "seo_title": "SEO Title",
        "meta_description": "SEO Description",
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-15T14:30:00Z"
      }
    ]
  }
}
```

#### `GET /categories/{id}`
**Description:** Get single category
**Headers:** `Authorization: Bearer {token}`

#### `POST /categories`
**Description:** Create new category
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description...",
  "parent_id": "uuid",
  "seo_title": "SEO Title",
  "meta_description": "SEO Description"
}
```

#### `PUT /categories/{id}`
**Description:** Update category
**Headers:** `Authorization: Bearer {token}`

#### `DELETE /categories/{id}`
**Description:** Delete category
**Headers:** `Authorization: Bearer {token}`
**Validation:** Cannot delete if has posts or children

### 5. Tags Management

#### `GET /tags`
**Description:** List tags
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `search`: Search tag names
- `sort_by`: `name`, `post_count` (default: `name`)
- `limit`: Items per page (default: 50)

#### `POST /tags`
**Description:** Create or get existing tag
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "name": "Tag Name"
}
```

#### `DELETE /tags/{id}`
**Description:** Delete tag
**Headers:** `Authorization: Bearer {token}`

### 6. Media Library

#### `GET /media`
**Description:** List media files
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `page`, `limit`: Pagination
- `file_type`: `image`, `video`, `document`, `audio`
- `search`: Search filename, alt_text
- `uploaded_by`: Filter by user
- `date_from`, `date_to`: Filter by upload date
- `sort_by`: `created_at`, `file_size`, `filename`

**Response:**
```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "uuid",
        "filename": "image.jpg",
        "original_name": "my-photo.jpg",
        "file_type": "image",
        "file_size": 2048000,
        "mime_type": "image/jpeg",
        "url": "https://cdn.example.com/media/image.jpg",
        "thumbnail_url": "https://cdn.example.com/media/thumbnails/image.jpg",
        "optimized_url": "https://cdn.example.com/media/optimized/image.webp",
        "width": 1920,
        "height": 1080,
        "alt_text": "Description of image",
        "caption": "Image caption",
        "description": "Detailed description",
        "uploaded_by": {
          "id": "uuid",
          "name": "Uploader Name",
          "avatar_url": "https://..."
        },
        "folder_path": "/blog/",
        "is_public": true,
        "metadata": {
          "color_palette": ["#ff0000", "#00ff00"],
          "dominant_color": "#ff0000"
        },
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### `POST /media/upload`
**Description:** Upload media file(s)
**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`
**Form Data:**
- `files[]`: One or more files
- `alt_text`: Default alt text for all files
- `folder_path`: Target folder (default: `/`)
- `optimize_images`: `true`/`false` (default: `true`)

**Response:** Array of uploaded media objects

#### `PUT /media/{id}`
**Description:** Update media metadata
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "alt_text": "Updated alt text",
  "caption": "Updated caption",
  "description": "Updated description",
  "folder_path": "/new-folder/"
}
```

#### `DELETE /media/{id}`
**Description:** Delete media file
**Headers:** `Authorization: Bearer {token}`

#### `POST /media/{id}/optimize`
**Description:** Optimize image (compress, convert to WebP)
**Headers:** `Authorization: Bearer {token}`

### 7. SEO Management

#### `GET /seo/settings`
**Description:** Get global SEO settings
**Headers:** `Authorization: Bearer {token}`

#### `PUT /seo/settings`
**Description:** Update global SEO settings
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "site_title": "My Blog",
  "site_description": "A modern blog",
  "site_url": "https://example.com",
  "default_meta_title": "{title} | My Blog",
  "default_meta_description": "{excerpt}",
  "default_meta_image": "https://...",
  "twitter_handle": "@myblog",
  "facebook_app_id": "123456789",
  "robots_txt": "User-agent: *\nAllow: /",
  "organization_schema": {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "My Blog"
  },
  "social_profiles": {
    "facebook": "https://facebook.com/myblog",
    "twitter": "https://twitter.com/myblog"
  }
}
```

#### `POST /seo/generate-sitemap`
**Description:** Generate/regenerate XML sitemap
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "data": {
    "sitemap_url": "https://example.com/sitemap.xml",
    "generated_at": "2024-01-20T14:30:00Z",
    "url_count": 150
  }
}
```

#### `POST /seo/analyze`
**Description:** Analyze content for SEO
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "content": "Blog post content...",
  "title": "Post Title",
  "focus_keyword": "blog seo"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "factors": [
      {
        "name": "title_length",
        "score": 90,
        "status": "good",
        "message": "Title length is optimal (55 characters)"
      },
      {
        "name": "keyword_density",
        "score": 70,
        "status": "warning",
        "message": "Keyword density is 1.2% (optimal: 1-2%)"
      }
    ],
    "suggestions": [
      "Add more internal links",
      "Include image alt text"
    ]
  }
}
```

### 8. Analytics Integration

#### `GET /analytics/integrations`
**Description:** List connected analytics services
**Headers:** `Authorization: Bearer {token}`

#### `POST /analytics/integrations/google`
**Description:** Connect Google Analytics/Search Console
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "service": "google_analytics", // or "google_search_console"
  "api_key": "encrypted_api_key",
  "property_id": "UA-12345678-1",
  "measurement_id": "G-ABCDEFGHIJ"
}
```

#### `DELETE /analytics/integrations/{id}`
**Description:** Disconnect analytics service
**Headers:** `Authorization: Bearer {token}`

#### `GET /analytics/summary`
**Description:** Get analytics summary
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `period`: `today`, `week`, `month`, `year` (default: `month`)
- `metrics`: Comma-separated list of metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "traffic": {
      "visitors": 10000,
      "pageviews": 25000,
      "sessions": 12000,
      "bounce_rate": 45.5,
      "avg_session_duration": "00:03:45"
    },
    "sources": {
      "direct": 3000,
      "organic": 5000,
      "social": 1500,
      "referral": 500
    },
    "top_pages": [
      {
        "path": "/blog/seo-guide",
        "title": "SEO Guide",
        "views": 5000,
        "avg_time": "00:04:30"
      }
    ],
    "keywords": [
      {
        "keyword": "blog seo tips",
        "clicks": 1200,
        "impressions": 50000,
        "ctr": 2.4,
        "position": 3.2
      }
    ]
  }
}
```

#### `POST /analytics/sync`
**Description:** Manually sync analytics data
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `force`: `true`/`false` (default: `false`)

### 9. Domain Management

#### `GET /domains`
**Description:** List registered domains
**Headers:** `Authorization: Bearer {token}`

#### `POST /domains`
**Description:** Add new domain
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "domain": "example.com",
  "display_name": "My Blog",
  "verification_method": "dns_txt"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "domain": {
      "id": "uuid",
      "domain": "example.com",
      "verification_method": "dns_txt",
      "verification_token": "google-site-verification=abc123",
      "verification_file_content": "google-site-verification: abc123.html",
      "is_verified": false,
      "ssl_status": "unknown",
      "instructions": {
        "dns_txt": "Add TXT record: google-site-verification=abc123",
        "html_file": "Upload file to root directory..."
      }
    }
  }
}
```

#### `POST /domains/{id}/verify`
**Description:** Verify domain ownership
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "verified_at": "2024-01-20T14:30:00Z",
    "ssl_status": "active",
    "ssl_expires_at": "2025-01-20T14:30:00Z"
  }
}
```

#### `DELETE /domains/{id}`
**Description:** Remove domain
**Headers:** `Authorization: Bearer {token}`

### 10. User Management

#### `GET /users`
**Description:** List users
**Headers:** `Authorization: Bearer {token}`
**Query Parameters:**
- `role`: Filter by role
- `search`: Search by name/email
- `is_active`: `true`/`false`

#### `GET /users/{id}`
**Description:** Get user details
**Headers:** `Authorization: Bearer {token}`

#### `POST /users`
**Description:** Create new user
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "role": "author",
  "password": "securepassword",
  "bio": "User biography...",
  "website": "https://userwebsite.com"
}
```

#### `PUT /users/{id}`
**Description:** Update user
**Headers:** `Authorization: Bearer {token}`

#### `DELETE /users/{id}`
**Description:** Deactivate user
**Headers:** `Authorization: Bearer {token}`

### 11. System Settings

#### `GET /settings`
**Description:** Get system settings
**Headers:** `Authorization: Bearer {token}`

#### `PUT /settings`
**Description:** Update system settings
**Headers:** `Authorization: Bearer {token}`
**Request Body:**
```json
{
  "site_name": "My Blog",
  "site_description": "A modern blog platform",
  "timezone": "UTC",
  "date_format": "YYYY-MM-DD",
  "posts_per_page": 10,
  "comments_enabled": true,
  "registration_enabled": false,
  "maintenance_mode": false,
  "cache_enabled": true,
  "cdn_url": "https://cdn.example.com"
}
```

## Rate Limiting
- Authentication endpoints: 10 requests per minute
- Read endpoints: 100 requests per minute
- Write endpoints: 30 requests per minute
- Bulk operations: 5 requests per minute

## Error Codes
- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: Invalid or expired token
- `PERMISSION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server error

## Versioning
API version is included in the URL path (`/admin/v1/`). Breaking changes will increment the version number.

## CORS
- Allowed origins: Configured domains
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Authorization, Content-Type, X-Requested-With