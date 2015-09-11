let mongoose = require('mongoose')
let _ = require('lodash')

let userSchema = mongoose.Schema({
  local:{
    email: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: false
    }
  },
    facebook         : {
        id           : String,
        token        : String,
        username     : String,
        name         : String
    },
    twitter         : {
        id           : String,
        token        : String,
        username        : String,
        name         : String
    }
})

userSchema.methods.linkAccount = async function(type, values) {
  return this['link'+_.capitalize(type)+'Account'](values)
}

userSchema.methods.linkLocalAccount = async function({email, password}) {
   let user = await this.model('User').findOne({ 'local.email' : email})
   if (user){
      this.local.password = password;
      return await user.save();
   }else{
      this.local.email = email;
      this.local.password = password;
      return await this.save();
   }
}

userSchema.methods.linkFacebookAccount = async function({account, token}) {
    let user = await this.model('User').findOne({ 'facebook.id' : account.id})
    if (user){
        user.facebook.token = token;
        user.facebook.name = account.displayName
        return await user.save();
    }else{
      this.facebook.id    = account.id;                  
      this.facebook.token = token;                  
      this.facebook.name  = account.displayName
      return await this.save();
    }    
}

userSchema.methods.linkTwitterAccount = async function({account, token}) {
    let user = await this.model('User').findOne({ 'twitter.id' : account.id})
    if (user){
        user.twitter.token = token;
        user.twitter.name = account.displayName
        return await user.save();
    }else{
      this.twitter.id    = account.id;                  
      this.twitter.token = token;                  
      this.twitter.name  = account.displayName
      return await this.save();
    }
}

userSchema.methods.linkGoogleAccount = async function({account, token}) {
  throw new Error('Not Implemented.')
}


userSchema.methods.unlinkAccount = function(type) {
  throw new Error('Not Implemented.')
}

module.exports = mongoose.model('User', userSchema)
