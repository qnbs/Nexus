// Base class for custom API errors
export class ApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

// Specific error types
export class RateLimitError extends ApiError {}
export class OfflineError extends ApiError {}
export class JsonParseError extends ApiError {}
export class SafetyError extends ApiError {}
export class ApiKeyNotFoundError extends ApiError {}
