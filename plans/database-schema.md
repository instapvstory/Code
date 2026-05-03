# Database Schema Design

## Overview
This document outlines the PostgreSQL database schema for the Instapvstory.com application. The schema stores Instagram profile data, posts, highlights, and stories to reduce external API calls and improve performance.

## Tables

### 1. `profiles`
Stores Instagram user profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal unique identifier |
| `instagram_id` | VARCHAR(255) | UNIQUE NOT NULL | Instagram's internal ID (from Graph API) |
| `username` | VARCHAR(150) | UNIQUE NOT NULL | Instagram username (unique) |
| `full_name` | VARCHAR(255) | | User's full name |
| `bio` | TEXT | | Biography text |
| `website` | VARCHAR(500) | | Website URL |
| `category` | VARCHAR(100) | | Business category (if business account) |
| `is_verified` | BOOLEAN | DEFAULT false | Whether the account is verified |
| `is_business_account` | BOOLEAN | DEFAULT false | Whether it's a business account |
| `profile_pic_url` | VARCHAR(500) | | URL of profile picture |
| `posts_count` | INTEGER | DEFAULT 0 | Total number of posts |
| `followers_count` | INTEGER | DEFAULT 0 | Number of followers |
| `following_count` | INTEGER | DEFAULT 0 | Number of accounts followed |
| `has_story` | BOOLEAN | DEFAULT false | Whether the user has an active story |
| `last_synced_at` | TIMESTAMPTZ | | When data was last synced from Instagram |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Indexes:**
- `idx_profiles_username` ON `profiles` (`username`)
- `idx_profiles_instagram_id` ON `profiles` (`instagram_id`)
- `idx_profiles_last_synced` ON `profiles` (`last_synced_at`)

### 2. `posts`
Stores individual posts (including images, videos, carousels).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal unique identifier |
| `instagram_id` | VARCHAR(255) | UNIQUE NOT NULL | Instagram's post ID |
| `profile_id` | UUID | FOREIGN KEY REFERENCES `profiles`(`id`) ON DELETE CASCADE | Reference to profile |
| `thumb_url` | VARCHAR(500) | | Thumbnail image URL |
| `media_url` | VARCHAR(500) | | URL of the actual media (image/video) |
| `likes` | INTEGER | DEFAULT 0 | Number of likes |
| `comments` | INTEGER | DEFAULT 0 | Number of comments |
| `is_video` | BOOLEAN | DEFAULT false | Whether the post is a video |
| `is_sidecar` | BOOLEAN | DEFAULT false | Whether the post is a carousel (multiple media) |
| `caption` | TEXT | | Post caption |
| `posted_at` | TIMESTAMPTZ | | When the post was published on Instagram |
| `synced_at` | TIMESTAMPTZ | DEFAULT NOW() | When this record was synced |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_posts_profile_id` ON `posts` (`profile_id`)
- `idx_posts_instagram_id` ON `posts` (`instagram_id`)
- `idx_posts_posted_at` ON `posts` (`posted_at`) DESC

### 3. `highlights`
Stores Instagram story highlights.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal unique identifier |
| `instagram_id` | VARCHAR(255) | UNIQUE NOT NULL | Instagram's highlight ID |
| `profile_id` | UUID | FOREIGN KEY REFERENCES `profiles`(`id`) ON DELETE CASCADE | Reference to profile |
| `title` | VARCHAR(255) | | Highlight title |
| `cover_url` | VARCHAR(500) | | Cover image URL |
| `caption` | TEXT | | Optional caption |
| `media_url` | VARCHAR(500) | | URL of the highlight media (if single) |
| `media_count` | INTEGER | DEFAULT 1 | Number of items in the highlight |
| `created_at` | TIMESTAMPTZ | | When the highlight was created on Instagram |
| `synced_at` | TIMESTAMPTZ | DEFAULT NOW() | When this record was synced |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_highlights_profile_id` ON `highlights` (`profile_id`)
- `idx_highlights_instagram_id` ON `highlights` (`instagram_id`)

### 4. `stories`
Stores active stories (short-lived, expire after 24 hours).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal unique identifier |
| `instagram_id` | VARCHAR(255) | UNIQUE NOT NULL | Instagram's story ID |
| `profile_id` | UUID | FOREIGN KEY REFERENCES `profiles`(`id`) ON DELETE CASCADE | Reference to profile |
| `thumb_url` | VARCHAR(500) | | Thumbnail URL |
| `media_url` | VARCHAR(500) | | URL of the story media |
| `is_video` | BOOLEAN | DEFAULT false | Whether the story is a video |
| `caption` | TEXT | | Story caption |
| `expires_at` | TIMESTAMPTZ | NOT NULL | When the story expires (24h after posting) |
| `synced_at` | TIMESTAMPTZ | DEFAULT NOW() | When this record was synced |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_stories_profile_id` ON `stories` (`profile_id`)
- `idx_stories_expires_at` ON `stories` (`expires_at`)

### 5. `api_cache` (Optional)
Can be used for caching Instagram API responses (alternative to Redis). However, Redis is preferred for performance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | VARCHAR(500) | PRIMARY KEY | Cache key (e.g., `profile:username`) |
| `value` | JSONB | | Cached response data |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Cache expiration time |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Cache creation time |

**Indexes:**
- `idx_api_cache_expires` ON `api_cache` (`expires_at`)

## Relationships
- **Profile 1 → N Posts**: A profile can have many posts.
- **Profile 1 → N Highlights**: A profile can have many highlights.
- **Profile 1 → N Stories**: A profile can have many stories (active).

## Notes
- The `instagram_id` fields are unique across Instagram's platform and should be used to avoid duplicate entries.
- `last_synced_at` on profiles helps decide when to refresh data.
- Stories are ephemeral; a cron job should delete expired stories periodically.
- Consider adding soft deletes (`deleted_at`) for audit purposes.

## Next Steps
1. Create SQL migration scripts.
2. Set up Prisma schema.
3. Implement database connection and repositories.