import { apiFetch } from "./client";

export interface LoginPayload {
    username: string;
    password: string;
}

export interface RegisterPayload {
    username: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    message?: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
