var express = require("express");
var mongoose = require("mongoose"); 
mongoose.Promise = global.Promise;
var passport = require("passport"); 
var bodyParser = require("body-parser");
var LocalStrategy = require("passport-local");
var User = require("./models/user"); 
var message = require("./models/messages");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ejs = require('ejs');
const { use } = require("passport");
var users = {};


app.use(bodyParser.urlencoded({ extended: false })); 

app.engine('.html', ejs.__express);
app.set('view engine', 'html');

app.use(require("express-session")({ 
    secret: "Rusty is a dog", 
    resave: false, 
    saveUninitialized: false
})); 

app.use(passport.initialize()); 
app.use(passport.session()); 
  
passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser()); 

// Showing login page 
app.get("/", function (req, res) { 
    res.render("login.html"); 
}); 
  

// Showing register page 
app.get("/register", function (req, res) { 
    res.render("register.html"); 
}); 
  
// Handling user signup 
app.post("/register", function (req, res) { 
    var username = req.body.username 
    var password = req.body.password 
    User.register(new User({ username: username }), 
            password, function (err, user) { 
        if (err) { 
            console.log(err); 
            return res.render("register.html"); 
        } 
  
        passport.authenticate("local")( 
            req, res, function () { 
            res.render("chat.html");
        }); 
    }); 
}); 
  
//Showing login form 
app.get("/login", function (req, res) { 
    res.render("login.html"); 
}); 
  
//Handling user login 
app.post("/login", passport.authenticate("local", { 
    successRedirect: "/chat", 
    failureRedirect: "/login"
}), function (req, res) { 
}); 

// Showing chat page 
app.get("/chat", isLoggedIn, function (req, res) { 
    res.sendFile(__dirname + '/views/chat.html');
})
  
//Handling user logout  
app.get("/logout", function (req, res) { 
    req.logout(); 
    res.redirect("/"); 
}); 
app.use(express.static(__dirname + '/public'));  
function isLoggedIn(req, res, next) { 
    if (req.isAuthenticated()) return next(); 
    res.redirect("/login"); 
} 
mongoose.set('useNewUrlParser', true); 
mongoose.set('useFindAndModify', false); 
mongoose.set('useCreateIndex', true); 
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost/27017"); 


io.on('connection', function(socket){
    socket.on('login', function(username, callback) { // login to chatroom
        if (username in users) {
            callback(false);
        } else {
            socket.username = username;
            socket.broadcast.emit('enter', socket.username); //broadcast username when enterring
            users[socket.username] = socket; // set user online
            callback(true);
        }
    });

    socket.on('disconnect', function() {
        socket.broadcast.emit('leave', socket.username); //broadcast username when leaving
        delete users[socket.username]; // set user offline
    });

    socket.on('post', function(msg) {
        var newMsg = new message({ // create new message
            timestamp: new Date().toLocaleString(),
            user: socket.username,
            message: msg.trim()
        });
        newMsg.save(function(err) {
            if (err) {
                console.log('error occurs: ' + err);
                return;
            } else {
                io.sockets.emit('new message', {
                    timestamp: new Date().toLocaleString(),
                    user: socket.username,
                    message: msg.trim()
                });
            }
        });
    });

    message.find({}, function(err, history) { // load history messages
        if (err) {
            console.log('error occurs: ' + err);
            return;
        } else {
            console.log('loading chat histories');
            socket.emit('chat history', history); // retrieve char histories
        }
    });
});

    
var port = process.env.PORT || 3000; 
http.listen(port, function () { 
    console.log("Server is running as " + port); 
}); 