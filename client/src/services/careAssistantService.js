import api from'./api';export const careAssistantService={message:data=>api.post('/patient/care-assistant/message',data)};
