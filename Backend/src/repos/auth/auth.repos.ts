import { OAuth2Client } from "google-auth-library";
import authModel, { IAuth } from "../../models/auth.model";
import bcrypt from "bcrypt"
import roleSchema from '../../models/auth/roles';
import { ROLES } from "../../constant/role";
import crypto from "crypto";
import { userRepo } from "..";
import { generateTokens } from "../../utils/jwt";

const googleClientId = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(googleClientId);

export const CreateNewUser = async (userName: string, email: string, password: string): Promise<ServiceResponse<IAuth>> => {
    userName = userName?.trim();
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!userName || !email || !password) {
        return {
            success: false,
            message: "All fields are required"
        }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "Invalid email format"
        }
    }
    if (password.length < 6) {
        return {
            success: false,
            message: "Password must be at least 6 characters"
        }
    }
    const user = await authModel.findOne({
        $or: [
            { email },
            { userName }
        ]
    });
    if (user) {
        return {
            success: false,
            message: "This email or username is already registered"
        }
    }
    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = await authModel.create({
        userName,
        email,
        password: hashedPassword,
    })
    return {
        success: true,
        data: newUser
    }

}
export const loginService = async (userName: string, password: string): Promise<ServiceResponse<IAuth>> => {

    userName = userName?.trim().toLowerCase();
    password = password?.trim();

    if (!userName || !password) {
        return {
            success: false,
            message: 'Username and password are required'
        };
    }

    const user = await authModel.findOne({
        userName: userName
    });

    if (!user) {
        return {
            success: false,
            message: 'Incorrect username or password'
        };
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
        return {
            success: false,
            message: 'Incorrect username or password'
        };
    }

    return {
        success: true,
        data: user
    };
}
export const loginWithGoogleService = async (idToken: string): Promise<ServiceResponse<any>> => {

    if (!googleClientId) {
        return {
            success: false,
            message: "Google OAuth not configured"
        };
    }

    let ticket;
    try {
        ticket = await client.verifyIdToken({
            idToken,
            audience: googleClientId,
        });
    } catch (err) {
        return {
            success: false,
            message: "Invalid Google token"
        };
    }

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
        return {
            success: false,
            message: "Invalid Google token payload"
        };
    }

    const email = payload.email.toLowerCase();
    const userName = payload.name || email.split("@")[0];

    let user = await authModel.findOne({ email });

    if (!user) {
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const hashedPassword = await bcrypt.hash(randomPassword, 12);

        user = await authModel.create({
            userName,
            email,
            password: hashedPassword,
            types: "login-google"
        });

        const userRole = await roleSchema.findOne({ name: ROLES.USERROLE });

        if (!userRole) {
            return {
                success: false,
                message: "Initial user role not found"
            };
        }

        await userRepo.AddNewRolesToNewUser(user._id.toString(), userRole._id.toString());
    }

    const roleIds = await userRepo.GetRoleIDsByUserID(user._id.toString());

    if (!roleIds.length) {
        return {
            success: false,
            message: "User role not found"
        };
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), roleIds);

    user.refreshToken = refreshToken;
    await user.save();

    return {
        success: true,
        data: {
            user,
            accessToken,
            refreshToken
        }
    };
};