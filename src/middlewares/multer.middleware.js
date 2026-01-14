import multer from "multer";

const storage = multer.diskStorage({
    // destination function tells where to store the uploaded files
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    // filename function tells what name to use for the uploaded files
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
// export the multer middleware and storage is passed as a configuration
export const upload = multer({ 
    storage, 
})