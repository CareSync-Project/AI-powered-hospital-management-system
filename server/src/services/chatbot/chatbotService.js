import { detectIntent, extractDepartmentName, extractTemperature } from './chatbotIntentService.js';
import { healthInformation, safeHelp } from './chatbotSafetyService.js';
import { chatbotToolService } from './chatbotToolService.js';
import { chatbotLlmService } from './chatbotLlmService.js';

const contexts = new Map();
const days = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };

const time = (value) => new Date(value).toLocaleTimeString('en-GH', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

const nextDate = (day) => {
  const date = new Date();
  const target = days[day?.toUpperCase()];
  if (target === undefined) return date.toISOString().slice(0, 10);
  let delta = (target - date.getDay() + 7) % 7;
  if (!delta) delta = 7;
  date.setDate(date.getDate() + delta);
  return date.toISOString().slice(0, 10);
};

export async function respondToPatient({ message, hospitalId, date, auth, patient, request }, dependencies = {}) {
  const tools = dependencies.tools || chatbotToolService;
  const previous = contexts.get(auth.userId) || {};
  const context = { ...previous, ...(hospitalId ? { hospitalId } : {}), ...(date ? { date } : {}) };
  const intent = detectIntent(message, context);

  let data = null;
  let response = '';

  // Get hospital & departments for context injection
  let hospitalData = null;
  let availableDepts = [];
  if (context.hospitalId) {
    try {
      availableDepts = await tools.departments(context.hospitalId);
    } catch {
      // ignore
    }
  }

  const patientName = patient?.firstName || auth?.user?.firstName || 'Patient';

  // 1. Direct operational inquiries
  if (intent === 'MY_APPOINTMENTS') {
    data = await tools.appointments(patient.id);
    const nearest = data.find(x => !['CANCELLED', 'COMPLETED', 'MISSED'].includes(x.status));
    response = data.length
      ? `You currently have ${data.length} appointment record(s) on file. Your upcoming appointment is **${nearest?.appointmentNumber || 'not scheduled'}** with Dr. ${nearest?.doctor?.firstName || ''} ${nearest?.doctor?.lastName || ''} in the ${nearest?.department?.name || 'clinic'} department on ${nearest ? new Date(nearest.appointmentDate).toLocaleDateString() : ''}.`
      : 'You do not have any active appointments scheduled. Would you like me to help you schedule one?';
  } else if (intent === 'CARD_STATUS') {
    data = await tools.cards(patient.id);
    response = data.length
      ? `Here are your registered health cards:\n` + data.map(x => `• **${x.cardType.replace('_', ' ')}** (\`${x.maskedCardNumber}\`): Status is **${x.verificationStatus}**`).join('\n')
      : 'You have no registered health cards. You can add your Hospital Card or NHIS Card in the Health Cards tab for administrator verification.';
  } else if (intent === 'DEPARTMENT_SCHEDULE') {
    const name = extractDepartmentName(message, context.departmentName);
    const department = name ? await tools.departmentByName(context.hospitalId, name) : null;
    if (department) {
      data = department.schedules;
      response = data.length
        ? `The **${department.name}** clinic operates on the following schedule:\n` + data.map(x => `• **${x.dayOfWeek}**: ${time(x.startTime)} – ${time(x.endTime)}`).join('\n')
        : `**${department.name}** does not currently have active clinic days configured.`;
    } else {
      response = availableDepts.length
        ? `Here are our active clinic departments: ${availableDepts.map(d => d.name).join(', ')}. Which department's schedule would you like to view?`
        : 'Please specify a department name (such as General OPD, ENT, Maternity, or Dental).';
    }
  } else if (intent === 'DOCTOR_AVAILABILITY') {
    const name = extractDepartmentName(message, context.departmentName);
    const department = name ? await tools.departmentByName(context.hospitalId, name) : null;
    if (department) {
      const targetDate = context.date || nextDate((message.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i) || [])[0]);
      data = await tools.doctors(department.id, targetDate);
      response = data.length
        ? `There are **${data.length} doctor(s)** available in **${department.name}** on **${targetDate}**:\n` +
          data.map(doc => `• **Dr. ${doc.firstName} ${doc.lastName}** (${doc.specialization}) — ${(doc.appointmentSlots || []).length} available time slot(s)`).join('\n') +
          `\n\nWould you like to proceed with booking an appointment?`
        : `No available doctor slots were found in **${department.name}** on **${targetDate}**. Please check another date.`;
    } else {
      response = 'Please specify which department or clinic you are inquiring about.';
    }
  } else {
    // 2. Generative LLM Medical Triage & Clinical Conversation
    const llmResult = await chatbotLlmService.generateResponse(message, {
      patientName,
      hospitalName: 'CareSync Hospital',
      departments: availableDepts
    });

    response = llmResult.text;
    const metadata = llmResult.metadata || {};

    // Match recommended department from database if available
    let matchedDepartment = null;
    if (metadata.recommendedDepartment && context.hospitalId) {
      matchedDepartment = availableDepts.find(d =>
        d.name.toLowerCase().includes(metadata.recommendedDepartment.toLowerCase()) ||
        metadata.recommendedDepartment.toLowerCase().includes(d.name.toLowerCase())
      ) || availableDepts[0] || null;
    }

    // If symptoms were evaluated, persist structured assessment for the patient
    if (context.hospitalId && (intent === 'SYMPTOM_CHECK' || metadata.possibleConditions?.length > 0)) {
      try {
        const temperature = extractTemperature(message);
        data = await tools.assess(
          patient,
          auth.userId,
          {
            hospitalId: context.hospitalId,
            symptomsText: message,
            symptoms: [],
            severity: metadata.urgency === 'HIGH' || metadata.urgency === 'EMERGENCY' ? 'SEVERE' : 'MILD',
            pregnancyStatus: false,
            temperature
          },
          request
        );

        // Enhance returned data with LLM details if available
        if (data) {
          if (metadata.urgency) data.urgency = metadata.urgency;
          if (metadata.redFlagDetected !== undefined) data.redFlagDetected = metadata.redFlagDetected;
          if (matchedDepartment) data.recommendedDepartment = matchedDepartment;
          if (metadata.possibleConditions?.length > 0) {
            data.possibleConditions = metadata.possibleConditions;
          }
        }
      } catch (err) {
        console.warn('Symptom assessment persistence warning:', err.message);
        data = {
          urgency: metadata.urgency || 'ROUTINE',
          redFlagDetected: Boolean(metadata.redFlagDetected),
          recommendedDepartment: matchedDepartment,
          possibleConditions: metadata.possibleConditions || [],
          recommendedAction: metadata.recommendedAction || 'Consult a healthcare professional.'
        };
      }
    } else if (metadata.urgency || matchedDepartment) {
      data = {
        urgency: metadata.urgency || 'ROUTINE',
        redFlagDetected: Boolean(metadata.redFlagDetected),
        recommendedDepartment: matchedDepartment,
        possibleConditions: metadata.possibleConditions || [],
        recommendedAction: metadata.recommendedAction || 'Consult a healthcare professional.'
      };
    }
  }

  contexts.set(auth.userId, {
    hospitalId: context.hospitalId,
    departmentId: context.departmentId,
    departmentName: context.departmentName,
    date: context.date
  });

  return {
    intent,
    response,
    data,
    context,
    requiresConfirmation: intent === 'BOOK_APPOINTMENT'
  };
}

export const chatbotService = {
  respond: respondToPatient,
  clearContext: (userId) => contexts.delete(userId)
};
