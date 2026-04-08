import { UsersResponse } from "../../dtos/auth/user";

export class UserMapper {
        static toUsersResponse(user: any): UsersResponse {
            return {
                user_id: user._id,
                username: user.userName,
                email: user.email,
                roles: user.roles || [],
                lockEnd: user.lockEnd,
                lockReason: user.lockReason,
                created_at: user.createdAt,
                updated_at: user.updatedAt
            };
        }

        static toUserResponse(user: any, role: string[]): UsersResponse {
            return {
                user_id: user._id,
                username: user.userName,
                email: user.email,
                roles: role || [],
                lockEnd: user.lockEnd,
                lockReason: user.lockReason,
                created_at: user.createdAt,
                updated_at: user.updatedAt
            };
        }
}