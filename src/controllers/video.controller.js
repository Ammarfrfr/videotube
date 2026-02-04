import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import { upload } from "../middlewares/multer.middleware.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // in sortType we have desc because by default we want latest videos first and in sortBy we have createdAt because we want to sort by creation time
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // converting to number because query params are always strings
    const pageNumber = Number(page) 
    const limitNumber = Number(limit) 

    // filter to show only public videos
    const filter = {
      isPublished: true
    }

    // if userId is present in query params, then filter videos by that userId
    // this if else is used to filter videos by userId if userId is provided in query params and is a valid ObjectId then only show videos of that user
    if (userId && isValidObjectId(userId)) {
      filter.owner = userId
      // this line means filter by owner field in video model which is a reference to user model
    }

    // search by title or description
      // query is the search term from req.query
      // filter.$or is used to search in multiple fields which means either title or description
      // regex is used for partial match and i is for case insensitive which is used in YouTube and all that shit
      // options: 'i' means case insensitive and the multiple options in $options is liek "i" and "m" which is used for multiline search and "s" for dotall mode which is used for matching new lines with dot(.) operator etc 
    if(query){
      filter.$or = [
        {title: { $regex: query, $options: 'i'}},
        {description: {$regex: query, $options: 'i'}}
      ]
    }
    // we use object to store sort options dynamically
    let sortOptions = {}
    sortOptions[sortBy] = sortType === "asc"? 1 : -1;

    // countDocuments is used to get total number of documents matching the filter and is used for pagination
    const totalVideos = await Video.countDocuments(filter)

    const videos = await Video.find(filter)
      .sort(sortOptions)
      .skip( (pageNumber - 1) * limitNumber )  // skip is used to skip the documents for pagination. For example, if pageNumber is 2 and limitNumber is 10, then skip will be (2-1)*10 = 10, which means skip first 10 documents
      .limit(limitNumber)   // limit is used to limit the number of documents returned
      .populate("owner", "username avatar") // Populating owner field with username and avatar only from User model
      // populating owner field with username and avatar only

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          videos, pagination: {
            totalVideos,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalVideos / limitNumber),
            limit: limitNumber
          }
        },
        "Videos fetched successfully",
      )
    )
    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description){
      throw new ApiError(400, "Title and description are mandatory")
    }

    /*
      1. get video the same way you got photos from and then unlink that shits 
    */
    
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if(!videoLocalPath){
      throw new ApiError(400, "Video File is missing")
    }

    if(!thumbnailLocalPath){
      throw new ApiError(400, "Thumbnail File is missing")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    if(!video){
      throw new ApiError(400, "The Video failed to get uploaded")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail){
      throw new ApiError(400, "The thumbnail wasnt able to get uploaded")
    }

    const publishedVideo = await Video.create({
      title,
      description,
      videoFile: video.url,
      thumbnail: thumbnail.url,
      thumbnailPublicId: thumbnail.public_id,
      videoPublicId: video.public_id, // storing public_id to be able to delete the video from cloudinary later
      duration: video.duration,
      owner: req.user._id
    })

    return res
    .status(201)
    .json(
      new ApiResponse(201, publishedVideo, "Video was published successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // req param is used generally to get resource 
    //TODO: get video by id

    /* This was wrong
    const video = await Video.findById({
      _id
    })
    */

    const video = await Video.findById(videoId)

    if(!video){
      throw new ApiError(400, "Video not found")
    }

    return res
    .status(200)
    .json(
      new ApiResponse(200, videoId, "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!videoId){
      throw new ApiError(400, "Video ID is required")
    }

    let thumbnailUrl;
    // thumbnailUrl is defined to be used later if thumbnail is updated

    const {title, description} = req.body

    // we had upload.single("thumbnail") middleware in route so we can access using req.file and not req.files?.thumbnail?.[0]?.path which is used when multiple files are uploaded
    const thumbnailLocalPath = req.file?.path;
    if(thumbnailLocalPath){
      const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
      if(!uploadThumbnail){
        throw new ApiError(500, "Thumbnail upload failed")
      }
      thumbnailUrl = uploadThumbnail.url
    }
    
    if(!(title || description || thumbnailLocalPath)){
      throw new ApiError(400, "Change title or description or thumbnail to update video")
    }

    const updateDetails = await Video.findByIdAndUpdate(
      videoId,
      {
        $set:{
          ...title && { title },
          ...description && { description },
          // this means ...thumbnailUrl && {thumbnail: thumbnailUrl} that if thumbnailUrl is defined then only add this key value pair to the object otherwise dont add anything
          // this is done to avoid setting thumbnail to undefined if thumbnail is not updated
          ...thumbnailUrl && {thumbnail: thumbnailUrl}
        } 
      },
      {
          new: true
      }
    )

    if(!updateDetails){
      throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(
      new ApiResponse(200, updateDetails, "Changes in the video saved successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
      throw new ApiError(400, "Video id is not valid")
    }
    
    const video = await Video.findById(videoId)
    if(!video){
      throw new ApiError(400, "Video wasn't found")
    }
    

    // to delete from cloudinary
    if (video.videoPublicId) { // assuming you stored public_id when uploading
      await deleteFromCloudinary(video.videoPublicId, "video")
    }

    if(video.thumbnailPublicId){
      await deleteFromCloudinary(video.thumbnailPublicId, "image")
    }

    // deletes video from file
    const deletevideo = await Video.findByIdAndDelete(videoId)


    return res
    .status(200)
    .json(
      new ApiResponse(200, deletevideo, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // what is toggle publish status for in a video? 1. Published, but published what? Ans: Published means visible to everyone, Unpublished means only visible to owner
    // So how can i do this ? Ans: by a boolean field isPublished in video model which is true when published and false when unpublished
    // so first get the video by id, then toggle the isPublished field and save the video

    if(!videoId){
      throw new ApiError(400, "Video ID is required")
    }

    const video = await Video.findById(videoId)
    if(!video){
      throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished
    // what this does is if isPublished is true, it becomes false and if false, it becomes true
    await video.save()
    // why we will use select here 

    return res
    .status(200)
    .json(
      new ApiResponse(200, video, `Video is now ${video.isPublished ? "Published" : "Unpublished"}`)
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}