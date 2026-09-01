import { Router } from 'express';
import healthRouter from './healthRoutes.js';
import hospitalRouter from './hospitalRoutes.js';
import departmentRouter from './departmentRoutes.js';
import doctorRouter from './doctorRoutes.js';
import { patientRouter, patientCardRouter } from './patientRoutes.js';
import appointmentRouter from './appointmentRoutes.js';
import { developmentRouteNotice } from '../middleware/developmentRouteNotice.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use(developmentRouteNotice);
apiRouter.use('/hospitals', hospitalRouter);
apiRouter.use('/departments', departmentRouter);
apiRouter.use('/doctors', doctorRouter);
apiRouter.use('/patients', patientRouter);
apiRouter.use('/patient-cards', patientCardRouter);
apiRouter.use('/appointments', appointmentRouter);

export default apiRouter;
