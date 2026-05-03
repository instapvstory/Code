# Prisma ORM Implementation Plan

## Overview
This document outlines the implementation of Prisma ORM for the Instapvstory.com application. Prisma will serve as our database ORM layer, providing type-safe database access, migrations, and data modeling.

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (cloud or local)
- Existing Next.js project structure

## Step 1: Install Prisma Dependencies

### Required Packages
```bash
npm install prisma @prisma/client
npm install -D prisma
```

### Update package.json
Add Prisma scripts to package.json:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "prisma:generate": "prisma generate",
  "prisma:studio": "prisma studio",
  "prisma:migrate": "prisma migrate dev",
  "prisma:push": "prisma db push",
  "prisma:pull": "prisma db pull"
}
```

## Step 2: Initialize Prisma

### Initialize Prisma Configuration
```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema definition
- `.env` - Environment variables (already have .env.local)

### Update .env.local with Database URL
Add database connection string to `.env.local`:
```env
INSTAGRAM_ACCESS_TOKEN="EAAMhsSzKmTYBRCiumkg3zgCDb22i7QZCZBMsTxxF8SCKu3jg9N9GRWSO0KeDG5dNas6dzyuvS1PFJ59BKQgZBMWpArw3OQLHxxChEDZC7P0R1qczpvrkwUwh2k8f09OJhcadxd3mW5Yx0IBChyJI8l0UO3O0ZBg5DJi6xmG2bgBrUzxgZBkOiViuhDVTyj5ZCj7"
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

**Note:** Replace with actual Neon/Supabase connection string.

## Step 3: Define Prisma Schema

Create `prisma/schema.prisma` based on our database design:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Profile {
  id                  String    @id @default(uuid())
  instagramId         String    @unique
  username            String    @unique
  fullName            String?
  bio                 String?
  website             String?
  category            String?
  isVerified          Boolean   @default(false)
  isBusinessAccount   Boolean   @default(false)
  profilePicUrl       String?
  postsCount          Int       @default(0)
  followersCount      Int       @default(0)
  followingCount      Int       @default(0)
  hasStory            Boolean   @default(false)
  lastSyncedAt        DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Relations
  posts      Post[]
  highlights Highlight[]
  stories    Story[]
  apiCaches  ApiCache[]
  
  @@index([username])
  @@index([instagramId])
  @@index([lastSyncedAt])
}

model Post {
  id           String   @id @default(uuid())
  instagramId  String   @unique
  profileId    String
  thumbUrl     String?
  mediaUrl     String?
  likes        Int      @default(0)
  comments     Int      @default(0)
  isVideo      Boolean  @default(false)
  isSidecar    Boolean  @default(false)
  caption      String?
  postedAt     DateTime?
  syncedAt     DateTime @default(now())
  createdAt    DateTime @default(now())
  
  // Relations
  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  @@index([profileId])
  @@index([instagramId])
  @@index([postedAt])
}

model Highlight {
  id           String   @id @default(uuid())
  instagramId  String   @unique
  profileId    String
  title        String
  coverUrl     String?
  caption      String?
  mediaUrl     String?
  mediaCount   Int      @default(1)
  createdAt    DateTime?
  syncedAt     DateTime @default(now())
  
  // Relations
  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  @@index([profileId])
  @@index([instagramId])
}

model Story {
  id           String   @id @default(uuid())
  instagramId  String   @unique
  profileId    String
  thumbUrl     String?
  mediaUrl     String?
  isVideo      Boolean  @default(false)
  caption      String?
  expiresAt    DateTime
  syncedAt     DateTime @default(now())
  createdAt    DateTime @default(now())
  
  // Relations
  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  @@index([profileId])
  @@index([expiresAt])
}

model ApiCache {
  id          String   @id @default(uuid())
  key         String   @unique
  value       Json
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Optional relation to profile for profile-specific caching
  profileId   String?
  profile     Profile? @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  @@index([key])
  @@index([expiresAt])
  @@index([profileId])
}
```

## Step 4: Generate Prisma Client

### Generate TypeScript Types
```bash
npx prisma generate
```

This creates:
- `node_modules/.prisma/client` - Generated Prisma Client
- TypeScript types for all models

### Create Prisma Client Singleton
Create `src/lib/prisma.ts`:
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Step 5: Database Migrations

### Initial Migration
```bash
npx prisma migrate dev --name init
```

This creates:
- `prisma/migrations/` - Migration files
- Applies schema to database

### Alternative: Push Schema (for development)
```bash
npx prisma db push
```

## Step 6: Create Database Service Layer

