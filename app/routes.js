let isLoggedIn = require('./middlewares/isLoggedIn');
let User = require('./models/user');
let flash = require('connect-flash');
let then = require('express-then');
let util = require('util')
let scope = 'email'
let facebookScope = ['user_posts','user_status','email','publish_actions','user_likes','manage_pages']
let Twitter = require('twitter');
let request = require('request')

let networks = {
    twitter: {
          provider: 'twitter',
          icon: 'twitter',
          name: 'Twitter',
          class: 'btn-info'
    },
    facebook: {
          provider: 'facebook',
          icon: 'facebook',
          name: 'Facebook',
          class: 'btn-primary'
    }
}

// remove this when get call work
let fbdata = {
        id: '129317554085640_130515880632474',
        image: "https://pbs.twimg.com/profile_images/466720390664830976/gg9oO5w0_bigger.jpeg",
        text: 'this is my post',
        name: "Duy Le",
        username: "sdiegochargers2",
        liked: true,
        network: networks.facebook
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
                modified: new Date(tweet.created_at),
                network: networks.twitter
            }
        }).slice(0, 10);
        
        let token = req.user.facebook.token;
        let userid = req.user.facebook.id;
        let url = 'https://graph.facebook.com/me/feed?fields=id,updated_time,from,message,picture,likes.summary(true),type&access_token='+token;
        let [resp] = await request.promise.get(url);
        let body = JSON.parse(resp.body);
        let fbPosts = body.data.filter( fbpost =>{
            return fbpost.type === 'status'
        }).map( fbpost =>{
            return {
                id : fbpost.id,
                image: (fbpost.picture) ? fbpost.picture : '',
                text: fbpost.message,
                name: fbpost.from.name,
                username: '',
                liked: fbpost.likes.summary.has_liked,
                modified: new Date(fbpost.updated_time),
                network: networks.facebook
            }
        })
        posts = posts.concat(fbPosts.slice(0,10));  

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


        let token = req.user.facebook.token;
        let userid = req.user.facebook.id;
        let url = 'https://graph.facebook.com/'+userid+'/feed?access_token='+token;
        try{
            await request.promise.post(url, {
                form: {
                    message: text
                } 
            });
            res.end()
        }catch(e){
            console.log('error composing', e)
        }  

        res.redirect('/timeline')
    })) 

    app.post('/like/twitter/:id', isLoggedIn, then(async(req, res) =>{
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

    app.post('/unlike/twitter/:id', isLoggedIn, then(async(req, res) =>{
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

    app.post('/like/facebook/:id', isLoggedIn, then(async(req, res) =>{
        let id = req.params.id;
        let token = req.user.facebook.token;
        let url = 'https://graph.facebook.com/'+id+'/likes?access_token='+token;
        try{
            await request.promise.post(url, {
                form: {} 
            });
            res.end()
        }catch(e){
            console.log('error posting like', e)
        }
    }))  

    app.post('/unlike/facebook/:id', isLoggedIn, then(async(req, res) =>{
        let id = req.params.id;
        let token = req.user.facebook.token;
        let url = 'https://graph.facebook.com/'+id+'/likes?access_token='+token;
        try{
            await request.promise.del(url, {
                form: {} 
            });
            res.end()
        }catch(e){
            console.log('error posting unlike', e)
        }             
    }))       

    app.get('/reply/twitter/:id', isLoggedIn, then(async(req, res) => {
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

    app.post('/reply/twitter/:id', isLoggedIn, then(async(req, res) => {
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

    app.get('/reply/facebook/:id', isLoggedIn, then(async(req, res) => {
        let id = req.params.id;
        let token = req.user.facebook.token;
        let userid = req.user.facebook.id;
        let url = 'https://graph.facebook.com/'+id+'?fields=id,from,message,picture,likes.summary(true)&access_token='+token;
        let [resp] = await request.promise.get(url);

        let fbpost = JSON.parse(resp.body);
        let post = {
            id : fbpost.id,
            image: (fbpost.picture) ? fbpost.picture : '',
            text: fbpost.message,
            name: fbpost.from.name,
            username: '',
            liked: fbpost.likes.summary.has_liked,
            network: networks.facebook
        } 

        res.render('reply.ejs', {
            message: req.flash('error'),
            post: post
        })
    }))

     app.post('/reply/facebook/:id', isLoggedIn, then(async(req, res) => {
        let text = req.body.reply;
        let id = req.params.id;
        if (text.length > 140){
            req.flash('error', 'length cannot be greater than 140 characters')
        }
        if (!text.length){
            req.flash('error', 'Status cannot be empty')
        }
        let token = req.user.facebook.token;
        let userid = req.user.facebook.id;
        let url = 'https://graph.facebook.com/'+id+'/comments?access_token='+token;
        try{
            await request.promise.post(url, {
                form: { 
                    message: text 
                } 
            });
            res.redirect('/timeline')
        }catch(e){
            req.flash('error', 'Cannot post a reply')
        }
    }))   

    app.get('/share/twitter/:id', isLoggedIn, then(async(req, res) => {
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

    app.post('/share/twitter/:id', isLoggedIn, then(async(req, res) => {
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
        try{
            await twitterClient.promise.post('/statuses/retweet/' +id, {
                status : text
            });
        }catch(e){
            console.log('twitter error', e);
        }
        res.redirect('/timeline')
    }))  

    app.get('/share/facebook/:id', isLoggedIn, then(async(req, res) => {
        let id = req.params.id;

        let token = req.user.facebook.token;
        let userid = req.user.facebook.id;
        let url = 'https://graph.facebook.com/'+id+'?fields=id,from,message,picture,likes.summary(true)&access_token='+token;
        let [resp] = await request.promise.get(url);

        let fbpost = JSON.parse(resp.body);
        let post = {
            id : fbpost.id,
            image: (fbpost.picture) ? fbpost.picture : '',
            text: fbpost.message,
            name: fbpost.from.name,
            username: '',
            liked: fbpost.likes.summary.has_liked,
            network: networks.facebook
        } 
        res.render('share.ejs', {
            message: req.flash('error'),
            post: post
        })
    }))   


    app.post('/share/facebook/:id', isLoggedIn, then(async(req, res) => {
        let text = req.body.share;
        let id = req.params.id;
        console.log('xxxxxxxxx',id);
        if (text.length > 140){
            req.flash('error', 'length cannot be greater than 140 characters')
        }
        if (!text.length){
            req.flash('error', 'Status cannot be empty')
        }
        let token = req.user.facebook.token;
        let url = 'https://graph.facebook.com/me/feed?access_token='+token;
        try{
            await request.promise.post(url, {
                form: { 
                    link: 'www.cnn.com',
                    message: text 
                } 
            });
            res.redirect('/timeline')
        }catch(e){
            req.flash('error', 'Cannot share the post')
        }
    }))      
}
