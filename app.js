require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const session = require('express-session');
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


// create app
const app = express();


// initialize app
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret: process.env.SESSION_SECRET,
  	resave: false,
  	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


// db setup
const dbAddress="mongodb://localhost:27017/";
const dbName="userDB";
mongoose.connect(dbAddress + dbName);
mongoose.set("useCreateIndex", true);


// user schema setup
const userSchema = new mongoose.Schema ({
  	email: { type:String, required:true },
  	password: { type:String, required:true },
  	secret: { type:String, required:false }
});
userSchema.plugin(passportLocalMongoose);


// user model setup
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// -----------------------------------------------------------------------
// routing
// -----------------------------------------------------------------------

app.get("/", (req, res) => {
  	res.render("home");
});

// -----------------------------------------------------------------------

app.route("/register")

.get((req, res) => {
  	res.render("register");
})

.post((req, res) => {
	User.register({username: req.body.username}, req.body.password, (err, user) => {
	  if (err) {
			console.log(err);
			res.redirect("/register");
	  } else {
			passport.authenticate("local")(req, res, () => {
				  res.redirect("/secrets");
			});
	  }
	});
});

// -----------------------------------------------------------------------

app.route("/login")

.get((req, res) => {
  	res.render("login");
})

.post((req, res) => {
	const user = new User({
	  	username: req.body.username,
	  	password: req.body.password
	});

	req.login(user, (err) => {
	  	if (err) {
		  	console.log(err);
	  	} else {
			passport.authenticate("local")(req, res, () => {
			  	res.redirect("/secrets");
			});
	  	}
	});
});

// -----------------------------------------------------------------------

app.get("/logout", (req, res) => {
	req.logout();
	res.redirect("/");
});

// -----------------------------------------------------------------------

app.get("/secrets", (req, res) => {
  	User.find({"secret": {$ne: null}}, (err, foundUsers) => {
    	if (err) {
      		console.log(err);
    	} else {
      		if (foundUsers) {
        		res.render("secrets", {usersWithSecrets: foundUsers});
      		}
    	}
  	});
});

// -----------------------------------------------------------------------

app.route("/submit")

.get((req, res) => {
  	if (req.isAuthenticated()) {
    	res.render("submit");
  	} else {
    	res.redirect("/login");
  	}
})

.post((req, res) => {
  	const submittedSecret = req.body.secret;
  	User.findById(req.user.id, (err, foundUser) => {
    	if (err) {
     	console.log(err);
    	} else {
      		if (foundUser) {
        		foundUser.secret = submittedSecret;
        		foundUser.save(() => {
          			res.redirect("/secrets");
        		});
      		}
    	}
  	});
});

// -----------------------------------------------------------------------
// routing
// -----------------------------------------------------------------------

// launch app on port 3000
app.listen(3000, () => {
  	console.log("Server started on port 3000.");
});
