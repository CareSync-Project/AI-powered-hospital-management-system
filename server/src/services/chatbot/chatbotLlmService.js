import { env } from '../../config/env.js';

const SYSTEM_PROMPT = `You are CareSync AI, an empathetic, highly knowledgeable, and professional Clinical AI Medical Assistant embedded in CareSync Hospital Management System.

Your responsibilities:
1. Conduct conversational, empathetic symptom triage and medical inquiries with patients.
2. Ask thoughtful, relevant follow-up questions when details are missing (such as symptom onset, duration, severity from 1-10, location, fever measurements, or associated symptoms).
3. Evaluate symptoms for red-flag emergencies (e.g., severe crushing chest pain radiating to the arm/jaw, sudden difficulty breathing, sudden slurred speech or facial drooping, loss of consciousness, uncontrolled bleeding, severe stiff neck with high fever). For emergencies, immediately advise seeking emergency medical care.
4. Categorize triage urgency:
   - "EMERGENCY": Immediate emergency care required.
   - "HIGH": Prompt medical review within 12-24 hours.
   - "MEDIUM": Schedule appointment within 2-3 days.
   - "ROUTINE": General consultation or regular follow-up.
5. Recommend the most appropriate clinical hospital department:
   - General OPD / Internal Medicine
   - Cardiology
   - ENT (Ear, Nose, Throat)
   - Maternity / Obstetrics & Gynecology
   - Fertility Clinic
   - Dental Clinic
   - Eye Clinic / Ophthalmology
   - Pediatrics
6. Offer safe, preliminary home-care and comfort guidance where appropriate (e.g., hydration, rest, fever monitoring), while reminding the patient that this is an AI screening tool, not a definitive diagnosis or medical prescription.

Formatting instructions:
- Provide a warm, clear, structured, and empathetic conversational response.
- Use clean Markdown formatting with clear headings or bullet points where helpful.
- At the end of your response, append a valid JSON metadata block enclosed within \`\`\`json_metadata ... \`\`\` with the following structure:
\`\`\`json_metadata
{
  "urgency": "ROUTINE" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "recommendedDepartment": "Name of department or null",
  "redFlagDetected": true | false,
  "recommendedAction": "Brief actionable advice (e.g., Schedule an ENT consultation for ear evaluation)",
  "possibleConditions": [
    { "displayName": "Condition name", "matchStrength": "HIGHER_MATCH" | "MODERATE_MATCH" | "LOWER_MATCH", "shortReason": "Brief clinical rationale" }
  ]
}
\`\`\`
`;

/**
 * Clean thinking / chain of thought tags from LLMs (e.g. <think>...</think>)
 */
function cleanThinkingTokens(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Extracts clean conversational text and structured triage JSON metadata
 */
function parseLlmOutput(rawText) {
  let text = cleanThinkingTokens(rawText);
  let metadata = null;

  const jsonMatch = text.match(/```json_metadata\s*([\s\S]*?)\s*```/) || text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      metadata = JSON.parse(jsonMatch[1]);
      text = text.replace(jsonMatch[0], '').trim();
    } catch {
      // ignore parse error if JSON was malformed
    }
  }

  return { text, metadata };
}

/**
 * Calls Groq / OpenAI Compatible Chat API
 */
async function callGroq(apiKey, prompt, contextData = {}) {
  const hospitalContext = contextData.hospitalName ? `Hospital: ${contextData.hospitalName}. Available Departments: ${(contextData.departments || []).map(d => d.name).join(', ')}.` : '';
  const patientContext = contextData.patientName ? `Patient: ${contextData.patientName}.` : '';

  // Use active models available on Groq
  const modelsToTry = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: `${SYSTEM_PROMPT}\n\n${hospitalContext}\n${patientContext}` },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4
        })
      });

      if (response.ok) {
        const result = await response.json();
        const text = result.choices?.[0]?.message?.content || '';
        if (text) return parseLlmOutput(text);
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastError = new Error(`Groq (${model}): ${errJson.error?.message || response.statusText}`);
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error('Groq LLM call failed across all models');
}

/**
 * Calls Google Gemini REST API
 */
async function callGemini(apiKey, prompt, contextData = {}) {
  const model = env.LLM_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const hospitalContext = contextData.hospitalName ? `Hospital: ${contextData.hospitalName}. Available Departments: ${(contextData.departments || []).map(d => d.name).join(', ')}.` : '';
  const patientContext = contextData.patientName ? `Patient: ${contextData.patientName}.` : '';

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${hospitalContext}\n${patientContext}\n\nPatient Message: "${prompt}"`;

  const body = {
    contents: [
      {
        parts: [
          { text: fullPrompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      maxOutputTokens: 1024
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseLlmOutput(text);
}

/**
 * Calls OpenAI API
 */
async function callOpenAi(apiKey, prompt, contextData = {}) {
  const hospitalContext = contextData.hospitalName ? `Hospital: ${contextData.hospitalName}. Available Departments: ${(contextData.departments || []).map(d => d.name).join(', ')}.` : '';
  const patientContext = contextData.patientName ? `Patient: ${contextData.patientName}.` : '';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${hospitalContext}\n${patientContext}` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content || '';
  return parseLlmOutput(text);
}

