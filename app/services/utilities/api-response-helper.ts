import { ApiResponse, ApiError, ApiResponseMessage, ApiValidationError } from 'hipolito-models';

export class ApiResponseHelper {
    public static getErrorResponse(error: Error, statusCode: number = 500): ApiResponse<any> {
        const errorResponse = new ApiResponse<any>();
        errorResponse.statusCode = statusCode;
        errorResponse.message = ApiResponseMessage.exception;
        errorResponse.responseException = new ApiError(true, error.message, error.stack);

        // TODO@zev.butler: add logging using their framework?
        console.log('=========================================================================');
        console.log('Error:');
        console.log('=========================================================================');
        console.log(error.message);
        console.log(error.stack);
        return errorResponse;
    }

    public static getValidationErrorResponse(error: any): ApiResponse<any> {
        const validationErrorResponse = new ApiResponse<any>();
        validationErrorResponse.statusCode = 400;
        validationErrorResponse.message = ApiResponseMessage.validationError;
        validationErrorResponse.responseException = new ApiError(true, 'A Validation Error has occurred.');

        for (let field in error.errors) {
            const validationError = error.errors[field];
            validationErrorResponse.responseException
                .validationErrors
                .push(new ApiValidationError({
                    field: validationError.path,
                    errorType: validationError.kind,
                    message: validationError.message,
                }));
        }
        return validationErrorResponse;
    }
}