var express = require('express');
var expressValidator = require('express-validator');
var path = require('path'); //path.resolve
var app = express();
var ums = require('./bin/ums.js');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var session = require('express-session');

app.use(express.methodOverride());
app.use(expressValidator());
app.use(app.router);

//starting the server on port 1337
var listener = app.listen(process.env.PORT || 1337, function(){
    console.log('Listening on port '+ listener.address().port);
});

var argument = process.argv;
//if the user specifies a directory, use that directory
if (argument[2]){
    var fullPath = path.resolve(process.cwd(),argument[2]);
    app.use(express.static(fullPath));
    console.log(fullPath);
} //otherwise, use current directory
else{
    app.use(express.static(process.cwd() + '/'));
    console.log(argument);
}
//passport is what authenticates the user
passport.use(new LocalStrategy(function(username, password, done){
    if (ums.authenticate(username,password)==='User authentication successful.') return done(null, {username:username});
    return done(null, false);
}));

//determines what data from the user object that should be stored in the session
passport.serializeUser(function(user,done){
    done(null, user.username);
});


passport.deserializeUser(function(id,done){
    done(null, user.username);
});

app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(session({secret:'mySecret',resave:false,saveUninitialized:true}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/services/user',function(req,res){
    if(req.user)return res.send(req.user.username);
    req.send('not a user');
});

//create and authenticate user
app.post('/services/user',function(req,res) {
    if (req.body.email) {
        if (req.body.username) {
            if (req.body.password) {
                ums.createUser(req.body.email, req.body.username, req.body.password)
                    .then(function (resolution) {
                        if (resolution === 'Username already exists.') {
                            req.send('');
                        } else {
                            req.send('User Successfully Created.');
                        }
                    })
            } else {req.send('Password required.');}
        } else {req.send('Username required');}
    } else {req.send('Email required');}
});


app.put('/services/user', function(req,res){
    if (req.body.email){
        if (req.body.username){
            if (req.body.password){
                ums.createUser(req.body.email, req.body.username, req.body.password)
                    .then(function(resolution){
                        if (resolution === 'Username already taken.'){
                            ums.updatePassword(req.body.username, req.body.password)
                                .then(function (res){
                                    if (res === 'Password updated.'){
                                        req.send(res);
                                    } else{
                                        req.send('');
                                    }
                                })
                        } else{
                            req.send('User created');
                        }
                    });
            } else{req.send('Password required.');}
        } else{req.send('Username required.');}
    } else {req.send('Email required');}
});

//log user in
app.put('/services/login', passport.authenticate('local'), function(req, res){
    res.send(req.user.username +', You are logged in');
});

//log user out
app.put('/services/logout', function(req, res){
    req.logout();
    res.send('You are logged out');
});