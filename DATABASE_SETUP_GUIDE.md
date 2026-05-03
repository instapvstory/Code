# Database Setup Guide for Blog CMS Admin Dashboard

## Problem
The admin dashboard is currently failing with the error:
```
"Could not find the table 'public.admin_users' in the schema cache"
```

This means the Supabase database doesn't have the required tables for the admin authentication system.

## Solution
You need to run the SQL migration scripts to create the necessary tables in your Supabase database.

## Step-by-Step Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Open: https://app.supabase.com/project/lmhlyoeuduketjclrwws/sql
   - This is the SQL Editor for your project (URL matches your `.env.local` file)

2. **Run the Admin Tables SQL**
   - Copy the entire content from `database/admin_tables.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verify the tables were created**
   - Go to the **Table Editor** in the left sidebar
   - You should see these tables:
     - `admin_users`
     - `admin_sessions`
     - `admin_audit_logs`

4. **Check the default admin user**
   - Click on the `admin_users` table
   - You should see one row with:
     - Email: `admin@example.com`
     - Password: `admin123` (hashed)

### Option 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref lmhlyoeuduketjclrwws

# Run the SQL migration
supabase db execute --file database/admin_tables.sql
```

### Option 3: Using psql (PostgreSQL client)

```bash
# Get your connection string from Supabase Dashboard
# Go to Project Settings -> Database -> Connection string -> URI

# Run the SQL file
psql "postgresql://postgres:[YOUR-PASSWORD]@db.lmhlyoeuduketjclrwws.supabase.co:5432/postgres" -f database/admin_tables.sql
```

## What the SQL Script Creates

### 1. **Admin Users Table** (`admin_users`)
- Stores admin user accounts
- Fields: id, email, name, avatar_url, password_hash, role, is_active, etc.
- Creates a default admin user:
  - Email: `admin@example.com`
  - Password: `admin123`
  - Role: `super_admin`

### 2. **Admin Sessions Table** (`admin_sessions`)
- Manages user login sessions
- Used for authentication persistence

### 3. **Admin Audit Logs Table** (`admin_audit_logs`)
- Optional table for tracking admin activities
- Can be used for security monitoring

## Testing the Setup

After running the SQL:

1. **Restart your Next.js development server** (if it's running)
   ```bash
   # If using npm
   npm run dev
   ```

2. **Go to the admin login page**
   - Open: http://localhost:3000/admin/login

3. **Login with default credentials**
   - Email: `admin@example.com`
   - Password: `admin123`

4. **You should be redirected to the admin dashboard**
   - URL: http://localhost:3000/admin/dashboard

## Security Recommendations

1. **Change the default password immediately**
   - After first login, go to Settings → Change Password
   - Or update directly in the database:
     ```sql
     UPDATE admin_users 
     SET password_hash = '$2a$10$...' -- New bcrypt hash
     WHERE email = 'admin@example.com';
     ```

2. **Create additional admin users**
   - Use the admin dashboard → Users → Add New User
   - Assign appropriate roles (admin, editor, author)

3. **Enable Row Level Security (RLS)**
   - Consider enabling RLS on sensitive tables
   - The current setup doesn't include RLS for simplicity

## Troubleshooting

### "Table still not found" error
- Wait 1-2 minutes for Supabase schema cache to update
- Restart your Next.js dev server
- Clear browser cookies and cache

### "Invalid credentials" error
- Check if the default user was created:
  ```sql
  SELECT * FROM admin_users WHERE email = 'admin@example.com';
  ```
- Verify the password hash matches 'admin123'

### Connection issues
- Verify your `.env.local` file has correct Supabase credentials
- Check if your Supabase project is active (not paused)

## Next Steps

After setting up the admin tables, you may want to:

1. **Create additional CMS tables** (posts, categories, tags)
   - Run `database/blog_cms_schema.sql` for full CMS schema
   - Or let the application create them as needed

2. **Set up database backups**
   - Configure automatic backups in Supabase Dashboard

3. **Monitor database performance**
   - Use Supabase's built-in monitoring tools

## Support

If you continue to experience issues:
1. Check the browser console for errors
2. Check the terminal where `npm run dev` is running
3. Review Supabase logs in the Dashboard
4. Verify network connectivity to Supabase