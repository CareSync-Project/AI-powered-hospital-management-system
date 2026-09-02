import { env } from '../../config/env.js';

const SYSTEM_PROMPT = `You are CareSync AI, an empathetic, highly knowledgeable, and versatile Clinical & Health AI Assistant embedded in the CareSync Hospital Management System.

Your core capabilities:
1. **Broad Generative Health & Medical Intelligence**:
   - Answer ALL patient questions regarding general health, wellness, anatomy, physiology, nutrition, exercise, disease prevention, pharmacology (common over-the-counter medications, interactions, mechanisms of action), sleep hygiene, mental health, first aid, maternal health, and pediatrics.
   - Explain complex medical concepts in simple, reassuring, and easy-to-understand language with clear structure, headings, and bullet points.

2. **Conversational Warmth, Gestures & Empathy**:
   - Respond naturally, warmly, and politely to greetings (e.g., "hello", "hi", "good morning"), casual remarks, emojis, and gestures (e.g., 👋, 🙏, ❤️, 👍, 🤝, 😊).
   - If a patient expresses fear, anxiety, or distress, provide supportive, calming, and empathetic words while guiding them toward appropriate care.
   - Acknowledge gratitude and pleasantries warmly.

3. **Clinical Symptom Triage & Red-Flag Safety**:
   - When a patient describes specific symptoms, ask thoughtful clarifying questions (onset, duration, severity 1-10, fever, radiation).
   - Immediately screen for RED-FLAG emergencies (e.g., crushing chest pain radiating to arm/jaw, sudden shortness of breath, slurred speech/facial droop, severe trauma, loss of consciousness, uncontrolled bleeding, severe sudden headache). Advise immediate emergency care for red flags.
   - Suggest safe comfort measures (hydration, rest, elevation, warm compresses) where appropriate.

4. **Hospital Department Routing**:
   - Suggest the most appropriate clinic department when in-person evaluation is needed:
     * General OPD / Internal Medicine
     * Cardiology
     * ENT (Ear, Nose & Throat)
     * Maternity / Obstetrics & Gynecology
     * Fertility Clinic
     * Dental Clinic
     * Eye Clinic (Ophthalmology)
     * Pediatrics
     * Emergency Unit

Formatting & Output Rules:
- Provide a rich, helpful, formatted Markdown response.
- At the end of your response, ALWAYS include a JSON metadata block enclosed in \`\`\`json_metadata ... \`\`\`.
- For pure greetings, gestures, or general educational questions with no reported symptoms, set "urgency": "ROUTINE" or null, "recommendedDepartment": null, "redFlagDetected": false, "possibleConditions": [].
- For symptom reports, populate the triage metadata accurately:
\`\`\`json_metadata
{
  "urgency": "ROUTINE" | "MEDIUM" | "HIGH" | "EMERGENCY" | null,
  "recommendedDepartment": "Department Name" | null,
  "redFlagDetected": true | false,
  "recommendedAction": "Brief guidance or next step",
  "possibleConditions": [
    { "displayName": "Condition name", "matchStrength": "HIGHER_MATCH" | "MODERATE_MATCH" | "LOWER_MATCH", "shortReason": "Brief clinical rationale" }
  ]
}
\`\`\`
`;

/**
 * Clean thinking / chain of thought tags from reasoning LLMs (e.g. <think>...</think>)
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
 * Calls Groq API
 */
