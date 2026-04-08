import jwt from "jsonwebtoken";
const secret = process.env.SECRET_KEY;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (!secret) {
    throw new Error("Thiếu biến môi trường SECRET_KEY!");
}
if (!refreshSecret) {
    throw new Error("Thiếu biến môi trường JWT_REFRESH_SECRET!");
}
export const generateTokens = (userId: string, roleIds: string[]) => {
    const accessToken = jwt.sign({ _id: userId, roleIds }, secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ _id: userId }, refreshSecret, { expiresIn: '7d' });

    return { accessToken, refreshToken };
};