Create `src/services/database.service.ts`:
```typescript
// src/services/database.service.ts
import { prisma } from '@/lib/prisma'
import { Profile, Post as FrontendPost, Highlight as FrontendHighlight } from '@/components/viewer/ProfileView/ProfileView'

export class DatabaseService {
  // Profile operations
  async getProfileByUsername(username: string) {
    return prisma.profile.findUnique({
      where: { username },
      include: {
        posts: {
          orderBy: { postedAt: 'desc' },
          take: 12
        },
        highlights: true,
        stories: {
          where: {
            expiresAt: { gt: new Date() }
          }
        }
      }
    })
  }

  async createOrUpdateProfile(profileData: any) {
    return prisma.profile.upsert({
      where: { username: profileData.username },
      update: {
        fullName: profileData.fullName,
        bio: profileData.bio,
        website: profileData.website,
        category: profileData.category,
        isVerified: profileData.isVerified,
        isBusinessAccount: profileData.isBusinessAccount,
        profilePicUrl: profileData.profilePicUrl,
        postsCount: profileData.postsCount,
        followersCount: profileData.followersCount,
        followingCount: profileData.followingCount,
        hasStory: profileData.hasStory,
        lastSyncedAt: new Date()
      },
      create: {
        instagramId: profileData.instagramId || `temp_${Date.now()}`,
        username: profileData.username,
        fullName: profileData.fullName,
        bio: profileData.bio,
        website: profileData.website,
        category: profileData.category,
        isVerified: profileData.isVerified,
        isBusinessAccount: profileData.isBusinessAccount,
        profilePicUrl: profileData.profilePicUrl,
        postsCount: profileData.postsCount,
        followersCount: profileData.followersCount,
        followingCount: profileData.followingCount,
        hasStory: profileData.hasStory,
        lastSyncedAt: new Date()
      }
    })
  }

  // Post operations
  async syncPosts(profileId: string, posts: FrontendPost[]) {
    // Delete old posts for this profile
    await prisma.post.deleteMany({
      where: { profileId }
    })

    // Create new posts
    return prisma.post.createMany({
      data: posts.map(post => ({
        instagramId: post.id,
        profileId,
        thumbUrl: post.thumbUrl,
        mediaUrl: post.mediaUrl,
        likes: post.likes,
        comments: post.comments,
        isVideo: post.isVideo,
        isSidecar: post.isSidecar,
        caption: post.caption,
        postedAt: new Date() // Would need actual post date from Instagram
      }))
    })
  }

  // Highlight operations
  async syncHighlights(profileId: string, highlights: FrontendHighlight[]) {
    // Delete old highlights for this profile
    await prisma.highlight.deleteMany({
      where: { profileId }
    })

    // Create new highlights
    return prisma.highlight.createMany({
      data: highlights.map(highlight => ({
        instagramId: highlight.id,
        profileId,
        title: highlight.title,
        coverUrl: highlight.coverUrl,
        caption: highlight.caption,
        mediaUrl: highlight.mediaUrl,
        mediaCount: highlight.mediaCount || 1,
        createdAt: highlight.createdAt ? new Date(highlight.createdAt) : new Date()
      }))
    })
  }

  // Cache operations
  async getCache(key: string) {
    const cache = await prisma.apiCache.findUnique({
      where: { key }
    })

    if (!cache || cache.expiresAt < new Date()) {
      return null
    }

    return cache.value
  }

  async setCache(key: string, value: any, ttlSeconds: number = 3600) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
    
    return prisma.apiCache.upsert({
      where: { key },
      update: {
        value,
        expiresAt,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        expiresAt
      }
    })
  }

  async clearExpiredCache() {
    return prisma.apiCache.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
  }
}

export const db = new DatabaseService()
```

## Step 7: Update Existing Instagram Service

