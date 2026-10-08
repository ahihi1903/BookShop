import { profileService } from '../services/profile.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const data = await profileService.get(req.user.id);
  res.status(200).json({ success: true, message: 'Profile loaded successfully', data });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = await profileService.update(req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Profile updated successfully', data });
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await profileService.changePassword(req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Password changed successfully', data });
});
