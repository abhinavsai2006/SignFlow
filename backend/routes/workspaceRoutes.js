import express from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/workspaces
// @desc    Create a new team workspace
router.post('/', protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      ownerId: req.user._id,
      members: [{
        userId: req.user._id,
        role: 'Owner'
      }]
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create workspace', error: error.message });
  }
});

// @route   GET /api/workspaces
// @desc    Get all workspaces the user is a member of
router.get('/', protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.userId': req.user._id
    }).populate('ownerId', 'name email').populate('members.userId', 'name email');
    
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workspaces', error: error.message });
  }
});

// @route   POST /api/workspaces/:id/members
// @desc    Add a member to the workspace
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Member email is required' });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Verify requesting user is Owner or Admin
    const memberRequest = workspace.members.find(m => m.userId.toString() === req.user._id.toString());
    if (!memberRequest || (memberRequest.role !== 'Owner' && memberRequest.role !== 'Admin')) {
      return res.status(403).json({ message: 'Not authorized to invite members to this workspace' });
    }

    // Find user by email
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User with this email not registered yet' });
    }

    // Check if user already in members
    const isAlreadyMember = workspace.members.some(m => m.userId.toString() === userToInvite._id.toString());
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }

    workspace.members.push({
      userId: userToInvite._id,
      role: role || 'Member'
    });

    await workspace.save();
    
    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate('ownerId', 'name email')
      .populate('members.userId', 'name email');

    res.json(updatedWorkspace);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add workspace member', error: error.message });
  }
});

// @route   DELETE /api/workspaces/:id/members/:memberUserId
// @desc    Remove a member from the workspace
router.delete('/:id/members/:memberUserId', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Verify requesting user is Owner or Admin
    const memberRequest = workspace.members.find(m => m.userId.toString() === req.user._id.toString());
    if (!memberRequest || (memberRequest.role !== 'Owner' && memberRequest.role !== 'Admin')) {
      return res.status(403).json({ message: 'Not authorized to remove members from this workspace' });
    }

    // Prevent removing Owner
    const targetMember = workspace.members.find(m => m.userId.toString() === req.params.memberUserId);
    if (targetMember && targetMember.role === 'Owner') {
      return res.status(400).json({ message: 'Cannot remove the workspace owner' });
    }

    workspace.members = workspace.members.filter(m => m.userId.toString() !== req.params.memberUserId);
    await workspace.save();

    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate('ownerId', 'name email')
      .populate('members.userId', 'name email');

    res.json(updatedWorkspace);
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove workspace member', error: error.message });
  }
});

export default router;
