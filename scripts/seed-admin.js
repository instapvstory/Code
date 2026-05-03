const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

// Use environment variables or fallback to hardcoded values for testing
const supabaseUrl = process.env.SUPABASE_URL || 'https://lmhlyoeuduketjclrwws.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaGx5b2V1ZHVrZXRqY2xyd3dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM0NzQ1NiwiZXhwIjoyMDkxOTIzNDU2fQ.iVVbBXfXP59YBsTlnA5as54SJALmLrifefFqkywboKg';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl.substring(0, 20) + '...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Check if admin user already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', 'admin@instapvstory.com')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking admin user:', checkError);
      return;
    }

    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      
      // Update password
      const passwordHash = await bcrypt.hash('admin123', 10);
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          password_hash: passwordHash,
          is_active: true,
          role: 'super_admin'
        })
        .eq('email', 'admin@instapvstory.com');

      if (updateError) {
        console.error('Error updating admin user:', updateError);
      } else {
        console.log('Admin user password updated successfully');
      }
    } else {
      // Create admin user
      const passwordHash = await bcrypt.hash('admin123', 10);
      const { error: createError } = await supabase
        .from('admin_users')
        .insert({
          email: 'admin@instapvstory.com',
          password_hash: passwordHash,
          name: 'System Administrator',
          role: 'super_admin',
          is_active: true
        });

      if (createError) {
        console.error('Error creating admin user:', createError);
      } else {
        console.log('Admin user created successfully');
      }
    }

    // Create some default system configurations
    const defaultConfigs = [
      {
        key: 'site_name',
        value: 'InstaPVStory',
        description: 'Website name',
        category: 'general'
      },
      {
        key: 'site_description',
        value: 'Instagram Profile Viewer & Story Downloader',
        description: 'Website description',
        category: 'general'
      },
      {
        key: 'cache_ttl',
        value: '3600',
        description: 'Cache time-to-live in seconds',
        category: 'performance'
      },
      {
        key: 'rate_limit_per_minute',
        value: '60',
        description: 'API rate limit per minute',
        category: 'security'
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable maintenance mode',
        category: 'system'
      },
      {
        key: 'enable_registration',
        value: 'false',
        description: 'Enable user registration',
        category: 'features'
      }
    ];

    for (const config of defaultConfigs) {
      const { error: configError } = await supabase
        .from('system_configs')
        .upsert({
          ...config,
          created_by: 'system',
          updated_by: 'system'
        }, {
          onConflict: 'key'
        });

      if (configError) {
        console.error(`Error upserting config ${config.key}:`, configError);
      } else {
        console.log(`Config ${config.key} created/updated`);
      }
    }

    // Create sample audit log entry
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'SYSTEM_INITIALIZED',
        resource_type: 'system',
        details: { message: 'Database seeded successfully' },
        ip_address: '127.0.0.1',
        user_agent: 'seed-script'
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
    } else {
      console.log('Sample audit log created');
    }

    // Create sample security log
    const { error: securityError } = await supabase
      .from('security_logs')
      .insert({
        type: 'SYSTEM',
        ip: '127.0.0.1',
        message: 'Database seeding completed',
        details: { action: 'seed' }
      });

    if (securityError) {
      console.error('Error creating security log:', securityError);
    } else {
      console.log('Sample security log created');
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nAdmin credentials:');
    console.log('Email: admin@instapvstory.com');
    console.log('Password: admin123');
    console.log('\nYou can now login at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('Unexpected error during seeding:', error);
    process.exit(1);
  }
}

seedDatabase();