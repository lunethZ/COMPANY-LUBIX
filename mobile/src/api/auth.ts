import api from "./axios";

export const registerUser = async (data: {
  fullName: string;
  email: string;
  tell: string;
  password: string;
}) => {
  return await api.post("/auth/register-user", data);
};

export const registerCompany = async (form: {
  fullName: string;
  email: string;
  tell: string;
  password: string;
  companyName: string;
  companyAddress: string;
  companyNIT: string;
  companyNITDV: string;
}) => {
  const formData = new FormData();
  formData.append("fullName", form.fullName);
  formData.append("email", form.email);
  formData.append("tell", form.tell);
  formData.append("password", form.password);
  formData.append("companyName", form.companyName);
  formData.append("companyAddress", form.companyAddress);
  formData.append("companyNIT", form.companyNIT);
  formData.append("companyNITDV", form.companyNITDV);
  const blob = new Blob(["placeholder"], { type: "text/plain" });
  formData.append("certificate", blob, "placeholder.txt");

  return await api.post("/auth/register-company", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const loginUser = async (data: { email: string; password: string }) =>
  await api.post("/auth/login-user", data);

export const loginCompany = async (data: { email: string; password: string }) =>
  await api.post("/auth/login-company", data);

export const forgotPassword = async (data: { email: string }) =>
  await api.post("/auth/forgot-password-user", data);

export const resetPassword = async (data: {
  email: string;
  code: string;
  new_password: string;
}) => await api.post("/auth/reset-password-user", data);

export const verifyEmail = async (data: { email: string; code: string }) =>
  await api.post("/auth/verify-email-user", data);

export const refreshTokens = async (oldRefreshToken: string) =>
  await api.post<{ access_token: string; refresh_token: string }>("/auth/refresh", {
    old_refresh_token: oldRefreshToken,
  });