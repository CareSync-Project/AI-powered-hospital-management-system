export const GENERAL_HEALTH={
  'what is fever':'Fever means an elevated body temperature, commonly 38°C or above when measured accurately. It is a sign with many possible causes, not a diagnosis.',
  'what is blood pressure':'Blood pressure describes the force of circulating blood against artery walls and is recorded as systolic over diastolic pressure in mmHg.',
  'what does spo2 mean':'SpO2 is an estimate of blood oxygen saturation measured by a pulse oximeter. Readings must be interpreted with symptoms, device accuracy, and clinical context.',
};
export function healthInformation(message){const key=Object.keys(GENERAL_HEALTH).find(item=>message.toLowerCase().includes(item));return key?`${GENERAL_HEALTH[key]} General information does not replace professional assessment.`:null;}
export function safeHelp(){return'I can show hospitals, departments, clinic days, available doctors, your appointments, masked card status, symptom assessment, and prepare a booking handoff. I cannot diagnose or prescribe medication.';}
