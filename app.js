require('dotenv').config();                           //we configure this so that it can access the enviournment variables.
const express    = require("express");
const bodyParser = require("body-parser");
const ejs        = require("ejs");
const mongoose   = require("mongoose");
const session    = require("express-session");
const passport   = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { serializeUser, deserializeUser } = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const encrypt    = require("mongoose-encryption");    //we use this package for encryption and authentication.
// const md5        = require("md5");
// const bycrypt = require("bcrypt");
// const saltrounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({                //This has to be initialized here only.
    secret:"this is pur secret", //Setting up the session with some initial values/parameters.
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1/userDB");     //we changed the URL bcz of the the chhanges in ipv4 and ipv6 addressing.

// const userSchema = {                      //Creating schema //This is simple javascript Object.
//     email:String,                         //We can use this schema unless untill we are not doing anything fancy/Complex with this.
//     password:String                       //Here we have to add plugins to our Schema thats why we have to use mongoose.schemas!
// };

const userSchema = new mongoose.Schema({     //This is no longer a Simple java script obkect ,it is a object which was created using   
    email:String,                            //mongoose.schema class 
    password:String,
    googleId:String //we added this beacuse of sign in with third party apllication Task.
});

// const secretcode = "thisismysecretcode";     //before using envionment variables
const secretcode = process.env.SECRETCODE;      //after using environment variables

userSchema.plugin(passportLocalMongoose);       //This will do Salting + Hashing.
userSchema.plugin(findOrCreate);


// userSchema.plugin(encrypt,{secret:secretcode, encryptedFields : ['password']}); 
//This will encrypt our entire databse and then how we going to search for emails?. thats why we use encryption field.

const User = new mongoose.model("User",userSchema);     //creating Model

passport.use(User.createStrategy());               //Use to authenticate users.
// passport.serializeUser(User.serializeUser());      //Creates the cookie and stuff the cookie with user information/data into.
// passport.deserializeUser(User.deserializeUser());  //Fetch the cookie and Discovers the information/data of the users.

//These are the serializing and non-serializing techniques which work for all type of stratergies not only for "local" stratergy 
// as above method. 
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {    //Access token helps us to have access user info. for a longer period of time.
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");        //ejs ke sath render use hota hai.
})

app.get('/auth/google',        //this code snippet is added from passport.js documentaion -> stratergies -> google2.0 ->authentication 
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', //this code snippet is added from passport.js documentaion -> stratergies -> google2.0 ->authentication 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
    res.render("login");        
})

app.get("/register",function(req,res){
    res.render("register");        
})

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else res.redirect("/login");
});

app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,newuser){
            if(err){
                console.log(err);
                res.redirect("/register");
            }
            else{
                passport.authenticate("local")(req,res,function(){  //we athenticatae in a local mode.
                    res.redirect("/secrets");   //this call back fn only works when user authentication was a success.
                });
            }
    });
    // bycrypt.hash(req.body.password,saltrounds,function(err,hash){
    //     const newUser = new User({
    //         email : req.body.username,
    //         password:hash
    //         // password  : req.body.password    //instead os saving the password as a string we are going to use md5 hash.
    //         // password : md5(req.body.password)
    //     });
        
    //     newUser.save(function(err){
    //         if(err) res.send(err);
    //         else    res.render("secrets");
    //     });
    // });
});

app.post("/login",function(req,res){
    const newuser = new User({
        username : req.body.username,       //passport me "username" or "password" name se hi store hoga data database me
        passsword : req.body.password       //so if we have different schema then irrespective of that schema it will create 3
                                            //seperate columns name as username, hash and salt automatically.
    });
    req.login(newuser,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(err,user){
                res.redirect("/secrets");
            });
        }
    });

    // const username = req.body.username;
    // const password  = req.body.password;
    // User.findOne({email:username},function(err,founduser){
    //     if(err) connsole.log(err);
    //     else{
    //         if(founduser){
    //             bycrypt.compare(password,founduser.password,function(err,results){  //lvl4 security.
    //                 if(results==true) res.render("secrets");
    //             });
    //             // if(founduser.password === md5(password)){
    //             //     res.render("secrets");
    //             // }
    //         }
    //     }
    // });
});

app.post("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});





app.listen(3000,function(req,res){
    console.log("Server Started at port 3000");
});