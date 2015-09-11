let isLoggedIn = require('./middlewares/isLoggedIn');
let User = require('./models/user');
let flash = require('connect-flash');
let then = require('express-then');
let scope = 'email'
let Twitter = require('twitter');

let networks = {
    twitter: {
        network: {
            icon: 'facebook',
            name: 'Facebook',
            class: 'btn-primary'
        }
    }
}
module.exports = (app) => {
    let passport = app.passport
  let twitterConfig = app.config.auth.twitter;
    app.get('/', (req, res) => res.render('index.ejs'))

    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile.ejs', {
            user: req.user,
            message: req.flash('error')
        })
    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.get('/login', (req, res) => {
        res.render('login.ejs', {message: req.flash('error')})
    })

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', {message: req.flash('error') })
    })

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }));   
    
    app.get('/auth/facebook', passport.authenticate('facebook', {scope}))

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))


    // Authorization route & Callback URL
    app.get('/connect/facebook', passport.authorize('facebook', {scope}))
    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))   

  
    app.get('/auth/twitter', passport.authenticate('twitter', {scope}))

    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    app.get('/connect/twitter', passport.authorize('twitter', {scope}))
    app.get('/connect/twitter/callback', passport.authorize('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    })) 

    app.get('/timeline', isLoggedIn, then(async(req, res) => {
       try{ 
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: twitterConfig.accessToken,
            access_token_secret: twitterConfig.accessSecret
        })
        let [tweets] = await twitterClient.promise.get('/statuses/home_timeline');
        let posts = tweets.map(tweet =>{
            return {
                id : tweet.id,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@'+tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
            }
        })
        console.log('tweettttttttt',t)
        res.render('timeline.ejs', {
            posts: posts,
            message: req.flash('error') 
        })
    }catch(e){
        console.log(e, e.message)
    }
    }))
}
