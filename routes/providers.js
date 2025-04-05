const express=require('express');
const {getProviders,createProvider,deleteProvider} = require('../controllers/providers');

//Include other resource routers
const bookingRouter=require('./bookings');

const router=express.Router();

//Re-route into other resource routers
router.use('/:providerId/bookings/',bookingRouter);

router.route('/').get(getProviders).post(createProvider); // not auth for create yet
router.route('/:id').delete(deleteProvider);

module.exports=router;