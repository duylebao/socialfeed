## Social Feed

```
The project integrates social media content to one centralize area.  The project 
Twitter and Facebook.  The project allow linking these social media provider
to your local account.  It renders an aggregate timeline for all linked social
media accounts.  It allows you to create a new post and all social media accounts
will post it.  It allow likes and dislikes, reply or comment.  In the case of Twitter,
it allow retweet on the person you follow's tweet.  In the case of Facebook, it allow
you to share a link.

```

Time spent: `15 hours`


### Features

#### Required

- [x] User can sign in and connect to Twitter using passport
- [x] User can view the last 20 posts on their aggregated timeline
- [x] In the home timeline, data presentation should appear consistent 
      for posts across social network sources.
- [x] In the timeline, user can like and unlike posts.
- [x] User can click share in the timeline, and share with a custom 
      message on a separate page.
- [x] User can click reply in the timeline, and submit a reply on a separate page.
- [x] User can click compose anywhere, and submit a new post on a separate page to 
      all connected accounts.

#### Optional

- [x] Implement "sign in", "timeline", "compose", "share", "like" and "reply" for Facebook


#### Starting the application

```
npm install
npm start
```

#### Database

```
The application require mongo db to install.  The application will store data in the social-feed database.
As user create a local account or linked to a social media account, it will create the user.

```

####Usage

```

    1. Change your /etc/host file to have socialauthenticator.com

    2. Go to http://socialauthenticator.com:8000, this should take you to a landing page

    3. Local Login: enter user name to sign in to the local account

    4. Local sign up:
        1. email
        3. password


    5. Link to Twitter
        Click on the Twitter icon which should take you to the Twitter login page.  Sign in with
        your credential which should route you back to the profile page.

    6. Link to Facebook
        Click on the Facebook icon which should take you to the Facebook login page.  Sign in with
        your credential which should route you back to the profile page.
    
    7. Timeline
        Click on Timeline should list all of the people you follow and yourself


    8. Compose
        Click on Compose will bring up a new window where you can compose a new post.  The new post will
        get post both on Twitter and Facebook.  You should see this reflected on your timeline.

    9. Like/Unlike
        On the timeline, for each individual post, you can click on the thumbs up icon for like and unlike.
        This will mark the like/unlike for the social media post.

    10. Reply
        On the timeline, you can click on the reply icon of a post and it will take you to the reply window.
        Enter in the reply and it should reply or comment on the post of the social media.  

    11. Retweet/Share
        For a Twitter post, you can click on the retween which should take you to another screen for the
        retweet.  Note that the icon will only show up on the person you follow.  For Facebook, it is the 
        same icon, but it will share a url.    

```


### Walkthrough
![](walkthrough.gif)
