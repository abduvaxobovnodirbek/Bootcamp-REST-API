class ErrorResponse{
    constructor(message,statusCode){
        this.message = message
        this.statusCode = statusCode
    }
}

module.exports = ErrorResponse