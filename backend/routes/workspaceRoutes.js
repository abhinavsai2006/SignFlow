import express from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendTeamInviteEmail,
  sendTeamMemberAddedEmail,
  sendRoleChangedEmail
} from '../middleware/emailService.js';

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

router.post('/:id/members', protect, async (req, res) => {
  try {
    console.log('INVITE_START:', { workspaceId: req.params.id });
    console.log('INVITE_PAYLOAD:', req.body);

    const { email, role } = req.body;
    if (!email) {
      console.log('INVITE_FAIL: Missing email');
      return res.status(400).json({ message: 'Member email is required' });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      console.log('INVITE_FAIL: Workspace not found');
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Verify requesting user is Owner or Admin
    const memberRequest = workspace.members.find(m => m.userId.toString() === req.user._id.toString());
    if (!memberRequest || (memberRequest.role !== 'Owner' && memberRequest.role !== 'Admin')) {
      console.log('INVITE_FAIL: Unauthorized');
      return res.status(403).json({ message: 'Not authorized to invite members to this workspace' });
    }

    // Find user by email or auto-provision placeholder
    let userToInvite = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;
    
    if (!userToInvite) {
      const crypto = await import('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      userToInvite = await User.create({
        name: email.split('@')[0],
        email: email.toLowerCase(),
        password: randomPassword,
        isVerified: false
      });
      isNewUser = true;
      console.log('[Workspace Service] Auto-provisioned placeholder user for invited email:', email);
    }

    // Check if user already in members
    const isAlreadyMember = workspace.members.some(m => m.userId.toString() === userToInvite._id.toString());
    if (isAlreadyMember) {
      console.log('INVITE_FAIL: Already a member');
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }

    workspace.members.push({
      userId: userToInvite._id,
      role: role || 'Member'
    });

    await workspace.save();
    
    // Trigger invite email
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5177';
    const inviteUrl = `${FRONTEND_URL}/register?email=${encodeURIComponent(email)}`;
    
    sendTeamInviteEmail(email, req.user.name, workspace.name, inviteUrl)
      .then(() => console.log('[Workspace] Invitation email sent to:', email))
      .catch(err => console.error('[Workspace] Invitation email dispatch failed:', err));

    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate('ownerId', 'name email')
      .populate('members.userId', 'name email');

    console.log('INVITE_SUCCESS:', { workspaceId: workspace._id, email });
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

// ============================================================================
// DEMO WORKSPACE ENDPOINTS — Student Project
// ============================================================================

// @route   POST /api/workspaces/demo/invite
// @desc    DEMO FEATURE - Simulates sending workspace invitation email
router.post('/demo/invite', protect, async (req, res) => {
  try {
    const { email, workspaceName } = req.body;
    if (!email || !workspaceName) {
      return res.status(400).json({ message: 'Email and workspace name are required' });
    }
    const inviteUrl = `${FRONTEND_URL}/workspace/join?ws=${encodeURIComponent(workspaceName)}`;
    await sendTeamInviteEmail(email, req.user.name, workspaceName, inviteUrl);
    res.json({ message: 'Demo workspace invite sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Demo invite failed', error: error.message });
  }
});

// @route   POST /api/workspaces/demo/add-member
// @desc    DEMO FEATURE - Simulates adding a team member and notifying owner
router.post('/demo/add-member', protect, async (req, res) => {
  try {
    const { newMemberEmail, workspaceName } = req.body;
    if (!newMemberEmail || !workspaceName) {
      return res.status(400).json({ message: 'newMemberEmail and workspaceName are required' });
    }
    await sendTeamMemberAddedEmail(req.user.email, req.user.name, newMemberEmail, workspaceName);
    res.json({ message: 'Demo member added email notification sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Demo add member alert failed', error: error.message });
  }
});

// @route   POST /api/workspaces/demo/change-role
// @desc    DEMO FEATURE - Simulates workspace role change and notifies member
router.post('/demo/change-role', protect, async (req, res) => {
  try {
    const { email, userName, newRole, workspaceName } = req.body;
    if (!email || !userName || !newRole || !workspaceName) {
      return res.status(400).json({ message: 'email, userName, newRole, workspaceName are required' });
    }
    await sendRoleChangedEmail(email, userName, newRole, workspaceName);
    res.json({ message: 'Demo role change email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Demo role change alert failed', error: error.message });
  }
});

export default router;