async function callGroq(apiKey, prompt, contextData = {}) {
  const hospitalContext = contextData.hospitalName ? `Hospital: ${contextData.hospitalName}. Available Departments: ${(contextData.departments || []).map(d => d.name).join(', ')}.` : '';
  const patientContext = contextData.patientName ? `Patient: ${contextData.patientName}.` : '';

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
          temperature: 0.5
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
  const model = env.LLM_MODEL || 'gemini-1.5-flash';
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
      temperature: 0.5,
      topP: 0.95,
      maxOutputTokens: 2048
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
      temperature: 0.5
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
  const text = (message || '').trim().toLowerCase();
  const patientName = contextData.patientName || 'there';

  let urgency = null;
  let redFlagDetected = false;
  let recommendedDept = null;
  let possibleConditions = [];
  let responseText = '';

  // 1. Gestures, Greetings, Emojis & Pleasantries
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy|yo|how are you|sup|wassup)(\s|$|!|\?|\.)/i.test(text) || /^(👋|🙏|❤️|👍|🤝|😊|✨|🌸| doctor|doc)$/i.test(text)) {
    responseText = `Hello ${patientName}! 👋 

I'm your **CareSync AI Health & Clinical Assistant**. 

I'm here to support you with:
- 🩺 **Symptom Assessment & Triage**: Evaluating health complaints, checking for red flags, and suggesting the right clinic department.
- 💊 **Medications & First Aid**: Explaining how over-the-counter medicines work, home comfort measures, and emergency guidance.
- 🥗 **Wellness & Nutrition**: Healthy habits, vitamins, hydration, sleep hygiene, and preventive care.
- 🗓️ **Hospital Navigation**: Routing you to our OPD, Cardiology, Dental, ENT, Maternity, Eye Clinic, or Pediatrics.

How can I help you feel your best today? Feel free to describe any symptoms or ask any health questions!`;
    return {
      text: responseText,
      metadata: null
    };
  }

  // 2. Gratitude & Goodbyes
  if (/^(thank you|thanks|thank u|i appreciate|thx|bye|goodbye|see you|good night|take care)/i.test(text)) {
    responseText = `You're very welcome, ${patientName}! 😊

Your health and well-being are our top priority at CareSync. If you experience any new symptoms or have further questions, I'm always here to help. 

Wishing you good health and a wonderful day ahead! 🌟`;
    return {
      text: responseText,
      metadata: null
    };
  }

  // 3. Anxiety, Fear & Emotional Support
  if (/(scared|afraid|anxious|nervous|worried|stress|panic|fear)/i.test(text)) {
    responseText = `I hear you, ${patientName}, and it is completely normal to feel concerned when dealing with health worries. Take a slow, deep breath — you are taking the right proactive step by seeking guidance. 💙

Please tell me a bit more about what you are experiencing or what is worrying you right now. Whether it's a physical symptom or general concern, I'm here to walk you through it step-by-step.`;
    return {
      text: responseText,
      metadata: null
    };
  }

  // 4. Red-Flag Emergency Detection
  if (/(chest pain|tightness|radiat.*arm|can'?t breathe|difficulty breathing|stroke|slurr.*speech|passed out|unconscious|seizure|heavy bleeding)/i.test(text)) {
    urgency = 'EMERGENCY';
    redFlagDetected = true;
    recommendedDept = 'Emergency Unit';
    responseText = `⚠️ **URGENT EMERGENCY MEDICAL NOTICE**

Hello ${patientName}, the symptoms you described can be signs of an acute cardiovascular or respiratory emergency.

### 🚨 Immediate Critical Steps:
1. **Seek In-Person Emergency Medical Attention Immediately** at the nearest hospital emergency department.
2. Call your local emergency helpline or have someone drive you to the hospital right away.
3. Rest in a calm, seated upright position; avoid walking or exertion.

*Please do not delay seeking immediate medical intervention.*`;
  }
  // 5. Fever & Headache (Febrile Illness / Malaria / Viral)
  else if (/(fever|temperature|chills|shivering|hot body)/i.test(text) && /(headache|body pain|weakness|vomit|nausea)/i.test(text)) {
    urgency = 'HIGH';
    recommendedDept = 'General OPD';
    possibleConditions = [
      { displayName: 'Acute Febrile / Viral Syndrome', matchStrength: 'HIGHER_MATCH', shortReason: 'Co-occurrence of elevated temperature, headache and systemic malaise.' },
      { displayName: 'Endemic Febrile Illness (e.g. Malaria)', matchStrength: 'MODERATE_MATCH', shortReason: 'Common presentation of chills, fever peaks and generalized body aches.' }
    ];
    responseText = `Hello ${patientName}. Thank you for sharing your symptoms. 

### 🩺 Clinical Triage Overview:
- **Presentation**: Acute Febrile Illness with systemic symptoms (fever, headache, and body aches).
- **Triage Priority**: **High Urgency** (prompt diagnostic testing recommended).
- **Recommended Clinic**: **General OPD / Internal Medicine**.

### 💡 Comfort & Supportive Care:
- **Hydration**: Drink plenty of fluids (water, electrolyte drinks, or clear broths) to prevent dehydration from fever.
- **Cool Comfort**: Rest in a well-ventilated room, wear lightweight clothing, and apply a cool, damp cloth to the forehead if needed.
- **Monitoring**: Check your temperature with a thermometer every few hours.
- **Laboratory Review**: We strongly recommend having an OPD doctor perform diagnostic screening (such as Malaria RDT, Full Blood Count, or Urinalysis) to target the root cause.`;
  }
  // 6. Respiratory / Cough / Sore Throat / ENT
  else if (/(cough|sore throat|throat|tonsil|runny nose|nasal|sinus|ear pain|earache|hearing)/i.test(text)) {
    urgency = 'MEDIUM';
    recommendedDept = 'ENT';
    possibleConditions = [
      { displayName: 'Upper Respiratory Tract Infection / Pharyngitis', matchStrength: 'HIGHER_MATCH', shortReason: 'Irritation, inflammation of the mucosal lining in throat or airways.' },
      { displayName: 'Acute Otitis Media / Sinusitis', matchStrength: 'MODERATE_MATCH', shortReason: 'Ear or sinus congestion and localized pressure.' }
    ];
    responseText = `Hello ${patientName}. Upper respiratory and ear/throat symptoms are very common and benefit from targeted soothing measures.

### 🩺 Clinical Triage Overview:
- **Presentation**: Upper Respiratory / Otolaryngology (ENT) symptoms.
- **Triage Level**: **Medium Urgency**.
- **Recommended Department**: **ENT (Ear, Nose & Throat Clinic)** or General OPD.

### 💡 Home Soothing Measures:
- **Throat Relief**: Warm salt-water gargles (1/2 tsp salt in warm water) 3 times daily soothe inflamed throat tissue.
- **Warm Steam**: Inhaling warm steam helps loosen mucus and ease nasal congestion.
- **Hydration**: Warm herbal teas with honey help coat the throat and calm coughing.
- **Caution**: Avoid inserting cotton buds or objects into the ears if ear discomfort is present.`;
  }
  // 7. General Educational / Health Questions (Diet, Wellness, Chronic Disease, Vitamins)
  else if (/(what is|how does|why is|explain|tell me about|foods for|diet|vitamin|water|hydration|exercise|blood pressure|hypertension|diabetes|cholesterol|paracetamol|ibuprofen|sleep)/i.test(text)) {
    responseText = `Hello ${patientName}! Here is detailed health information regarding your question:

### 📚 Health & Clinical Insights:
- **Understanding the Concept**: Proper health management involves balancing nutrition, hydration, regular physical activity, and preventive medical screenings.
- **Key Recommendations**:
  1. **Balanced Nutrition**: Emphasize whole grains, leafy green vegetables, lean proteins, and antioxidant-rich fruits.
  2. **Hydration**: Aim for 2 to 3 liters of clean water daily to support kidney function, cellular metabolism, and skin elasticity.
  3. **Consistent Rest**: Quality sleep (7–9 hours nightly for adults) allows tissue repair, immune regulation, and cognitive recovery.
  4. **Routine Check-ups**: Regular blood pressure, blood glucose, and lipid checks catch silent conditions early.

Is there any specific area you'd like more personalized details about? Feel free to ask!`;
    return {
      text: responseText,
      metadata: null
    };
  }
  // 8. General Clinical Default
  else {
    urgency = 'ROUTINE';
    recommendedDept = 'General OPD';
    possibleConditions = [
      { displayName: 'General Health & Clinical Consultation', matchStrength: 'MODERATE_MATCH', shortReason: 'Routine evaluation and clinical discussion.' }
    ];
    responseText = `Hello ${patientName}! I have reviewed your inquiry: **"${message}"**.

### 🩺 Clinical Triage Guidance:
- **Triage Level**: **Routine Consultation**
- **Recommended Department**: **General OPD (Outpatient Department)**

### 💡 To provide even more personalized advice, you can share:
1. When did you first notice this, and how long has it lasted?
2. On a scale of 1 to 10, how intense is any discomfort?
3. Are there any other symptoms (such as fever, nausea, dizziness, or fatigue)?

You can also use the button below to book an in-person appointment with one of our physicians!`;
  }

  return {
    text: responseText,
    metadata: {
      urgency,
      recommendedDepartment: recommendedDept,
      redFlagDetected,
      recommendedAction: recommendedDept ? `Schedule a consultation with ${recommendedDept} for physical examination.` : 'Continue healthy lifestyle and consult doctor if symptoms arise.',
      possibleConditions
    }
  };
}

export const chatbotLlmService = {
  async generateResponse(message, contextData = {}) {
    const groqKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
    const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 1. Try Groq first if available (Groq has active high-speed models)
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

    // 4. Default to generative clinical synthesis engine
    return generateClinicalSynthesis(message, contextData);
  }
};
