const express=require('express');
const {getProviders,createProvider} = require('../controllers/providers');
const router=express.Router();

router.route('/').get(getProviders).post(createProvider); // not auth for create yet

module.exports=router;