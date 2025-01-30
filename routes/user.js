const express = require("express");
const router = express.Router();
const User = require('../models/user');
const passport = require("passport");
const nodemailer = require('nodemailer');
const passportLocalMongoose = require('passport-local-mongoose');
const Otp = require('../models/Otp');
const Car = require('../models/car');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }

// Login route
router.get("/login", (req, res) => {
    req.flash('error_msg', 'Welcome back');
    res.render("./users/login.ejs");
});

router.post("/login", async (req, res, next) => {
    // Passport Authentication manually
    passport.authenticate("local", async (err, user, info) => {
        if (err) {
            console.error("Error during authentication:", err);
            req.flash('error_msg', 'Something went wrong. Please try again.');
            return res.redirect("/user/login"); // Redirect back to login if there was an error
        }
        if (!user) {
            req.flash('error_msg', info.message || 'Invalid credentials. Please check your username and password.');
            return res.redirect("/user/login"); // Invalid login credentials
        }
        // If login is successful, log in the user
        req.login(user, async (err) => {
            if (err) {
                console.error("Login failed:", err);
                req.flash('error_msg', 'Login failed. Please try again.');
                return res.redirect("/user/login");
            }
            // Flash a success message and redirect based on user role
            req.flash('success_msg', 'You have successfully logged in!');
            res.redirect("/user/admin"); // Redirect to admin dashboard
        });
    })(req, res, next);
});

router.get("/admin", async(req,res)=>{
    const cars = await Car.find({});
    res.render("./admin-dashboard.ejs",{cars})
})


// Logout route
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/"); // Redirect to homepage after logout
    });
});



module.exports = router;



