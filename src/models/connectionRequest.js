const { default: mongoose, Types } = require("mongoose");
const user = require("../models/user");

const connectionRequestSchema = new mongoose.Schema({
    toUserId: {
        type: mongoose.Types.ObjectId,
        ref:user,
        require
    },
    fromUserId: {
        type: mongoose.Types.ObjectId,
        ref: user,
        require
    },
    status: {
        type: String,
        enum: {
            values: ['interested', 'ignored', "accepted", "rejected"],
            message: 'status {VALUE} is not supported'
        }

    }
},
    {
        timestamps: true
    })

    // connectionRequestSchema.pre('save',function (req,res,next) {
    //     const toUserId = req.params.toUserId
    //     if(toUserId == this._id){
    //         throw new Error("cant send request to yourself!...");
            
    //     }
    //     next()
        
    // })



    connectionRequestSchema.pre('save', function (next) {
        const connectionRequest = this
        // if(connectionRequest.fromUserId.to){
        //     throw new Error("cant send request to yourself..!");
            
        // }
        next();
    });
    

    module.exports = mongoose.model('ConnectionRequest',connectionRequestSchema)