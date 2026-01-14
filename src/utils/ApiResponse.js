class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

// this class is used to send a standard response format for the api. it takes statusCode, message and data as parameters and sets the success property based on the statusCode. if statusCode is less than 400 then success is true else false. then we are exporting the class to use it in other files. this will help in maintaining a consistent response format for the api and also make it easier to handle responses on the client side.

export { ApiResponse }