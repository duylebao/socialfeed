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
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: twitterConfig.accessToken,
            access_token_secret: twitterConfig.accessSecret
        })
        let [tweets] = await twitterClient.promise.get('/statuses/home_timeline');
        let posts = tweets.map(tweet =>{
            return {
                id : tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@'+tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
            }
        })
        res.render('timeline.ejs', {
            posts: posts,
            message: req.flash('error') 
        })
    }))

    app.get('/compose', isLoggedIn, (req, res) => {
        res.render('compose.ejs', {
            message: req.flash('error')
        })
    })

    app.post('/compose', isLoggedIn, then(async(req, res) => {
        let text = req.body.reply;
        if (text.length > 140){
            req.flash('error', 'length cannot be greater than 140 characters')
        }
        if (!text.length){
            req.flash('error', 'Status cannot be empty')
        }
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: twitterConfig.accessToken,
            access_token_secret: twitterConfig.accessSecret
        })
        await twitterClient.promise.post('/statuses/update', {status : text});
        res.redirect('/timeline')
    })) 

    app.post('/like/:id', isLoggedIn, then(async(req, res) =>{
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: twitterConfig.accessToken,
            access_token_secret: twitterConfig.accessSecret
        })
        let id = req.params.id;
        await twitterClient.promise.post('favorites/create', {id})
        res.end()
    }))

    app.post('/unlike/:id', isLoggedIn, then(async(req, res) =>{
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: twitterConfig.accessToken,
            access_token_secret: twitterConfig.accessSecret
        })
        let id = req.params.id;
        await twitterClient.promise.post('favorites/destroy', {id})
        res.end()
    }))

    app.get('/reply/:id', isLoggedIn, then(async(req, res) => {
        let id = req.params.id;
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: twitterConfig.accessToken,
            access_token_secret: twitterConfig.accessSecret
        })        
        let [tweet] = await twitterClient.promise.get('/statuses/show/'+id);
        let post = {
                id : tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@'+tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
        }
        res.render('reply.ejs', {
            message: req.flash('error'),
            post: post
        })
    }))

    app.post('/reply/:id', isLoggedIn, then(async(req, res) => {
        let text = req.body.reply;
        let id = req.params.id;
        if (text.length > 140){
            req.flash('error', 'length cannot be greater than 140 characters')
        }
        if (!text.length){
            req.flash('error', 'Status cannot be empty')
        }
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: twitterConfig.accessToken,
            access_token_secret: twitterConfig.accessSecret
        })
        console.log('id', id, text)
        await twitterClient.promise.post('/statuses/update', {
            status : text,
            in_reply_to_status_id: id
        });
        res.redirect('/timeline')
    }))     

    app.get('/share/:id', isLoggedIn, then(async(req, res) => {
        let id = req.params.id;
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: twitterConfig.accessToken,
            access_token_secret: twitterConfig.accessSecret
        })        
        let [tweet] = await twitterClient.promise.get('/statuses/show/'+id);
        let post = {
                id : tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@'+tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
        }
        res.render('share.ejs', {
            message: req.flash('error'),
            post: post
        })
    }))

    app.post('/share/:id', isLoggedIn, then(async(req, res) => {
        try{
        let text = req.body.share;
        console.log('texttttttt',text)
        let id = req.params.id;
        if (text.length > 140){
            req.flash('error', 'length cannot be greater than 140 characters')
        }
        if (!text.length){
            req.flash('error', 'Status cannot be empty')
        }
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: twitterConfig.accessToken,
            access_token_secret: twitterConfig.accessSecret
        })
        console.log('id', id, text)
        await twitterClient.promise.post('/statuses/retweet', {
        //    status : text,
            id: id
        });
        res.redirect('/timeline')
    }catch(e){
        console.log('errrrr',e,e.message)
    }
    }))      
}
