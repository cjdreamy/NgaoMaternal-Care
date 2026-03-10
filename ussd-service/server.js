const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Store session data temporarily
const sessions = new Map();

// Helper: Get or Create USSD User logic
async function getUssdUser(phoneNumber) {
  const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
  console.log(`[AUTH] Checking profile for phone: ${phoneNumber}`);

  // 1. Check Profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .or(`phone.eq.${phoneNumber},phone.eq.${normalizedPhone}`)
    .maybeSingle();

  if (profile) {
    console.log(`[AUTH] Authorized profile found: ${profile.full_name || profile.username}`);
    return { ...profile, type: 'authorized' };
  }

  console.log(`[AUTH] No profile found. Checking USSD guest table: ${phoneNumber}`);
  // 2. Check USSD Users
  const { data: ussdUser } = await supabase
    .from('ussd_users')
    .select('*')
    .or(`phone_number.eq.${phoneNumber},phone_number.eq.${normalizedPhone}`)
    .maybeSingle();

  if (ussdUser) {
    console.log(`[AUTH] Guest user found: ${ussdUser.phone_number}`);
    return { ...ussdUser, type: 'guest' };
  }

  // 3. Register as New USSD Guest
  console.log(`[AUTH] Brand new user. Registering phone: ${phoneNumber}`);
  const { data: newUser, error: iError } = await supabase
    .from('ussd_users')
    .insert({ phone_number: phoneNumber })
    .select()
    .single();

  if (iError) console.error(`[AUTH] ERROR registering user:`, iError);
  return { ...newUser, type: 'new_guest' };
}

// Helper: Create Emergency Alert (supports both registered and guests)
async function createEmergencyAlert(user, phoneNumber) {
  try {
    console.log(`[EMERGENCY] Triggering alert for ${phoneNumber} (${user.type})`);

    // Alert the Admin Dashboard via ussd_emergency_alerts
    const { error: ussdErr } = await supabase.from('ussd_emergency_alerts').insert({
      phone_number: phoneNumber,
      status: 'active'
    });
    if (ussdErr) console.error('[EMERGENCY] USSD Insert Error:', ussdErr);

    // If registered, also trigger main alert system
    if (user.type === 'authorized') {
      const { error: mainErr } = await supabase.from('emergency_alerts').insert({
        mother_id: user.id,
        triggered_by: user.id,
        alert_type: 'ussd_panic',
        location_description: `USSD Emergency from ${phoneNumber}`,
        status: 'active'
      });
      if (mainErr) console.error('[EMERGENCY] Main Table Error:', mainErr);
    }
  } catch (error) {
    console.error('[EMERGENCY] Critical Error logging:', error);
  }
}

// Helper: Save health check-in
async function saveHealthCheckin(motherId, checkinData) {
  try {
    console.log(`[CHECKIN] Saving data for mother: ${motherId}`);
    if (!motherId) return null;

    let riskLevel = 'low';
    let flagged = false;
    const critical = ['bleeding', 'severe_pain', 'no_fetal_movement'];

    if (checkinData.symptoms.some(s => critical.includes(s))) {
      riskLevel = 'critical';
      flagged = true;
    }

    const { error } = await supabase.from('health_checkins').insert({
      mother_id: motherId,
      checkin_date: new Date().toISOString().split('T')[0],
      symptoms: checkinData.symptoms,
      notes: checkinData.notes || 'USSD Submission',
      risk_level: riskLevel,
      flagged: flagged
    });
    if (error) console.error('[CHECKIN] DB Error:', error);
  } catch (e) { console.error('[CHECKIN] Critical Failure:', e); }
}

function clearSession(sessionId) { sessions.delete(sessionId); }

