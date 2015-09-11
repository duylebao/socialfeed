let passport = require('passport')
let nodeifyit = require('nodeifyit')
let LocalStrategy = require('passport-local').Strategy;
let User = require('../models/user');
let crypto = require('crypto');
let FacebookStrategy = require('passport-facebook').Strategy;
let TwitterStrategy = require('passport-twitter').Strategy;

require('songbird')

const SALT = 'salt';

function useExternalPassportStrategy(OauthStrategy, config, field) {
  config.passReqToCallback = true
  passport.use(new OauthStrategy(config, nodeifyit(authCB, {spread: true})))

  async function authCB(req, token, _ignored_, account) {
    if (!req.user) {
        let column = field + '.id';
        let user = await User.promise.findOne({ column : account.id })
        if (user){
            return user;
        }else{
            let newUser = new User();
            if (field === 'facebook'){
              newUser.facebook.id    = account.id;                  
              newUser.facebook.token = token;                  
              newUser.facebook.name  = account.displayName
            }else{
              newUser.twitter.id    = account.id;                  
              newUser.twitter.token = token;                  
              newUser.twitter.name  = account.displayName 
            }

          //  newUser.facebook.email = account.emails[0].value;

            return await newUser.save();
        }
    } else {
        let user            = req.user; // pull the user out of the session
        // update the current users facebook credentials
        if (field === 'facebook'){
          user.facebook.id    = account.id;
          user.facebook.token = token;
          user.facebook.name  = account.displayName;
        //  user.facebook.email = account.emails[0].value;
        }else{
          user.twitter.id    = account.id;                  
          user.twitter.token = token;                  
          user.twitter.name  = account.displayName 
        }

        await user.save();
    }
  }
}

passport.use(new LocalStrategy({
    // Use "email" field instead of "username"
    usernameField: 'email'
}, nodeifyit(async (email, password) => {
    email = (email || '').toLowerCase();
    // get user from db
    let user = await User.promise.findOne({'local.email' : email});
    if (!user){
       return [false, {message: 'Invalid username'}];
    }
    if (email !== user.local.email) {
        return [false, {message: 'Invalid username'}];
    }
    let hash = (await crypto.promise.pbkdf2(password, SALT, 4096, 512, 'sha256')).toString('hex');
    if (hash != user.local.password) {
       return [false, {message: 'Invalid password'}]
    }
    return user;
}, {spread: true})));

passport.use('local-signup', new LocalStrategy({
   // Use "email" field instead of "username"
   usernameField: 'email'
}, nodeifyit(async (email, password) => {
    email = (email || '').toLowerCase()
    // Is the email taken?
    if (await User.promise.findOne({email})) {
        return [false, {message: 'That email is already taken.'}];
    }
console.log('object', email, password)
    // create the user
    let user = new User();
    user.local.email = email;
    let hash = (await crypto.promise.pbkdf2(password, SALT, 4096, 512, 'sha256')).toString('hex');
    user.local.password = hash;
    return await user.save();
}, {spread: true})));


function configure(config) {
    passport.serializeUser(nodeifyit(async (user) => {
    //  console.log('serrrrrrrrrrrrrr', user);
       return user._id
    }));

    passport.deserializeUser(nodeifyit(async (id) => {
     // console.log('dddddeeserrriiiialll', id);
        return await User.promise.findById(id);
    }));

    useExternalPassportStrategy(FacebookStrategy, {
        clientID: config.facebook.consumerKey,
        clientSecret: config.facebook.consumerSecret,
        callbackURL: config.facebook.callbackUrl
    }, 'facebook')

    useExternalPassportStrategy(TwitterStrategy, {
        consumerKey: config.twitter.consumerKey,
        consumerSecret: config.twitter.consumerSecret,
        callbackURL: config.twitter.callbackUrl
    }, 'twitter')



  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'linkedin')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'facebook')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'google')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'twitter')
  // passport.use('local-login', new LocalStrategy({...}, (req, email, password, callback) => {...}))
  // passport.use('local-signup', new LocalStrategy({...}, (req, email, password, callback) => {...}))

  return passport
}

module.exports = {passport, configure}
