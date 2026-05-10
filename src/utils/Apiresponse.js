class Apiresponse {
    constructor(statuscode , data ,message = "success") {
        this.data = data 
        this.message = message
        this.statuscode = statuscode
        this.success = statuscode <400
    }
}