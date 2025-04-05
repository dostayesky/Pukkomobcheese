const express=require('express');
const {getProviders,createProvider,deleteProvider} = require('../controllers/providers');
const router=express.Router();

router.route('/').get(getProviders).post(createProvider); // not auth for create yet
router.route('/:id').delete(deleteProvider);

module.exports=router;