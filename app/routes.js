let isLoggedIn = require('./middlewares/isLoggedIn');
let User = require('./models/user');
let flash = require('connect-flash');
let then = require('express-then');
let scope = 'email'
let facebookScope = ['email','publish_actions','user_likes']
let Twitter = require('twitter');
let request = require('request')

let networks = {
    twitter: {
        network: {
          icon: 'twitter',
          name: 'Twitter',
          class: 'btn-info'
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
    
    app.get('/auth/facebook', passport.authenticate('facebook', {scope:facebookScope}))

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))


    // Authorization route & Callback URL
    app.get('/connect/facebook', passport.authorize('facebook', {scope: facebookScope}))
    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))   

  
    app.get('/auth/twitter', passport.authenticate('twitter', {scope: scope}))

    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    app.get('/connect/twitter', passport.authorize('twitter', {scope: scope}))
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
        let token = req.user.facebook.token;
        let userid = req.user.facebook.id;
       // let url = USER_NAME_OR_ID?access_token=ACCESS_TOKEN
       let url = 'https://graph.facebook.com/me/feed?access_token='+token;
        console.log('url',url)
        // request({
        //     url: url,
        //     method: 'GET',
        // }, function(error, response, body){
        //     if(error) {
        //         console.log('errrr',error);
        //     } else {
        //         console.log('faccceeeeboook',body);
        //     }
        // });


        request.get(
            url,
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
                }
            }
        );

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
    try{
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


        let token = req.user.facebook.token;
        let userid = req.user.facebook.id;
        console.log('posting to facebook');
       let url = 'https://graph.facebook.com/'+userid+'/feed?access_token='+token;
        request.post(
            url,
            { form: { message: text } },
            function (error, response, body) {
            if (error){
                console.log('error',error)
            }
                if (!error && response.statusCode == 200) {
                    console.log('body', body)
                }
            }
        );

        res.redirect('/timeline')
    }catch(e){
        console.log(e)
    }
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
        let text = req.body.share;
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
        await twitterClient.promise.post('/statuses/retweet', {
        //    status : text,
            id: id
        });
        res.redirect('/timeline')
    }))      
}
