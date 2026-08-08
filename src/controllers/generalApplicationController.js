const GeneralApplication = require("../models/GeneralApplication");
const { getR2Config } = require("../config/r2");

function validResumeUrl(value) {
  try {
    const expected = new URL(`${getR2Config().publicUrl}/`);
    const received = new URL(value);
    return (
      received.origin === expected.origin &&
      received.pathname.startsWith(`${expected.pathname}resumes/`)
    );
  } catch {
    return false;
  }
}
async function create(req, res, next) {
  try {
    if (!validResumeUrl(req.body.resumeUrl))
      return res
        .status(422)
        .json({
          success: false,
          message: "A valid uploaded resume is required.",
          errors: { resumeUrl: "Upload a valid resume" },
        });
    const item = await GeneralApplication.create(req.body);
    return res
      .status(201)
      .json({
        success: true,
        message:
          "Thank you for introducing yourself. We will be in touch when there is a strong match.",
        data: { id: item.id },
      });
  } catch (e) {
    next(e);
  }
}
async function list(_req, res, next) {
  try {
    return res.json({
      success: true,
      data: await GeneralApplication.find().sort({ createdAt: -1 }).lean(),
    });
  } catch (e) {
    next(e);
  }
}
async function getOne(req,res,next){try{const item=await GeneralApplication.findById(req.params.id).lean();if(!item)return res.status(404).json({success:false,message:"Introduction not found."});return res.json({success:true,data:item})}catch(e){next(e)}}
async function updateStatus(req, res, next) {
  try {
    const item = await GeneralApplication.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true },
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Introduction not found." });
    return res.json({ success: true, data: item });
  } catch (e) {
    next(e);
  }
}
async function remove(req, res, next) {
  try {
    const item = await GeneralApplication.findByIdAndDelete(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Introduction not found." });
    return res.json({ success: true, message: "Introduction deleted." });
  } catch (e) {
    next(e);
  }
}
async function search(req,res,next){try{const{query,status,page,limit,fromDate,toDate}=req.query,filter=status==="all"?{}:{status};if(fromDate||toDate){filter.createdAt={};if(fromDate){const d=new Date(fromDate);d.setUTCHours(0,0,0,0);filter.createdAt.$gte=d}if(toDate){const d=new Date(toDate);d.setUTCHours(23,59,59,999);filter.createdAt.$lte=d}}const words=String(query).split(/\s+/).filter(Boolean),fields=["firstName","lastName","email","phone","location","desiredRole","skills","interests"];if(words.length)filter.$and=words.map(word=>{const safe=word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return{$or:fields.map(field=>({[field]:{$regex:safe,$options:"i"}}))}});const[items,total]=await Promise.all([GeneralApplication.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),GeneralApplication.countDocuments(filter)]);res.json({success:true,data:{items,pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))}}})}catch(e){next(e)}}
module.exports = { create, getOne, list, remove, search, updateStatus };
