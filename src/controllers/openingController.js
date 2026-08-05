const Opening=require("../models/Opening");
const pick=b=>({title:b.title,type:b.type,location:b.location,description:b.description,isActive:b.isActive});
async function publicList(_q,res,next){try{res.json({success:true,data:await Opening.find({isActive:true}).sort({createdAt:-1}).lean()});}catch(e){next(e);}}
async function list(_q,res,next){try{res.json({success:true,data:await Opening.find().sort({createdAt:-1}).lean()});}catch(e){next(e);}}
async function create(req,res,next){try{res.status(201).json({success:true,data:await Opening.create(pick(req.body))});}catch(e){next(e);}}
async function update(req,res,next){try{const x=await Opening.findByIdAndUpdate(req.params.id,pick(req.body),{new:true,runValidators:true});if(!x)return res.status(404).json({success:false,message:"Opening not found."});res.json({success:true,data:x});}catch(e){next(e);}}
async function remove(req,res,next){try{const x=await Opening.findByIdAndDelete(req.params.id);if(!x)return res.status(404).json({success:false,message:"Opening not found."});res.json({success:true,message:"Opening deleted."});}catch(e){next(e);}}
module.exports={publicList,list,create,update,remove};
