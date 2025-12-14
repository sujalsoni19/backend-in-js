// This class standardizes errors for easier debugging AND cleaner API responses.

class Apierror extends Error{
    constructor(
        statusCode,
        message="something went wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statusCode= statusCode
        this.data = null
        this.message=message
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export { Apierror }