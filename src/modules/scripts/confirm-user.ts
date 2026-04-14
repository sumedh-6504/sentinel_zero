import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUser(email: string) {
  console.log(`🔍 Searching for operator: ${email}...`);

  // 1. Get user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error(`❌ No operator found with email: ${email}`);
    return;
  }

  console.log(`✅ Found User ID: ${user.id}`);

  // 2. Update user to confirmed
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    console.error('❌ Failed to confirm operator:', updateError.message);
  } else {
    console.log(`🚀 SUCCESS: ${email} has been manually verified code-level.`);
    console.log(`🔗 You can now log in at http://localhost:3002/login`);
  }
}

// Get email from command line argument
const emailArg = process.argv[2];

if (!emailArg) {
  console.log('Usage: npx ts-node src/modules/scripts/confirm-user.ts <email>');
  process.exit(1);
}

confirmUser(emailArg);
