# Flow of the Backend 

### Usage of Github
- While you are in the github use git add . to add all the files 
- then git commit -m "then name you wanna write as"
- then git push to push files

- touch is used to create file, for example touch index.js
- to create files use mkdi. For example mkdir controllers



## All shits should be in src folder and packages outside
- add controllers
- add middlewares
- add models
- add routes
- utils
  in utils add app.js constants.js index.js



### Why install Prettier
- It gives us standard practice to follow to have one management and coding
- To install 

    npm i -D prettier
    create file name .prettierrc
    and write this for example: {
      "singleQuote": "false",
      "brackerSpacing": true,
      "tabwidth": 2,
      "trailingcomma": "es5",
      "semi": true
    }

    and then add .prettier ignore
    /.vscode
    /dist

    *.env
    .env
    .env./



### In index.js
- import express and then const app = express();
- import dotenv from "dotenv" and then use dotenv.config()



### Database file to connect MongoDB
- create const and then async in function and trycatch for error and exit from process.exit(1) and main use await for mongodb-link
 ### After that connect to DB to main file and then add express
 - import the const function
 - whateverTheName is ();
 - .then(
  app.listen(where the server listening shit)
  app.on(where the server gone wrong and shi)
 )
 - .catch((err), (error) => {console.error("Error", error)})



### Install Dependencies
- [Express](npm i express)
- [Mongoose](npm i mongoose)
- [dotenv](npm i dotenv)



### After installing dependencies download cors and cookie-parser from npm
- And then edit in .env with CORS_ORIGIN=whateverTheFuckingLinkIs
- [CORS](
  - Import cors from "cors" 
  - and then use cors app.use(cors([{
    origins: procee.env.CORS,
    credentials: true
  }]))
  - [Pars]( app.use(express.json.({limit: "16kb"})) )
  - [Decode]( app.use(express.urlencoded({limit: "16kb" extended: true})) )
  - [fileAccess]( app.use(express.static("public")) )
  )
- [cookieParser]( app.use(cookieParser()) )
- Export all that shit using export { whatever the file name is }



### Add these in utils
- AsynHandlers where the asynchronous template can be used multiple times
### Custom APIs
  - apiErrors where errors will be used to specify
  - apiResponse to give standard response from API

### Create models for database
  - Users Models
    import mongoose, {Schema} from "mongoose";
  - Videos Models
    same as above but add video.plugin(mongooseAggregatePaginate) for perfomance and UI

### Install bycrypt and jsonwebtoken for password encryption
  - You have to encrypt password in user models file 
  - So here is the way to do it
    ``` Javascript
    import bcrypt from "brcypy";
    import 
    // To presave something before the submit is processed we use this
    userSchema.pre("save", async function (next){
      if(!this.isModified("password")) return next();

      // but the thing is this will change the password everytime so we will use if statement
      this.password = brcypt.hash(this.password, 10)
    })

    // Now we will have to inject methods to check the password and verify it
    userSchema.methods.isPasswordCorrect = asynch function (password) {
      // it will take time so we will use await
      return await brcypt.compare(password, this.password)
    }

    import jwt from "jwt";

    /*
    // Add this in .env
    ACCESS_TOKEN_SECRET=a0ogehqoeihoinjkdflsuhgafioewojgoseibfud9440982uajsi
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=alfjigernaoenrgorjaknjfklairigusofikjfskfifbofbi29h
    REFRESH_TOKEN_EXPIRY=10d
    */

    // now continue in userSchema
    userSchema.methods.generateAccessToken = fucntion(){
      return jwt.sign(
        {
          _id: this.id,
          email: this.email,
          username: this.username,
          fullName: this.fullName
        }
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIN: process.env.ACCESS_TOKEN_EXPIRY
        }
      )
    }    

    // now the upper one will be same but less 
    userSchema.methods.generateRefreshToken = fucntion(){
      return jwt.sign(
        {
          _id: this.id,
        }
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIN: process.env.REFRESH_TOKEN_EXPIRY
        }
      )
    }

    ```

### Routing
  - first create Route in routes folder
    - tweak controller's files
      ``` Javascript

      // Many of the times this will be same
      import {asyncHandler} from "../utils/asyncHandler.js";
      const registerUser = asyncHandler(async (req, res) => {
        res.status(200).json({
          message: "ok" 
        })
      })

      export { registerUser };

      ```
    - import router from express
    - 
    ``` Javascript

    import {Router} from "express";    
    const router = Router();
    router.route("/whateverTheRouteIs").post(whateverTheControllerIs)
    export default router;

    ```
  - 


### Using Postman
  - http://localhost:8000/api/v1/users/register
  #### setup
    - go in Body
    - form-data
    - fill key and value

