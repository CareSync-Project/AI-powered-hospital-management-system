import { queueService } from './queueService.js';

const workflowHelp = 'For an assigned visit: check the patient in, record measured vitals, complete nurse triage, then move the patient to the waiting queue. Only perform actions you have clinically completed.';

export const nurseAssistantService = {
  async respond(nurseId, message) {
    const text = message.trim().toLowerCase();
    const assigned = await queueService.nurseAssigned(nurseId);
    const today = await queueService.nurse(nurseId);
    const statuses = ['CONFIRMED','CHECKED_IN','TRIAGED','WAITING','IN_CONSULTATION'];
    const counts = Object.fromEntries(statuses.map(status => [status, today.filter(item => item.status === status).length]));
    let response = workflowHelp;
    let intent = 'WORKFLOW_HELP';
    if (/assigned|how many|patient list|my patients/.test(text)) {
      intent = 'ASSIGNMENT_SUMMARY';
      response = `You have ${today.length} assigned patient${today.length === 1 ? '' : 's'} today and ${assigned.length} active assigned visit${assigned.length === 1 ? '' : 's'} in total. Today: ${counts.CONFIRMED} confirmed, ${counts.CHECKED_IN} checked in, ${counts.TRIAGED} triaged, ${counts.WAITING} waiting, and ${counts.IN_CONSULTATION} in consultation.`;
    } else if (/vital|blood pressure|temperature|spo2|oxygen|pulse/.test(text)) {
      intent = 'VITALS_HELP';
      response = 'Open an assigned checked-in patient, confirm identity, measure the patient, and enter only observed values in Vital Records. The system validates ranges and calculates BMI when both height and weight are entered.';
    } else if (/triage|urgency|emergency|red flag/.test(text)) {
      intent = 'TRIAGE_HELP';
      response = 'Complete triage only after check-in. Select urgency using your clinical assessment; the assistant does not choose urgency. For an emergency or deteriorating patient, follow hospital emergency protocol immediately.';
    } else if (/notification|announcement/.test(text)) {
      intent = 'NOTIFICATION_HELP';
      response = 'Open Announcements from the nurse sidebar or notification bell. You can mark individual messages or all messages as read.';
    } else if (/hello|hi|help|what can you do/.test(text)) {
      intent = 'HELP';
      response = 'I can summarize your assigned workload and explain CareSync nurse workflow, vital entry, triage, the waiting queue, and announcements. I cannot diagnose or prescribe.';
    }
    return { intent, response, counts, assignedToday: today.length, assignedTotal: assigned.length, disclaimer: 'Operational guidance only; not a diagnosis or substitute for clinical policy.' };
  },
};
