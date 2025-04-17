const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

const getAllProviders = async (queryParams = {}) => {
    let query;

    // Clone and prepare query params
    const reqQuery = { ...queryParams };
    reqQuery.carAvaliable = { gt: 0 };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = Provider.find(JSON.parse(queryStr));

    if (queryParams.select) {
        const fields = queryParams.select.split(',').join(' ');
        query = query.select(fields);
    }

    if (queryParams.sort) {
        const sortBy = queryParams.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 25;
    const startIndex = (page - 1) * limit;

    query = query.skip(startIndex).limit(limit);

    const providers = await query;
    return providers;
};

//@desc Get all Providers
//@route GET 
//@access Public
exports.getProviders= async (req,res,next) => {
    let query;

    //Copy req.query
    const reqQuery={...req.query};

    // Add condition: carAvaliable > 0
    reqQuery.carAvaliable = { gt: 0 }; // This will become $gt: 0 after string replacement

    //Fields to exclude
    const removeFields=['select', 'sort', 'page', 'limit'];

    //Loop over remove fields and delete them from reqQuery
    removeFields.forEach(param=>delete reqQuery[param]);
    console.log(reqQuery);

    //Create query string
    let queryStr=JSON.stringify(reqQuery);
    queryStr=queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,match=>`$${match}`);

    //finding resource
    query=Provider.find(JSON.parse(queryStr))/*.populate('appointments')*/;

    //Select Fields
    if(req.query.select){
        const fields=req.query.select.split(',').join(' ');
        query=query.select(fields);
    }

    //Sort
    if(req.query.sort){
        const sortBy=req.query.sort.split(',').join(' ');
        query=query.sort(sortBy);
    } else {
        query=query.sort('-createdAt');
    }

    //Pagination
    const page=parseInt(req.query.page,10)||1;
    const limit=parseInt(req.query.limit,10)||25;
    const startIndex=(page-1)*limit;
    const endIndex=page*limit;

    try{
        const total=await Provider.countDocuments();
        query=query.skip(startIndex).limit(limit);
        //Execute query
        const providers = await query;

        //Pagination result
        const pagination={};

        if(endIndex < total){
            pagination.next={
                page:page+1,
                limit
            }
        }

        if(startIndex > 0){
            pagination.prev={
                page:page-1,
                limit
            }
        }

        // Join providers_room if socket is available
        const io = req.app.get('io');
        const socket = req.app.get('socket');
        
        res.status(200).json({success:true, count:providers.length, pagination, data:providers});
    } catch(err){
        res.status(400).json({success:false});
    }
};

//@desc Create Provider
//@route POST 
//@access Private
exports.createProvider= async (req,res,next) => {
    try{
        const provider = await Provider.create(req.body);

        const io = req.app.get('io');
        const providers = await getAllProviders();
        io.to('providers_room').emit('providers_updated', providers);
        io.emit('providers_updated', providers);

        res.status(201).json({
            success:true, 
            data:provider
        });
    } catch(err){
        res.status(400).json({success:false});
        console.log(err.stack);
    }
};

//@desc Update Provider
//@route PUT /api/v1/providers/:id
//@access Private
exports.updateProvider=async (req,res,next) => {
    try{
        const provider = await Provider.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if(!provider){
            return res.status(400).json({success:false});
        }

        //io.emit('update_provider', provider);

        const io = req.app.get('io');
        const providers = await getAllProviders();
        io.to('providers_room').emit('providers_updated', providers);
        io.emit('providers_updated', providers);

        res.status(200).json({success:true, data: provider});
    } catch(err){
        res.status(400).json({success:false});
    }
};

//@desc Delete Provider
//@route DELETE /api/v1/providers/:id
//@access Private
exports.deleteProvider=async (req,res,next) => {
    try{
        const provider = await Provider.findById(req.params.id);
        if(!provider){
            return res.status(400).json({success:false});
        }

        await Booking.deleteMany({provider: req.params.id});
        await Provider.deleteOne({_id: req.params.id});
        
        const io = req.app.get('io');
        const providers = await getAllProviders();
        io.to('providers_room').emit('providers_updated', providers);
        io.emit('providers_updated', providers);

        res.status(200).json({success:true, data:{}});
    } catch(err){
        res.status(400).json({success:false});
    }
};