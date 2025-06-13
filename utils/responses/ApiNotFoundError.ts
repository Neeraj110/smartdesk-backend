import { ApiError } from "./ApiError";

class ApiNotFoundError extends ApiError {
  constructor(message: string = "Resource Not Found") {
    super(404, message);
  }
}

export { ApiNotFoundError };
