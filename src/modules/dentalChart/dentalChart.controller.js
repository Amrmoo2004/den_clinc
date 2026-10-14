import { Router } from 'express';
import * as patientsService from '../patients/patients.service.js';
import { authUser } from '../../middlewares/authentaction.js';

const router = Router();

router.get('/:id', authUser, patientsService.getDentalChart);
router.put('/:id', authUser, patientsService.updateDentalChart);
router.patch('/:id', authUser, patientsService.updateDentalChart);
router.post('/:id', authUser, patientsService.updateDentalChart);
router.put('/:id/:tooth', authUser, patientsService.updateSingleTooth);
router.patch('/:id/:tooth', authUser, patientsService.updateSingleTooth);
router.delete('/:id', authUser, patientsService.resetDentalChart);

export default router;
