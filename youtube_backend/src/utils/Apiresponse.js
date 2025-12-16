// ApiResponse is a small helper class used to create consistent success responses for your API.

class Apiresponse{
    constructor(statusCode, data, message = "Success"){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success = statusCode < 400
    }
}

export {Apiresponse}