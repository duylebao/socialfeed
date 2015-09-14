// config/auth.js
module.exports = {
  'development': {
    'facebook' : {
        'consumerKey': '1662463600656668',
        'consumerSecret': 'd48dda4286ea5592a933e6fa0d11d286',
        'callbackUrl': 'http://socialauthenticator.com:8000/auth/facebook/callback'
    },
    'twitter': {
      'consumerKey': 'DJWa7MU3mXVF9aQHUp3P3PP4c',
      'consumerSecret': 'e9a6ceEp6M5ovL8AQjtVUUSjvYIpYctl9BYGjdxMFqNPSTx4P3',
      'callbackUrl': 'http://socialauthenticator.com:8000/auth/twitter/callback'
    }
  }
}