Update `src/lib/instagram.ts` to use database:
```typescript
// src/lib/instagram.ts
import { db } from '@/services/database.service'
import { Profile, Post } from '@/components/viewer/ProfileView/ProfileView'

export async function getInstagramProfile(username: string): Promise<Profile> {
  // Check cache first
  const cacheKey = `profile:${username}`
  const cached = await db.getCache(cacheKey)
  
  if (cached) {
    return cached as Profile
  }

  // Check database
  const dbProfile = await db.getProfileByUsername(username)
  
  if (dbProfile && dbProfile.lastSyncedAt && 
      Date.now() - dbProfile.lastSyncedAt.getTime() < 5 * 60 * 1000) {
    // Data is fresh (less than 5 minutes old)
    const profile: Profile = {
      username: dbProfile.username,
      fullName: dbProfile.fullName || '',
      bio: dbProfile.bio || '',
      website: dbProfile.website,
      category: dbProfile.category,
      isVerified: dbProfile.isVerified,
      isBusinessAccount: dbProfile.isBusinessAccount,
      profilePicUrl: dbProfile.profilePicUrl || '',
      posts: dbProfile.postsCount,
      followers: dbProfile.followersCount,
      following: dbProfile.followingCount,
      hasStory: dbProfile.hasStory,
      highlights: dbProfile.highlights.map(h => ({
        id: h.instagramId,
        title: h.title,
        coverUrl: h.coverUrl || '',
        caption: h.caption,
        mediaUrl: h.mediaUrl,
        mediaCount: h.mediaCount,
        createdAt: h.createdAt?.toISOString()
      })),
      postsList: dbProfile.posts.map(p => ({
        id: p.instagramId,
        thumbUrl: p.thumbUrl || '',
        likes: p.likes,
        comments: p.comments,
        isVideo: p.isVideo,
        isSidecar: p.isSidecar,
        mediaUrl: p.mediaUrl,
        caption: p.caption
      })),
      storiesList: dbProfile.stories.map(s => ({
        id: s.instagramId,
        thumbUrl: s.thumbUrl || '',
        likes: 0,
        comments: 0,
        isVideo: s.isVideo,
        isSidecar: false,
        mediaUrl: s.mediaUrl,
        caption: s.caption
      }))
    }

    // Cache for 5 minutes
    await db.setCache(cacheKey, profile, 300)
    return profile
  }

  // Fall back to Instagram API
  const profile = await getInstagramProfileFromAPI(username)
  
  // Save to database
  const savedProfile = await db.createOrUpdateProfile({
    instagramId: `api_${Date.now()}`,
    username: profile.username,
    fullName: profile.fullName,
    bio: profile.bio,
    website: profile.website,
    category: profile.category,
    isVerified: profile.isVerified,
    isBusinessAccount: profile.isBusinessAccount,
    profilePicUrl: profile.profilePicUrl,
    postsCount: profile.posts,
    followersCount: profile.followers,
    followingCount: profile.following,
    hasStory: profile.hasStory
  })

  // Save posts and highlights
  if (savedProfile.id) {
    await db.syncPosts(savedProfile.id, profile.postsList)
    await db.syncHighlights(savedProfile.id, profile.highlights)
  }

  // Cache for 5 minutes
  await db.setCache(cacheKey, profile, 300)
  
  return profile
}

// Original API function (renamed)
async function getInstagramProfileFromAPI(username: string): Promise<Profile> {
  // Existing implementation from instagram.ts
  // ...
}
```

## Step 8: Testing the Implementation

### Test Script
Create `scripts/test-prisma.js`:
```javascript
// scripts/test-prisma.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Testing Prisma connection...')
  
  // Test connection
  await prisma.$connect()
  console.log('✅ Connected to database')
  
  // Test query
  const profiles = await prisma.profile.findMany()
  console.log(`Found ${profiles.length} profiles`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
```

### Run Tests
```bash
node scripts/test-prisma.js
```

## Step 9: Prisma Studio (Optional)

### Launch Prisma Studio
```bash
npx prisma studio
```

Access at: http://localhost:5555

## Step 10: Integration with Next.js

### Update API Routes
Update existing API routes to use Prisma:
```typescript
// src/app/api/profile/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getInstagramProfile } from '@/lib/instagram'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const profile = await getInstagramProfile(params.username)
    return NextResponse.json({ data: profile })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
```

## Step 11: Environment Configuration

### Production Database
For Neon/Supabase, update `.env.local`:
```env
DATABASE_URL="postgresql://neondb_owner:password@ep-cool-breeze-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Development Database
For local development:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/instapvstory"
```

## Step 12: Deployment Considerations

### Build Process
Update `package.json` build script:
```json
"scripts": {
  "build": "prisma generate && next build",
  "postbuild": "prisma generate"
}
```

### Database Migrations in Production
```bash
npx prisma migrate deploy
```

## Next Steps

After implementing Prisma:

1. **Set up Redis caching layer** - For faster cache operations
2. **Create API endpoints** - REST API for frontend
3. **Update frontend** - Use new API endpoints
4. **Implement data sync jobs** - Background jobs to keep data fresh
5. **Add monitoring** - Database performance monitoring

## Troubleshooting

### Common Issues

1. **Connection refused**: Check DATABASE_URL and ensure database is running
2. **Schema mismatch**: Run `npx prisma db push` or `npx prisma migrate dev`
3. **Type errors**: Run `npx prisma generate` to regenerate types
4. **Performance issues**: Add indexes and optimize queries

### Useful Commands

```bash
# Reset database (development)
npx prisma migrate reset

# View database schema
npx prisma db pull

# Generate types only
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Conclusion

This Prisma implementation provides:
- Type-safe database access
- Automatic migrations
- Efficient caching layer
- Scalable architecture
- Easy integration with Next.js

The implementation follows best practices for production-ready applications and prepares the foundation for the caching layer and REST API implementation.