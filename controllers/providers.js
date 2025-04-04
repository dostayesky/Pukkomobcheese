const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

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
        res.status(201).json({
            success:true, 
            data:provider
        });
    } catch(err){
        res.status(400).json({success:false});
        console.log(err.stack);
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
        //await Booking.deleteMany({provider: req.params.id});
        await Provider.deleteOne({_id: req.params.id});
        
        res.status(200).json({success:true, data:{}});
    } catch(err){
        res.status(400).json({success:false});
    }
};