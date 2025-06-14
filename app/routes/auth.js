import { Router } from 'express';
const router = Router();
import { signup, login, ResetPassword } from '../controllers/auth.js';

// POST /register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    await signup({ username, password });

    res.status(201).json({ 
          Status : 'Success',
          Data: "data", 
          message: 'User Registered in successfully' 
        });
  } catch (err) {
    if (err.code === 11000) { 
      res.status(409).json({ 
          Status : 'Failed',
          Data: 'data',
          message: 'User Already exists with this username' 
        });
    } else {
      res.status(500).json({ 
          Status : 'Success',
          Data: data,
          message: 'User Registered in successfully' 
        });
    }
  }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        const data = await login({ username, password });
        res.status(200).json({ 
          Status : 'Success',
          Data: data,
          message: 'User logged in successfully' 
        });
    } catch (err) {
        return res.status(500).json({ 
          "status": False,
          "message": 'Error logging in', error: err.message,
          "data": None
        });
    }
});

router.post("/reset-password", async (req, res) => {
    const { username, newPassword, recovery_token } = req.body;
    if (!username || !recovery_token || !newPassword) {
        return res.status(400).json({ message: 'Username and new password and recovery_token are required' });
    }
    try {
        // Implement password reset logic here
        const data = await ResetPassword({ username, newPassword, recovery_token });
        // For example, find the user by username and update the password
        res.status(200).json({ 
          Status : 'Success',
          Data: data,
          message: 'Password reset successfully' 
        });
    } catch (err) {
        return res.status(500).json({ 
          Status : 'Failed',
          Data: 'data',
          message: 'Error resetting password', error: err.message 
        });
    }
});

export default router;