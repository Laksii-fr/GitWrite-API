import { SaveUser } from '../utils/mongo_utils.js';
import { checkUserCredentials, get_subid_by_username, checkUserReoveryToken, updateUserPassword } from '../utils/mongo_utils.js';
import { generate_subId } from '../helpers/auth_helper.js';
import { generateToken } from '../utils/jwt_utils.js'; // Assuming you have a token helper for generating tokens\


export async function signup(user) {
  try {
    // Generate Sub id
    user.subId = generate_subId();
    console.log(`Generated subId: ${user.subId}`);
    const data = await SaveUser(user);
    console.log(`User ${user.username} registered successfully.`);
    return data;
  } catch (error) {
    console.error('Error during signup:', error.message);
    throw error;
  }
}

export async function login(user) {
  try {
    await checkUserCredentials(user);
    if(checkUserCredentials) {
      console.log(`User ${user.username} logged in successfully.`);
    }
    const subId = await getGithubIdByUsername(user.username);
    const token = generateToken({ username: user.username, subId: subId });
    console.log(`Generated token for user ${user.username}: ${token}`);
    return {
      "Username": user.username,
      "subId": user.subId,
      "token": token
    }; // Return the generated token
  } catch (error) {
    console.error('Error during login:', error.message);
    throw error;
  }
}

export async function ResetPassword(user) {
  try {
    // Logic for resetting password
    console.log(`Resetting password for user ${user.username}`);
    const check = await checkUserReoveryToken(user.username, user.recovery_token);
    if (check) {
      await updateUserPassword(user); // Assuming you have a function to update the password
      console.log(`Password for user ${user.username} reset successfully.`);
      return { message: 'Password reset successfully' };
    }
    throw new Error('Invalid recovery token');
  } catch (error) {
    console.error('Error during password reset:', error.message);
    throw error;
  }
};