// Main USSD Endpoint
app.post('/ussd', async (req, res) => {
  const { sessionId, phoneNumber } = req.body;
  const text = (req.body.text || '').trim();
  const parts = text.split('*').filter(p => p !== '');
  const level = parts.length;

  console.log(`[TRAFFIC] Request: ID=${sessionId}, Phone=${phoneNumber}, Text="${text}" (Level ${level})`);

  try {
    const user = await getUssdUser(phoneNumber);
    const firstName = (user.full_name || user.username || user.name || 'Friend').split(' ')[0];

    let response = '';

    // ROOT MENU
    if (level === 0) {
      response = `CON Jambo ${firstName}, welcome!
How are you today?

0. EMERGENCY
1. Daily Check-in
2. Symptoms & Concerns
3. Medical Advice
4. My Last Check-in
5. Education`;
    }

    // LEVEL 1
    else if (level === 1) {
      const choice = parts[0];
      switch (choice) {
        case '0':
          await createEmergencyAlert(user, phoneNumber);
          response = `END ALERT SENT!
Stay calm ${firstName}, help is on the way.
Hotline: ${process.env.EMERGENCY_HOTLINE}`;
          break;
        case '1':
          response = `CON Baby movement today?
1. Normal
2. Reduced
3. None`;
          break;
        case '2':
          response = `CON Pick concern:
1. Bleeding
2. Headache
3. Blurred Vision
4. Abdominal Pain
5. Swelling`;
          break;
        case '3':
          response = `CON Advice:
1. Nearest Clinic
2. Nurse Hotline
3. Warning Signs`;
          break;
        case '4':
          if (user.type === 'authorized') {
            const { data: last } = await supabase.from('health_checkins').select('*').eq('mother_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
            response = last ? `END Last (${last.checkin_date}): ${last.risk_level.toUpperCase()}.` : `END No records yet!`;
          } else response = `END Register online to see your health history.`;
          break;
        case '5':
          response = `CON Info on:
1. Nutrition
2. Danger Signs
3. Labor Prep`;
          break;
        default:
          response = `CON Invalid. Choose 1-5 or 0 for EMERGENCY.`;
      }
    }

    // LEVEL 2
    else if (level === 2) {
      const [p1, p2] = parts;
      if (p1 === '1') { // Check-in
        if (p2 === '3') {
          await createEmergencyAlert(user, phoneNumber);
          response = `END URGENT: Clinic notified! Go to a facility NOW.`;
        } else {
          await saveHealthCheckin(user.id, { symptoms: p2 === '2' ? ['reduced_movement'] : [], notes: 'USSD' });
          response = `END Saved! Thank you for checkin in, ${firstName}.`;
        }
      } else if (p1 === '2') { // Concerns
        const symps = ['bleeding', 'headache', 'vision', 'pain', 'swelling'];
        const s = symps[parseInt(p2) - 1] || 'concern';
        await createEmergencyAlert(user, phoneNumber);
        await saveHealthCheckin(user.id, { symptoms: [s], notes: 'Emergency via USSD' });
        response = `END URGENT: ${s.toUpperCase()} noted. Help requested!`;
      } else if (p1 === '3') { // Advice
        if (p2 === '1') response = `END Call ${process.env.EMERGENCY_HOTLINE} for your nearest clinic.`;
        else if (p2 === '2') response = `END Hotline: ${process.env.EMERGENCY_HOTLINE} (24/7)`;
        else response = `END RED FLAGS: Bleeding, Severe Pain, Fever. Call us!`;
      } else if (p1 === '5') { // Edu
        const tips = ['Eat Greens!', 'Bleeding is a Red Flag!', 'Pack your bag early!'];
        response = `END Tip: ${tips[parseInt(p2) - 1] || 'Stay Healthy!'}`;
      }
    }

    if (!response) response = `CON Jambo ${firstName}, please select an option 1-5.`;
    if (response.startsWith('END')) clearSession(sessionId);

    res.set('Content-Type', 'text/plain');
    res.send(response);
  } catch (error) {
    console.error('[TRAFFIC] Critical Error:', error);
    res.set('Content-Type', 'text/plain');
    res.send('END We are experiencing technical difficulties. Please call the hotline.');
  }
});

app.get('/health', (req, res) => res.json({ status: 'healthy' }));

app.listen(PORT, () => {
  console.log(`USSD Service on ${PORT}`);
});
