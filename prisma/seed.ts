import { PrismaClient, TaskStatus, TaskPriority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "ali@example.com" },
    update: {},
    create: {
      name: "Ali",
      email: "ali@example.com",
      passwordHash,
    },
  });

  console.log(`Seeded user: ${user.email} (password: password123)`);

  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: "Finish AI Assistant UI",
        description: "Polish the dashboard and assistant screens for Nova AI.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        category: "Nova AI",
        dueDate: new Date(),
      },
      {
        userId: user.id,
        title: "Record Day 1 Reel",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        category: "Content",
      },
      {
        userId: user.id,
        title: "Update GitHub README",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        category: "Nova AI",
      },
      {
        userId: user.id,
        title: "Plan tomorrow's project",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        category: "Planning",
      },
    ],
  });

  const tomorrow10am = new Date();
  tomorrow10am.setDate(tomorrow10am.getDate() + 1);
  tomorrow10am.setHours(10, 0, 0, 0);

  await prisma.reminder.createMany({
    data: [
      { userId: user.id, title: "Call the client", reminderTime: tomorrow10am },
      { userId: user.id, title: "Record video", reminderTime: new Date(Date.now() + 3 * 60 * 60 * 1000) },
      { userId: user.id, title: "Project deadline", reminderTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    ],
  });

  await prisma.note.createMany({
    data: [
      { userId: user.id, title: "AI Project Ideas", content: "- Voice-first task capture\n- Weekly AI briefing email\n- Smart focus mode suggestions", pinned: true },
      { userId: user.id, title: "Client Requirements", content: "Client wants a dashboard, task manager, and voice assistant with a dark, premium look." },
      { userId: user.id, title: "Content Ideas", content: "Day 1: Intro to Nova AI. Day 2: Voice assistant demo. Day 3: Agent architecture walkthrough." },
    ],
  });

  const meetingStart = new Date();
  meetingStart.setDate(meetingStart.getDate() + 1);
  meetingStart.setHours(15, 0, 0, 0);
  const meetingEnd = new Date(meetingStart);
  meetingEnd.setHours(16, 0, 0, 0);

  await prisma.calendarEvent.createMany({
    data: [
      { userId: user.id, title: "Client Meeting", startTime: meetingStart, endTime: meetingEnd, location: "Zoom", reminder: true },
      { userId: user.id, title: "Development Session", startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), endTime: new Date(Date.now() + 4 * 60 * 60 * 1000) },
      { userId: user.id, title: "Content Recording", startTime: new Date(Date.now() + 26 * 60 * 60 * 1000), endTime: new Date(Date.now() + 27 * 60 * 60 * 1000) },
    ],
  });

  await prisma.memory.createMany({
    data: [
      { userId: user.id, content: "Prefers dark themes in every product.", category: "preference", importance: 3 },
      { userId: user.id, content: "Main stack is Next.js, TypeScript, and PostgreSQL.", category: "work", importance: 4 },
      { userId: user.id, content: "Current project is Nova AI, a personal AI assistant SaaS.", category: "work", importance: 5 },
    ],
  });

  await prisma.automation.createMany({
    data: [
      { userId: user.id, name: "Summarize new tasks", trigger: "task.created", action: "ai.summarize" },
      { userId: user.id, name: "Notify on due reminders", trigger: "reminder.due", action: "notify.user" },
      { userId: user.id, name: "Extract tasks from notes", trigger: "note.created", action: "ai.extractTasks", enabled: false },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
