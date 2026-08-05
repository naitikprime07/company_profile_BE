const jwt=require("jsonwebtoken");
module.exports=(req,res,next)=>{const value=req.headers.authorization||"";if(!value.startsWith("Bearer "))return res.status(401).json({success:false,message:"Admin authentication required."});try{req.admin=jwt.verify(value.slice(7),process.env.JWT_SECRET);next();}catch{return res.status(401).json({success:false,message:"Invalid or expired session."});}};
