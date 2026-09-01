import { Router } from 'express';
import healthRouter from './healthRoutes.js';
import hospitalRouter from './hospitalRoutes.js';
import departmentRouter from './departmentRoutes.js';
import doctorRouter from './doctorRoutes.js';
import { patientRouter, patientCardRouter } from './patientRoutes.js';
import appointmentRouter from './appointmentRoutes.js';
import authRouter from './authRoutes.js';
import adminRouter from './adminRoutes.js';
import { departmentScheduleRouter, doctorScheduleRouter, scheduleExceptionRouter } from './schedulingManagementRoutes.js';
import patientSelfServiceRouter from './patientSelfServiceRoutes.js';
import clinicalRouter from './clinicalRoutes.js';
import superAdminRouter from './superAdminRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/super-admin', superAdminRouter);
apiRouter.use('/department-schedules', departmentScheduleRouter);
apiRouter.use('/doctor-schedules', doctorScheduleRouter);
apiRouter.use('/schedule-exceptions', scheduleExceptionRouter);
apiRouter.use('/patient', patientSelfServiceRouter);
apiRouter.use('/clinical', clinicalRouter);
apiRouter.use('/hospitals', hospitalRouter);
apiRouter.use('/departments', departmentRouter);
apiRouter.use('/doctors', doctorRouter);
apiRouter.use('/patients', patientRouter);
apiRouter.use('/patient-cards', patientCardRouter);
apiRouter.use('/appointments', appointmentRouter);

export default apiRouter;
