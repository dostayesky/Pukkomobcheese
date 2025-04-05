const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

//@desc     Get all bookings
//@route    GET /api/v1/bookings
//@access   Private
exports.getBookings=async (req,res,next)=>{
    let query;
    //General users can see only their bookings!
    if(req.user.role !== 'admin'){
        query=Booking.find({user:req.user.id}).populate({
            path:'provider',
            select:'name province tel'
        });
    } else{
        if(req.params.providerId){
            console.log(req.params.providerId);
            query=Booking.find({provider: req.params.providerId}).populate({
                path:'provider',
                select:'name province tel'
            });
        } else{
            query=Booking.find().populate({
                path:'provider',
                select:'name province tel'
            });
        }
    }
    try{
        const bookings=await query;

        res.status(200).json({
            success: true,
            count:bookings.length,
            data: bookings
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({success:false,message:"Cannot find Booking"});
    }
};

//@desc     Get single booking
//@route    GET /api/v1/bookings/:id
//@access   Public
exports.getBooking=async (req,res,next)=>{
    try{
        const booking= await Booking.findById(req.params.id).populate({
            path: 'provider',
            select: 'name description tel'
        });
        
        if(!booking){
            return res.status(404).json({success:false,message:`No booking with the id of ${req.params.id}`});
        }

        res.status(200).json({
            success:true,
            data: booking
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({success:false,message:"Cannot find Booking"});
    }
};

//@desc     Add booking
//@route    POST /api/v1/providers/:providerId/bookings
//@access   Private
exports.addBooking=async (req,res,next)=>{
    try{
        req.body.provider=req.params.providerId;

        const provider = await Provider.findById(req.params.providerId);

        if(!provider){
            return res.status(404).json({success:false, message: `No provider with the id of ${req.params.providerId}`});
        }

        if(provider.carAvaliable == 0){
            return res.status(404).json({success:false, message: "No cars available for rent at the moment"});
        }

        //add user Id to req.body
        req.body.user=req.user.id;

        //Check for existed booking
        const existedBookings=await Booking.find({user:req.user.id});

        //If the user is not an admin, they can only create 3 booking.
        if(existedBookings.length >= 3 && req.user.role !== 'admin'){
            return res.status(400).json({success:false, message: `The user with ID ${req.user.id} has already made 3 bookings`});
        }

        const booking = await Booking.create(req.body);

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({success:false,message:"Cannot create Booking"});
    }
};

//@desc     Update booking
//@route    PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking=async (req,res,next) => {
    try{
        let booking= await Booking.findById(req.params.id);

        if(!booking){
            return res.status(404).json({success:false,message:`No booking with the id of ${req.params.id}`});
        }

        //Make sure user is the booking owner
        if(booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success:false,message:`User ${req.user.id} is not authorized to update this booking`});
        }

        booking=await Booking.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        });

        res.status(200).json({
            success:true,
            data:booking
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({success:false,message:"Cannot update Booking"});
    }
};

//@desc     Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
exports.deleteBooking=async (req,res,next) => {
    try{
        const booking= await Booking.findById(req.params.id);

        if(!booking){
            return res.status(404).json({success:false,message:`No booking with the id of ${req.params.id}`});
        }

        //Make sure user is the booking owner
        if(booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success:false,message:`User ${req.user.id} is not authorized to delete this booking`});
        }
        const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        const isLessThanOneDay = Date.now() - new Date(booking.createdAt).getTime() < oneDayInMs;
        let fee =  0;
        if (isLessThanOneDay) {
            console.log("Less than 1 day has passed since booking was created.");
        } else {
            fee = 200;
            console.log("More than 1 day has passed.");
        }
        await booking.deleteOne();

        res.status(200).json({
            success:true,
            data:{},
            fee 
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({success:false, message:"Cannot delete Booking"});
    }
};