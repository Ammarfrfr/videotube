import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// cors
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"})) // to parse application/json
app.use(express.urlencoded({extended: true, limit: "16kb"})) // to decode urlencoded bodies
app.use(express.static("public")) // to serve static files from the "public" directory such as images, CSS files, and PDFs. and public is folder name


// cors are used to allow cross origin requests from the client side application to the server side application. here we are allowing requests from the origin specified in the environment variable CORS_ORIGIN and also allowing credentials such as cookies to be sent along with the requests.



// cookie-parser
app.use(cookieParser())     // to parse cookies from the request headers (we need only this much)


//routes import
import userRouter from './routes/user.routes.js'


//routes declaration
app.use("/api/v1/users", userRouter)

// http://localhost:8000/api/v1/users/register

export { app }