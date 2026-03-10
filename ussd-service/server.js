const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

// Environment variables - set these in your .env file
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ldroymannrscialbkqjp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here';
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Store session data temporarily (in production, use Redis or similar)
const sessions = new Map();

// Helper function to get or create user profile by phone
async function getUserByPhone(phoneNumber) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone', phoneNumber)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

// Helper function to create emergency alert
async function createEmergencyAlert(motherId, phoneNumber, alertType = 'ussd_panic') {
  try {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert({
        mother_id: motherId,
        triggered_by: motherId,
        alert_type: alertType,
        location_description: `USSD Alert from ${phoneNumber}`,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Send SMS notification to emergency contact if available
    const { data: profile } = await supabase
      .from('profiles')
      .select('emergency_contact_phone, emergency_contact_name')
      .eq('id', motherId)
      .single();

    console.log(`Emergency alert created for ${phoneNumber}`, data);
    return data;
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    return null;
  }
}

// Helper function to save health check-in
async function saveHealthCheckin(motherId, checkinData) {
  try {
    // Calculate risk level based on symptoms
    let riskLevel = 'low';
    let flagged = false;

    const criticalSymptoms = ['bleeding', 'severe_pain', 'no_fetal_movement'];
    const highRiskSymptoms = ['headache', 'blurred_vision', 'swelling'];

    if (checkinData.symptoms.some(s => criticalSymptoms.includes(s))) {
      riskLevel = 'critical';
      flagged = true;
    } else if (checkinData.symptoms.some(s => highRiskSymptoms.includes(s))) {
      riskLevel = 'high';
      flagged = true;
    } else if (checkinData.symptoms.length >= 2) {
      riskLevel = 'medium';
    }

    const { data, error } = await supabase
      .from('health_checkins')
      .insert({
        mother_id: motherId,
        checkin_date: new Date().toISOString().split('T')[0],
        symptoms: checkinData.symptoms,
        notes: checkinData.notes || null,
        risk_level: riskLevel,
        flagged: flagged
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Health check-in saved for mother ${motherId}`, data);
    return { data, riskLevel, flagged };
  } catch (error) {
    console.error('Error saving health check-in:', error);
    return null;
  }
}

// Helper function to get session data
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      symptoms: [],
      notes: '',
      step: 0
    });
  }
  return sessions.get(sessionId);
}

// Helper function to clear session
function clearSession(sessionId) {
  sessions.delete(sessionId);
}

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'NgaoMaternal Care USSD Service Running',
    version: '1.0.0',
    endpoints: {
      ussd: '/ussd (POST)'
    }
  });
});

// Main USSD endpoint
app.post('/ussd', async (req, res) => {
  const {
    sessionId,
    serviceCode,
    phoneNumber,
    text,
  } = req.body;

  let response = '';
  const session = getSession(sessionId);

  // Get user profile
  const user = await getUserByPhone(phoneNumber);

  // Main menu
  if (text === '') {
    response = `CON Welcome to NgaoMaternal Care
How are you feeling today?

0. EMERGENCY PANIC BUTTON
1. I'm feeling well
2. I have some concerns
3. I need medical advice
4. View my last check-in
5. Educational resources`;
  }
  
  // EMERGENCY PANIC BUTTON
  else if (text === '0') {
    if (user) {
      await createEmergencyAlert(user.id, phoneNumber, 'ussd_panic');
      response = `END EMERGENCY ALERT SENT!

Your location has been shared with the nearest clinic and your emergency contacts.

Help is on the way. Stay calm.

Emergency Hotline: 0800-MATERNAL`;
    } else {
      response = `END EMERGENCY ALERT SENT!

Please register at our clinic or website for better emergency response.

Emergency Hotline: 0800-MATERNAL`;
    }
  }

  // Option 1: Feeling well
  else if (text === '1') {
    response = `CON Great to hear! 

Would you like to:
1. Complete daily check-in
2. Read health tips
3. Back to main menu`;
  }

  else if (text === '1*1') {
    session.step = 'daily_checkin';
    response = `CON Daily Health Check-in

Have you felt your baby move today?
1. Yes, normal movement
2. Less than usual
3. No movement at all`;
  }

  else if (text === '1*1*1') {
    session.symptoms = [];
    response = `CON Any other symptoms?

1. Headache
2. Swelling
3. Dizziness
4. None
5. Continue to save`;
  }

  else if (text === '1*1*2') {
    session.symptoms = ['reduced_fetal_movement'];
    response = `CON IMPORTANT: Reduced fetal movement needs attention.

Any other symptoms?
1. Headache
2. Swelling
3. Severe pain
4. Save and get advice`;
  }

  else if (text === '1*1*3') {
    session.symptoms = ['no_fetal_movement'];
    if (user) {
      await createEmergencyAlert(user.id, phoneNumber, 'no_fetal_movement');
      await saveHealthCheckin(user.id, {
        symptoms: session.symptoms,
        notes: 'No fetal movement reported via USSD'
      });
    }
    response = `END URGENT: No fetal movement is serious!

Emergency alert sent to clinic.
Go to nearest health facility NOW.

Emergency Hotline: 0800-MATERNAL`;
  }

  // Option 2: Have concerns
  else if (text === '2') {
    response = `CON What concerns you most?

1. Bleeding or spotting
2. Severe headache
3. Blurred vision
4. Severe abdominal pain
5. Swelling (face/hands)
6. Other symptoms`;
  }

  else if (text === '2*1') {
    session.symptoms = ['bleeding'];
    if (user) {
      await createEmergencyAlert(user.id, phoneNumber, 'bleeding');
      await saveHealthCheckin(user.id, {
        symptoms: session.symptoms,
        notes: 'Bleeding reported via USSD'
      });
    }
    response = `END URGENT: Bleeding during pregnancy is serious!

Emergency alert sent.
Go to nearest clinic IMMEDIATELY.

Do NOT wait.
Emergency Hotline: 0800-MATERNAL`;
  }

  else if (text === '2*2') {
    session.symptoms = ['severe_headache'];
    response = `CON Severe headache noted.

Do you also have:
1. Blurred vision
2. Swelling
3. Both
4. Neither - just headache`;
  }

  else if (text === '2*2*1' || text === '2*2*3') {
    session.symptoms.push('blurred_vision');
    if (user) {
      await createEmergencyAlert(user.id, phoneNumber, 'preeclampsia_symptoms');
      await saveHealthCheckin(user.id, {
        symptoms: session.symptoms,
        notes: 'Possible preeclampsia symptoms via USSD'
      });
    }
    response = `END URGENT: These symptoms may indicate preeclampsia!

Emergency alert sent to clinic.
Seek medical care IMMEDIATELY.

Emergency Hotline: 0800-MATERNAL`;
  }

  else if (text === '2*3') {
    session.symptoms = ['blurred_vision'];
    response = `CON Blurred vision is concerning.

Do you also have:
1. Severe headache
2. Swelling
3. Both
4. Neither`;
  }

  else if (text === '2*4') {
    session.symptoms = ['severe_pain'];
    if (user) {
      await createEmergencyAlert(user.id, phoneNumber, 'severe_abdominal_pain');
      await saveHealthCheckin(user.id, {
        symptoms: session.symptoms,
        notes: 'Severe abdominal pain via USSD'
      });
    }
    response = `END URGENT: Severe abdominal pain needs immediate attention!

Emergency alert sent.
Go to clinic NOW.

Emergency Hotline: 0800-MATERNAL`;
  }

  else if (text === '2*5') {
    session.symptoms = ['swelling'];
    response = `CON Swelling noted.

Is the swelling:
1. Sudden and severe
2. Gradual and mild
3. With headache/vision changes`;
  }

  else if (text === '2*5*1' || text === '2*5*3') {
    if (user) {
      await createEmergencyAlert(user.id, phoneNumber, 'severe_swelling');
      await saveHealthCheckin(user.id, {
        symptoms: session.symptoms,
        notes: 'Severe swelling via USSD'
      });
    }
    response = `END URGENT: Sudden severe swelling needs attention!

Emergency alert sent to clinic.
Seek medical care today.

Emergency Hotline: 0800-MATERNAL`;
  }

  else if (text === '2*6') {
    response = `CON Other symptoms:

1. Fever
2. Persistent vomiting
3. Difficulty breathing
4. Dizziness
5. Unusual discharge`;
  }

  // Option 3: Need medical advice
  else if (text === '3') {
    response = `CON Medical Advice:

1. Find nearest clinic
2. Speak to nurse hotline
3. Pregnancy week calculator
4. Warning signs to watch
5. Back to main menu`;
  }

  else if (text === '3*1') {
    response = `END Nearest Clinics:

1. Central Maternal Health Clinic
   123 Healthcare Ave, Nairobi
   Tel: +254-700-123456

2. Rural Health Center - Kisumu
   45 Medical Road, Kisumu
   Tel: +254-700-234567

Visit our website for more clinics.`;
  }

  else if (text === '3*2') {
    response = `END Nurse Hotline:

Call: 0800-MATERNAL
Available 24/7

Or visit our website:
www.ngaomaternal.care

For emergencies, dial 0 from main menu.`;
  }

  else if (text === '3*4') {
    response = `END WARNING SIGNS - Seek help immediately if you have:

• Vaginal bleeding
• Severe headache + blurred vision
• Severe abdominal pain
• No fetal movement
• Sudden swelling
• Difficulty breathing
• Persistent vomiting
• Fever

Emergency: Dial 0 from main menu`;
  }

  // Option 4: View last check-in
  else if (text === '4') {
    if (user) {
      const { data: lastCheckin } = await supabase
        .from('health_checkins')
        .select('*')
        .eq('mother_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastCheckin) {
        const date = new Date(lastCheckin.checkin_date).toLocaleDateString();
        const symptoms = lastCheckin.symptoms?.join(', ') || 'None reported';
        response = `END Last Check-in: ${date}

Risk Level: ${lastCheckin.risk_level.toUpperCase()}
Symptoms: ${symptoms}

${lastCheckin.flagged ? 'Status: Flagged for review' : 'Status: Normal'}

Visit website for full history.`;
      } else {
        response = `END No previous check-ins found.

Complete your first check-in by selecting option 1 from main menu.`;
      }
    } else {
      response = `END Please register at our clinic or website to view your check-in history.

Visit: www.ngaomaternal.care`;
    }
  }

  // Option 5: Educational resources
  else if (text === '5') {
    response = `CON Educational Resources:

1. Nutrition during pregnancy
2. Warning signs
3. Fetal movement tracking
4. Preparing for labor
5. Prenatal care schedule
6. Back to main menu`;
  }

  else if (text === '5*1') {
    response = `END Nutrition Tips:

• Eat iron-rich foods (spinach, beans)
• Take prenatal vitamins daily
• Drink 8+ glasses of water
• Eat protein (eggs, fish, meat)
• Avoid raw/undercooked foods

Visit website for meal plans.`;
  }

  else if (text === '5*2') {
    response = `END WARNING SIGNS:

Seek immediate help for:
• Bleeding
• Severe headache
• Vision changes
• Reduced fetal movement
• Severe pain
• Sudden swelling

Dial 0 for emergency from main menu.`;
  }

  else if (text === '5*3') {
    response = `END Fetal Movement Tracking:

From week 28:
• Feel at least 10 movements in 2 hours
• Track daily, same time
• If movements decrease, call clinic
• No movement = Emergency (dial 0)

Best time: After meals or rest.`;
  }

  // Default fallback
  else {
    response = `CON Invalid option. Please try again.

0. EMERGENCY
1. I'm feeling well
2. I have concerns
3. Medical advice
4. Last check-in
5. Education`;
  }

  // Clear session if it's an END response
  if (response.startsWith('END')) {
    clearSession(sessionId);
  }

  // Send response
  res.set('Content-Type', 'text/plain');
  res.send(response);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`NgaoMaternal Care USSD Service running on port ${PORT}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
