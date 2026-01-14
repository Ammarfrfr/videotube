const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

// asyncHandler is a higher order function that takes a request handler function as an argument and returns a new function that wraps the original function in a Promise. This allows us to use async/await syntax in our request handlers and automatically catch any errors that occur and pass them to the next middleware (usually an error handling middleware) in the Express.js application. This can be used in route definitions to simplify error handling for asynchronous operations and can be used in any route handler where we need to perform asynchronous operations.

export { asyncHandler }




// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }