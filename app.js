const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt  = require("mongoose-encryption");    //we use this package for encryption and authentication.

const app = express();
mongoose.connect("mongodb://localhost:27017/userDB");

// const userSchema = {    //Creating schema //This is simple javascript Object.
//     email:String,       //We can use this schema unless untill we are not doing anything fancy/Complex with this.
//     password:String     //Here we have to add plugins to our Schema thats why we have to use mongoose.schemas!
// };

const userSchema = new mongoose.Schema({    //This is no longer a Simple java script obkect ,it is a object which was created using   
    email:String,                           //mongoose.schema class 
    password:String
});

const secretcode = "thisismysecretcode";
userSchema.plugin(encrypt,{secret:secretcode, encryptedFields : ['password']}); 
//This will encrypt our entire databse and then how we going to search for emails?. thats why we use encryption field.

const User = new mongoose.model("User",userSchema);     //creating Model

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

app.get("/",function(req,res){
    res.render("home");        //ejs ke sath render use hota hai.
})


app.get("/login",function(req,res){
    res.render("login");        
})

app.get("/register",function(req,res){
    res.render("register");        
})

app.post("/register",function(req,res){

    newUser = new User({
        email : req.body.username,
        password  : req.body.password
    });
    
    newUser.save(function(err){
        if(err) res.send(err);
        else    res.render("secrets");
    });
});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password  = req.body.password;
    User.findOne({email:username},function(err,founduser){
        if(err) connsole.log(err);
        else{
            if(founduser){
                if(founduser.password === password){
                    res.render("secrets");
                }
            }
        }
    });
});





app.listen(3000,function(req,res){
    console.log("Server Started at port 3000");
});