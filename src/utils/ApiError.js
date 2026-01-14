class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}


// this thing is used to throw errors in the api and it extends the default error class of javascript where we can add more properties to it like statusCode, errors array, stack trace etc. 
// in constructor we are giving default values to the parameters so that if we don't pass any value while throwing the error it will take the default values.
// after that we are calling the super class constructor with the message parameter to set the message property of the error object. and then we are setting the other properties of the error objects like statusCode, data, success, errors and stack trace then we are exporting the class to use it in other files.

export {ApiError}