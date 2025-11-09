import { Router } from 'express';
import prisma from '../prismaClient';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

const router = Router();

// GET /api/admin/pending-users - Get all pending approval users
router.get('/pending-users', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        approved: false,
        rejectedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        country: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      count: pendingUsers.length,
      users: pendingUsers,
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// POST /api/admin/approve-user/:userId - Approve a user
router.post('/approve-user/:userId', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, approved: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.approved) {
      return res.status(400).json({ error: 'User already approved' });
    }

    // Approve user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        approved: true,
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    });

    // Create notification for user
    await createNotification({
      userId: userId,
      category: 'system',
      type: 'email',
      title: '🎉 Account Approved!',
      message: 'Welcome to Advancia! Your account has been approved. You can now access all features and start trading.',
      priority: 'high',
      data: { approvedAt: new Date() },
    });

    // Mark admin notification as read
    await prisma.adminNotification.updateMany({
      where: {
        userId: userId,
        type: 'NEW_USER',
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return res.json({
      message: 'User approved successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        approved: updatedUser.approved,
        approvedAt: updatedUser.approvedAt,
      },
    });
  } catch (error) {
    console.error('Error approving user:', error);
    return res.status(500).json({ error: 'Failed to approve user' });
  }
});

// POST /api/admin/reject-user/:userId - Reject a user
router.post('/reject-user/:userId', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, approved: true, rejectedAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.approved) {
      return res.status(400).json({ error: 'Cannot reject an approved user' });
    }

    if (user.rejectedAt) {
      return res.status(400).json({ error: 'User already rejected' });
    }

    // Reject user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        rejectedAt: new Date(),
        rejectionReason: reason,
        active: false,
      },
    });

    // Notify user of rejection
    await createNotification({
      userId: userId,
      category: 'system',
      type: 'email',
      title: 'Account Application Update',
      message: `Your account application was not approved. Reason: ${reason}. Please contact support for more information.`,
      priority: 'high',
      data: { reason, rejectedAt: new Date() },
    });

    // Mark admin notification as read
    await prisma.adminNotification.updateMany({
      where: {
        userId: userId,
        type: 'NEW_USER',
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return res.json({
      message: 'User rejected successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        rejected: true,
        rejectionReason: updatedUser.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    return res.status(500).json({ error: 'Failed to reject user' });
  }
});

// GET /api/admin/notifications - Get admin notifications
router.get('/notifications', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const unreadCount = await prisma.adminNotification.count({
      where: { read: false },
    });

    return res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/admin/notifications/:id/mark-read - Mark notification as read
router.post('/notifications/:id/mark-read', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    await prisma.adminNotification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
