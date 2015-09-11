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
    let user = req.user;
    if (!user){
      user = new User();
    }
    return await user.linkAccount(account.provider, {account: account, token: token})
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
    // create the user
    let user = new User();
    user.local.email = email;
    let hash = (await crypto.promise.pbkdf2(password, SALT, 4096, 512, 'sha256')).toString('hex');
    user.local.password = hash;
    return await user.save();
}, {spread: true})));


function configure(config) {
    passport.serializeUser(nodeifyit(async (user) => {
       return user._id
    }));

    passport.deserializeUser(nodeifyit(async (id) => {
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

  return passport
}

module.exports = {passport, configure}
