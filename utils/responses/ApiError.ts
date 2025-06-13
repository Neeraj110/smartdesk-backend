class ApiError extends Error {
  statusCode: number;
  data: any;
  success: boolean;

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    data: any = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.success = false;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export { ApiError };
