const express=require('express');
const {getProviders,createProvider,updateProvider,deleteProvider} = require('../controllers/providers');

//Include other resource routers
const bookingRouter=require('./bookings');

const router=express.Router();

const {protect, authorize} = require('../middleware/auth');

//Re-route into other resource routers
router.use('/:providerId/bookings/',bookingRouter);

router.route('/').get(getProviders).post(protect, authorize('admin'), createProvider); // not auth for create yet
router.route('/:id').put(protect, authorize('admin'), updateProvider).delete(protect, authorize('admin'), deleteProvider);

module.exports=router;