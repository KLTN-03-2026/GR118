type ServiceResponse<T> = {
    success: boolean;
    data?: T;
    message?: string;
}