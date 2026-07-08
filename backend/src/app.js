const express=require("express");

const cors=require("cors");


const app=express();



app.use(cors());

app.use(express.json());




// routes later

app.get("/",(req,res)=>{

res.json({

message:"Clinic Inventory API Running"

});

});



module.exports=app;