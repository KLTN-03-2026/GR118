export interface UsersResponse {
    user_id: string;
    username: string;
    email: string;
    avatar?: string | null;
    phone?: string | null;
    city?: string | null;
    roles: string[];
    lockEnd ?: Date | null;
    lockReason ?: string | null;
    created_at: Date;
    updated_at: Date;
}