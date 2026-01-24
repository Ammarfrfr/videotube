import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const generateRefreshAndAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found while generating tokens")
        }
        // these are methods so () is needed
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        // storing the token in db
        user.refreshToken = refreshToken
        // saving in db
        await user.save({ validateBeforeSave: false })

        // we need this so we return
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    // receive user details from req.body
    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    // verify that all fields are present
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // .findOne helps in finding using this syntax 
    // $or: this is used to check if either is true or some shit
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    // this is by multer to tweak and collect files and some shit
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        // .select("-password") this will like empty whatever to select here while initialising with -
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler( async (req, res) => {
    // take your input from req body
    // trim the spaces if the user has typed it by mistake 
    // find the user if it exists or not
    // check username and password is correct
    // validate and generate access token
    // then generate refresh token so that your shit is saved
    // send these tokens using cookies

    const {email, username, password} = req.body
    console.log(email); 

    // require username OR email, and password
    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required to LogIn")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "Invalid Credentials")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400, "Password is Invalid")
    }

    const {accessToken, refreshToken} = await generateRefreshAndAccessToken(user._id)

    const loggedIn = await User.findById(user._id).select("-password -refreshToken")

    // this locks the cookie so it can only be changed on the server
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedIn, accessToken, refreshToken },
                "User logged in successfully"
            )
        )

})

const logOutUser = asyncHandler(async (req, res) => {
    // delete cookies
    // delete refreshToken

    /*
        had to do multiple shit to get the user Refrence, so we prepare middleware 
    */

    // 
    User.findByIdAndUpdate(
        await req.user._id,
        {   // sets refreshToken undefined so the user can logout 
            $set: {refreshToken: undefined}
        },
        {   // new values storing will be true
            new: true
        }
    )

    // no options
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    // get incoming refresh token
    // verify if it has by showing error

    // add below shit in tryAndCatch
    // verify the refreshToken with jwt and match it with the incoming refreshToken
    // after getting refreshToken and verifying it, get the user details using _id
    // couldnt find user, throw error
    // if refreshToken dosent match with the user, throw error
    // generate new accessToken and refreshToken with options
    // call generateAccessToken to get new tokens
    // return res with cookies and json response    

    // accessing incoming refreshToken from cookies and body by user to check with the generateAccessAndRefreshToken
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    // throw error
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Access")
    }

    // do this shit in try catch to not get the error without knowing
    try { 
        // verify token using its secret and jwt
        const deodedToken = jwt.verify(
            incomingRefreshToken,               // incoming token
            process.env.REFRESH_TOKEN_SECRET,   // secret token to verify
        )

        // find user from decoded token
        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if(incomingRefreshToken != user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired")
        }   

        // options is for
        const options = {
            httpOnly: true,
            secure: true
        }

        // call this shit from generateRefreshAndAccessToken
        const {accessToken, newRefreshToken} = await generateRefreshAndAccessToken(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, {newRefreshToken, accessToken}, "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Access Token Error")
    }
})

const changeCurrentPassword = 
asyncHandler( async (req, res) => {
    const {oldPassword, newPassword, confirmPassword } = req.body
    
    
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPassword(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "The old password is incorrect")
    }
    
    if(newPassword === confirmPassword){
        throw new ApiError(401, "The new password and the confirm Password is not same")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})


    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password is Changed Successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(401, "Change atleast Full Name or Email to Apply changes")
    }
    
    const user = User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set:{
                // two ways to write this shit
                fullName,
                email: email
            }
        }, 
        {new: true})
        .select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(401, "Wasnt able to able to find the local path of Avatar")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!(avatar.url)){
        throw new ApiError(401, "Error while uploading Avatar File")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    )
    .select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, "Avatar is updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = await req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(401, "Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new ApiError(401, "Cover Image wasn't updated")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, "Cover Image was updated Successfully"))
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}