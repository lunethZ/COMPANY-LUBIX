export interface RegisterRequest {
  fullName: string;
  email: string;
  tell: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    verified: boolean;
    token?: string;
  };
}

export interface ResendVerificationRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  id?: string;
  Nombre?: string;
  email?: string;
  role?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}