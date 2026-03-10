const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'ussd-service/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('ERROR: Missing Supabase credentials in ussd-service/.env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testConnection() {
    console.log(`Checking connection to: ${SUPABASE_URL}`);

    // Test profiles table
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, phone').limit(1);
    if (pError) {
        console.error('Error selecting from profiles:', pError);
    } else {
        console.log('Successfully connected to profiles. Sample:', profiles);
    }

    // Test emergency_alerts table
    const { data: alerts, error: aError } = await supabase.from('emergency_alerts').select('id').limit(1);
    if (aError) {
        console.error('Error selecting from emergency_alerts:', aError);
    } else {
        console.log('Successfully connected to emergency_alerts.');
    }
}

testConnection();