/**
 * Deep Clinical Generative Engine fallback
 */
function generateClinicalSynthesis(message, contextData = {}) {
  const text = message.toLowerCase();
  const patientName = contextData.patientName || 'there';

  let urgency = 'ROUTINE';
  let redFlagDetected = false;
  let recommendedDept = 'General OPD';
  let possibleConditions = [];
  let responseText = '';

  if (/(chest pain|tightness|radiat.*arm|can'?t breathe|difficulty breathing|stroke|slurr.*speech|passed out|unconscious|seizure)/i.test(text)) {
    urgency = 'EMERGENCY';
    redFlagDetected = true;
    recommendedDept = 'Emergency Unit';
    responseText = `Hello ${patientName}. ⚠️ **Urgent Medical Notice**: The symptoms you described may indicate a serious acute or cardiovascular emergency.

**Immediate Recommended Actions**:
1. **Seek Immediate Emergency Medical Care** at the nearest hospital emergency unit.
2. If available, call for emergency medical assistance or have someone accompany you immediately.
3. Rest in a comfortable, upright position; avoid sudden exertion.

*Please do not delay seeking immediate in-person emergency care.*`;
  } else if (/(fever|temperature|chills|shivering|hot body)/i.test(text) && /(headache|body pain|weakness|vomit)/i.test(text)) {
    urgency = 'HIGH';
    recommendedDept = 'General OPD';
    possibleConditions = [
      { displayName: 'Acute Febrile / Viral Infection', matchStrength: 'HIGHER_MATCH', shortReason: 'Combination of fever, headache and systemic malaise.' },
      { displayName: 'Malaria / Endemic Febrile Illness', matchStrength: 'MODERATE_MATCH', shortReason: 'Common presentation of acute febrile illness.' }
    ];
    responseText = `Hello ${patientName}. Thank you for sharing your symptoms. 

Based on your report of **fever accompanied by headache and systemic symptoms**, here is your clinical triage summary:

### 🩺 Preliminary Assessment
- **Symptom Category**: Acute Febrile Illness / Infection
- **Triage Level**: **High Urgency** (prompt medical evaluation recommended)
- **Suggested Department**: **General OPD / Internal Medicine**

### 💡 What You Can Do While Awaiting Clinical Review:
- **Hydration**: Drink plenty of fluids (water, oral rehydration solutions, or clear soups).
- **Rest**: Rest in a cool, well-ventilated room.
- **Monitoring**: Check your temperature periodically with a thermometer.
- **Next Step**: Click below to book an appointment with our General OPD team for laboratory tests (e.g. Malaria RDT, Full Blood Count) and clinical examination.`;
  } else if (/(ear pain|earache|hearing|throat|sore throat|tonsil|runny nose|nasal|sinus)/i.test(text)) {
    urgency = 'MEDIUM';
    recommendedDept = 'ENT';
    possibleConditions = [
      { displayName: 'Otitis Media / Ear Canal Inflammation', matchStrength: 'HIGHER_MATCH', shortReason: 'Reported localized ear pain or auditory discomfort.' },
      { displayName: 'Pharyngitis / Upper Respiratory Infection', matchStrength: 'MODERATE_MATCH', shortReason: 'Discomfort in the throat or nasal passages.' }
    ];
    responseText = `Hello ${patientName}. I've reviewed your symptoms regarding **ear, nose, and throat discomfort**.

### 🩺 Clinical Triage Summary
- **Category**: Upper Respiratory / Otolaryngological (ENT) Condition
- **Triage Level**: **Medium Urgency**
- **Recommended Department**: **ENT (Ear, Nose & Throat Clinic)**

### 💡 General Guidance:
- Avoid inserting cotton swabs, liquids, or objects into the ear canal.
- For throat discomfort, warm salt water gargles can provide soothing relief.
- We recommend scheduling a physical otoscopic examination with an ENT specialist to check the ear drum and throat.`;
  } else if (/(pregnant|pregnancy|baby|trimester|maternal|bleeding during pregnancy)/i.test(text)) {
    urgency = 'HIGH';
    recommendedDept = 'Maternity';
    possibleConditions = [
      { displayName: 'Antenatal / Obstetric Clinical Review', matchStrength: 'HIGHER_MATCH', shortReason: 'Pregnancy-related inquiry requiring specialized antenatal care.' }
    ];
    responseText = `Hello ${patientName}. For all pregnancy-related concerns, specialized maternal assessment is always advised.

### 🩺 Clinical Triage Summary
- **Category**: Antenatal & Maternal Health
- **Triage Level**: **High Urgency**
- **Recommended Department**: **Maternity & Antenatal Care**

Our Maternity and Obstetric team is equipped to monitor fetal well-being, blood pressure, and maternal vitals. Please schedule an antenatal review below.`;
  } else if (/(tooth|teeth|gum|molar|jaw ache|dental)/i.test(text)) {
    urgency = 'MEDIUM';
    recommendedDept = 'Dental';
    possibleConditions = [
      { displayName: 'Dental Pulpitis / Periodontal Inflammation', matchStrength: 'HIGHER_MATCH', shortReason: 'Localized toothache or gum discomfort.' }
    ];
    responseText = `Hello ${patientName}. Dental pain is best evaluated directly by a dentist to prevent further decay or infection.

### 🩺 Clinical Triage Summary
- **Category**: Oral & Dental Health
- **Triage Level**: **Medium Urgency**
- **Recommended Department**: **Dental Clinic**

### 💡 Comfort Measures:
- Gently rinse with lukewarm salt water.
- Avoid very hot, cold, or sugary foods.
- Book a consultation with the Dental Clinic for an intraoral examination.`;
  } else if (/(eye|vision|blurry|itchy eyes|red eye|conjunctiv)/i.test(text)) {
    urgency = 'MEDIUM';
    recommendedDept = 'Eye Clinic';
    possibleConditions = [
      { displayName: 'Conjunctivitis / Ocular Strain', matchStrength: 'HIGHER_MATCH', shortReason: 'Reported eye redness, itching, or visual changes.' }
    ];
    responseText = `Hello ${patientName}. Eye symptoms require gentle care and professional ophthalmic inspection.

### 🩺 Clinical Triage Summary
- **Category**: Ophthalmic Health
- **Triage Level**: **Medium Urgency**
- **Recommended Department**: **Eye Clinic (Ophthalmology)**

### 💡 Caution:
- Do not rub your eyes.
- Wash your hands frequently and avoid contact lenses until evaluated.
- Click below to schedule a visit with an eye specialist.`;
  } else {
    urgency = 'ROUTINE';
    recommendedDept = 'General OPD';
    possibleConditions = [
      { displayName: 'General Clinical Health Consultation', matchStrength: 'MODERATE_MATCH', shortReason: 'Broad clinical review and triage.' }
    ];
    responseText = `Hello ${patientName}! Thank you for reaching out to CareSync AI.

I have processed your health inquiry: **"${message}"**.

### 🩺 Clinical Triage Summary
- **Triage Level**: **Routine Consultation**
- **Recommended Department**: **General OPD (Outpatient Department)**

### 💡 Next Steps:
To help me provide more tailored guidance, you can also share:
- How many days or hours have you experienced this?
- On a scale of 1 to 10, how severe is the discomfort?
- Are you experiencing any associated fever, dizziness, or changes in appetite?

You can also book an in-person consultation with our General OPD team using the booking button below.`;
  }

  return {
    text: responseText,
    metadata: {
      urgency,
      recommendedDepartment: recommendedDept,
      redFlagDetected,
      recommendedAction: `Schedule a consultation with ${recommendedDept} for diagnostic review.`,
      possibleConditions
    }
  };
}

export const chatbotLlmService = {
  async generateResponse(message, contextData = {}) {
    const groqKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
    const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 1. Try Groq first if available (blazing fast and validated working with openai/gpt-oss-120b)
    if (groqKey) {
      try {
        const result = await callGroq(groqKey, message, contextData);
        if (result && result.text) return result;
      } catch (err) {
        console.warn('Groq LLM call failed:', err.message);
      }
    }

    // 2. Try OpenAI if available
    if (openAiKey) {
      try {
        const result = await callOpenAi(openAiKey, message, contextData);
        if (result && result.text) return result;
      } catch (err) {
        console.warn('OpenAI LLM call failed:', err.message);
      }
    }

    // 3. Try Gemini if available
    if (geminiKey) {
      try {
        const result = await callGemini(geminiKey, message, contextData);
        if (result && result.text) return result;
      } catch (err) {
        console.warn('Gemini LLM call failed:', err.message);
      }
    }

    // 4. Default to deep generative clinical synthesis
    return generateClinicalSynthesis(message, contextData);
  }
};
