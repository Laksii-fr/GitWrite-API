import { GetUserProfile } from '../utils/mongo_utils.js';

export async function getUserProfile(githubId) {
    try {
        const user = await GetUserProfile(githubId);
        return user;
    } catch (error) {
        throw error;
    }
}
