// src/routes/admin.js
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, requireSystemAdmin } = require('../middleware/auth');

router.use(authenticate, requireSystemAdmin);

// ── GET /api/admin/workload ──────────────────────────────────────────────────
router.get('/workload', async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      select: { status: true, dueDate: true, assigneeId: true }
    });

    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;
    let unassigned = 0;

    const now = new Date();

    for (const task of tasks) {
      if (!task.assigneeId) {
        unassigned++;
      }
      
      if (task.status === 'DONE') {
        completed++;
      } else if (task.dueDate && new Date(task.dueDate) < now) {
        overdue++;
      } else if (task.status === 'IN_PROGRESS') {
        inProgress++;
      } else if (task.status === 'TODO') {
        pending++;
      }
    }

    res.json({
      distribution: [
        { name: 'Pending', value: pending, color: '#94a3b8' }, // slate-400
        { name: 'In Progress', value: inProgress, color: '#818cf8' }, // brand-400
        { name: 'Completed', value: completed, color: '#4ade80' }, // green-400
        { name: 'Overdue', value: overdue, color: '#f87171' }, // red-400
        { name: 'Unassigned', value: unassigned, color: '#fbbf24' } // yellow-400
      ]
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/members ───────────────────────────────────────────────────
router.get('/members', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [totalMembers, activeMembers, inactiveMembers, onLeaveMembers, membersList] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'INACTIVE' } }),
      prisma.user.count({ where: { status: 'ON_LEAVE' } }),
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          assignedTasks: {
            where: { status: { not: 'DONE' } },
            select: { id: true }
          },
          memberships: {
            include: { project: { select: { name: true } } }
          }
        },
        orderBy: { name: 'asc' }
      })
    ]);

    const formattedMembers = membersList.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      department: m.department || 'Unassigned',
      status: m.status,
      systemRole: m.systemRole,
      workloadCount: m.assignedTasks.length,
      projects: m.memberships.map(mem => mem.project.name)
    }));

    res.json({
      stats: {
        total: totalMembers,
        active: activeMembers,
        inactive: inactiveMembers,
        onLeave: onLeaveMembers
      },
      members: formattedMembers,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalMembers / limit),
        totalItems: totalMembers
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
