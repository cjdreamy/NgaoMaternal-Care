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

// Helper: Get or Create USSD User logic
async function getUssdUser(phoneNumber) {
  const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
  console.log(`[AUTH] Checking profile for phone: ${phoneNumber}`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .or(`phone.eq.${phoneNumber},phone.eq.${normalizedPhone}`)
    .maybeSingle();

  if (profile) {
    console.log(`[AUTH] Authorized profile found: ${profile.full_name || profile.username}`);
    return { ...profile, type: 'authorized' };
  }

  const { data: ussdUser } = await supabase
    .from('ussd_users')
    .select('*')
    .or(`phone_number.eq.${phoneNumber},phone_number.eq.${normalizedPhone}`)
    .maybeSingle();

  if (ussdUser) {
    console.log(`[AUTH] Guest user found: ${ussdUser.phone_number}`);
    return { ...ussdUser, type: 'guest' };
  }

  console.log(`[AUTH] Brand new user. Registering phone: ${phoneNumber}`);
  const { data: newUser, error: iError } = await supabase
    .from('ussd_users')
    .insert({ phone_number: phoneNumber })
    .select()
    .single();

  if (iError) console.error(`[AUTH] ERROR registering user:`, iError);
  return { ...newUser, type: 'new_guest' };
}

// Helper: Create Emergency Alert
async function createEmergencyAlert(user, phoneNumber) {
  try {
    console.log(`[EMERGENCY] Triggering alert for ${phoneNumber}`);
    await supabase.from('ussd_emergency_alerts').insert({ phone_number: phoneNumber, status: 'active' });

    if (user.type === 'authorized') {
      await supabase.from('emergency_alerts').insert({
        mother_id: user.id,
        triggered_by: user.id,
        alert_type: 'ussd_panic',
        location_description: `USSD Emergency from ${phoneNumber}`,
        status: 'active'
      });
    }
  } catch (error) { console.error('[EMERGENCY] Error:', error); }
}

// Helper: Save health check-in
async function saveHealthCheckin(motherId, checkinData) {
  try {
    if (!motherId) return null;
    let riskLevel = 'low';
    let flagged = false;
    const critical = ['bleeding', 'severe_pain', 'no_fetal_movement'];
    if (checkinData.symptoms.some(s => critical.includes(s))) {
      riskLevel = 'critical';
      flagged = true;
    }
    await supabase.from('health_checkins').insert({
      mother_id: motherId,
      checkin_date: new Date().toISOString().split('T')[0],
      symptoms: checkinData.symptoms,
      notes: 'USSD Submission',
      risk_level: riskLevel,
      flagged: flagged
    });
  } catch (e) { console.error('[CHECKIN] Failure:', e); }
}

const translations = {
  sw: {
    welcome: "Karibu NgaoMaternal!",
    greet: (name) => `Jambo ${name}, karibu!`,
    root: "Habari yako leo?\n\n0. HARAKA (EMERGENCY)\n1. Kuhusu Leo\n2. Dalili na Shida\n3. Ushauri wa Afya\n4. Historia yangu\n5. Elimu",
    emergency_sent: (name) => `END ALARM IMETUMWA!\nTulia ${name}, msaada unakuja.\nSimu: ${process.env.EMERGENCY_HOTLINE}`,
    checkin_q: "Mtoto anacheza leo?\n1. Kawaida\n2. Amelegea\n3. Hamna kabisa",
    concerns_menu: "Chagua shida:\n1. Kutoka damu\n2. Kuumwa kichwa\n3. Maono hafifu\n4. Maumivu ya tumbo\n5. Kuvimba mwili",
    advice_menu: "Ushauri:\n1. Kliniki ya karibu\n2. Namba ya nesi\n3. Dalili hatari",
    edu_menu: "Info on:\n1. Lishe (Nutrition)\n2. Dalili hatari\n3. Maandalizi ya uzazi",
    saved: (name) => `END Imesifiwa! Asante ${name}.`,
    urgent_clinic: "END DHARURA: Nenda kliniki SASA HIVI!",
    urgent_noted: (s) => `END DHARURA: ${s.toUpperCase()} imerekodiwa. Help is coming!`,
    hotline_call: `END Piga ${process.env.EMERGENCY_HOTLINE} kwa kliniki ya karibu.`,
    nurse_hotline: `END Hotline ya Nesi: ${process.env.EMERGENCY_HOTLINE} (24/7)`,
    red_flags: "END DALILI MBAYA: Damu, Maumivu makali, Homa. Tupigie!",
    edu_tip: (tip) => `END Tip: ${tip}`,
    invalid: "Chagua 1-5 au 0.",
    history_last: (date, risk) => `END Mwisho (${date}): ${risk.toUpperCase()}.`,
    history_none: "END Hakuna rekodi bado!",
    register_prompt: "END Jisijili mtandaoni kuona historia yako.",
    tips: ['Kula mboga!', 'Damu ni hatari!', 'Tayarisha mfuko mapema!']
  },
  en: {
    welcome: "Welcome to NgaoMaternal!",
    greet: (name) => `Jambo ${name}, welcome!`,
    root: "How are you today?\n\n0. EMERGENCY\n1. Daily Check-in\n2. Symptoms & Concerns\n3. Medical Advice\n4. My Last Check-in\n5. Education",
    emergency_sent: (name) => `END ALERT SENT!\nStay calm ${name}, help is on the way.\nHotline: ${process.env.EMERGENCY_HOTLINE}`,
    checkin_q: "Baby movement today?\n1. Normal\n2. Reduced\n3. None",
    concerns_menu: "Pick concern:\n1. Bleeding\n2. Headache\n3. Blurred Vision\n4. Abdominal Pain\n5. Swelling",
    advice_menu: "Advice:\n1. Nearest Clinic\n2. Nurse Hotline\n3. Warning Signs",
    edu_menu: "Info on:\n1. Nutrition\n2. Danger Signs\n3. Labor Prep",
    saved: (name) => `END Saved! Thank you, ${name}.`,
    urgent_clinic: "END URGENT: Go to a facility NOW!",
    urgent_noted: (s) => `END URGENT: ${s.toUpperCase()} noted. Help requested!`,
    hotline_call: `END Call ${process.env.EMERGENCY_HOTLINE} for your nearest clinic.`,
    nurse_hotline: `END Nurse Hotline: ${process.env.EMERGENCY_HOTLINE} (24/7)`,
    red_flags: "END RED FLAGS: Bleeding, Severe Pain, Fever. Call us!",
    edu_tip: (tip) => `END Tip: ${tip}`,
    invalid: "Choose 1-5 or 0.",
    history_last: (date, risk) => `END Last (${date}): ${risk.toUpperCase()}.`,
    history_none: "END No records yet!",
    register_prompt: "END Register online to see your health history.",
    tips: ['Eat Greens!', 'Bleeding is a Red Flag!', 'Pack your bag early!']
  }
};

// Main USSD Endpoint
app.post('/ussd', async (req, res) => {
  const { sessionId, phoneNumber } = req.body;
  const text = (req.body.text || '').trim();
  const parts = text.split('*').filter(p => p !== '');
  const level = parts.length;

  console.log(`[TRAFFIC] Request: Phone=${phoneNumber}, Text="${text}" (Level ${level})`);

  try {
    const user = await getUssdUser(phoneNumber);
    const firstName = (user.full_name || user.username || user.name || 'Friend').split(' ')[0];
    let response = '';

    // LEVEL 0: Language Select
    if (level === 0) {
      response = `CON Welcome to NgaoMaternal!
Chagua Lugha / Select Language:
1. Kiswahili
2. English`;
    }

    // LEVEL 1: Root Menu (based on Lang)
    else {
      const lang = parts[0] === '1' ? 'sw' : 'en';
      const t = translations[lang];
      const subParts = parts.slice(1);
      const subLevel = subParts.length;

      if (subLevel === 0) {
        response = `CON ${t.greet(firstName)}\n${t.root}`;
      }
      else if (subLevel === 1) {
        const choice = subParts[0];
        switch (choice) {
          case '0':
            await createEmergencyAlert(user, phoneNumber);
            response = t.emergency_sent(firstName);
            break;
          case '1': response = `CON ${t.checkin_q}`; break;
          case '2': response = `CON ${t.concerns_menu}`; break;
          case '3': response = `CON ${t.advice_menu}`; break;
          case '4':
            if (user.type === 'authorized') {
              const { data: last } = await supabase.from('health_checkins').select('*').eq('mother_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
              response = last ? t.history_last(last.checkin_date, last.risk_level) : t.history_none;
            } else response = t.register_prompt;
            break;
          case '5': response = `CON ${t.edu_menu}`; break;
          default: response = `CON ${t.invalid}`;
        }
      }
      else if (subLevel === 2) {
        const [c1, c2] = subParts;
        if (c1 === '1') { // Check-in result
          if (c2 === '3') {
            await createEmergencyAlert(user, phoneNumber);
            response = t.urgent_clinic;
          } else {
            await saveHealthCheckin(user.id, { symptoms: c2 === '2' ? ['reduced_movement'] : [] });
            response = t.saved(firstName);
          }
        } else if (c1 === '2') { // Symptoms
          const symps = ['bleeding', 'headache', 'vision', 'pain', 'swelling'];
          const s = symps[parseInt(c2) - 1] || 'concern';
          await createEmergencyAlert(user, phoneNumber);
          await saveHealthCheckin(user.id, { symptoms: [s] });
          response = t.urgent_noted(s);
        } else if (c1 === '3') { // Advice
          if (c2 === '1') response = t.hotline_call;
          else if (c2 === '2') response = t.nurse_hotline;
          else response = t.red_flags;
        } else if (c1 === '5') { // Edu
          const tip = t.tips[parseInt(c2) - 1] || t.tips[0];
          response = t.edu_tip(tip);
        }
      }
    }

    if (!response) {
      const lang = parts[0] === '1' ? 'sw' : 'en';
      response = `CON ${translations[lang || 'en'].invalid}`;
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
  } catch (error) {
    console.error('[TRAFFIC] Error:', error);
    res.set('Content-Type', 'text/plain');
    res.send('END Connection error. Please call the hotline.');
  }
});

app.listen(PORT, () => console.log(`USSD Service on ${PORT}`));
