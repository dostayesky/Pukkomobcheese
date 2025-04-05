const express=require('express');
const {getProviders} = require('../controllers/providers');
const router=express.Router();

router.route('/').get(getProviders);

module.exports=router;