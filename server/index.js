import express from "express";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "server", "data");
const tasksFile = path.join(dataDir, "tasks.json");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 3001);

const app = express();
app.use(express.json());

let writeQueue = Promise.resolve();

async function ensureTasksFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(tasksFile);
  } catch {
    await fs.writeFile(tasksFile, "[]\n", "utf8");
  }
}

async function readTasks() {
  await ensureTasksFile();
  const raw = await fs.readFile(tasksFile, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeTasks(tasks) {
  writeQueue = writeQueue.then(async () => {
    await ensureTasksFile();
    await fs.writeFile(tasksFile, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
  });

  return writeQueue;
}

function normalizeTask(input) {
  return {
    id: input.id,
    title: String(input.title ?? "").trim(),
    owner: String(input.owner ?? "").trim(),
    store: ["pizza", "gogi", "all"].includes(input.store) ? input.store : "pizza",
    year: Number(input.year),
    month: Number(input.month),
    startDay: Number(input.startDay),
    endDay: Number(input.endDay),
    memo: String(input.memo ?? ""),
    percent: Number.isFinite(Number(input.percent)) ? Number(input.percent) : 0,
  };
}

function validateTask(task) {
  if (!task.title || !task.owner) {
    return "업무명과 담당자는 필수입니다.";
  }

  if (!Number.isInteger(task.year) || !Number.isInteger(task.month) || task.month < 1 || task.month > 12) {
    return "연도와 월이 올바르지 않습니다.";
  }

  const daysInMonth = new Date(task.year, task.month, 0).getDate();
  if (
    !Number.isInteger(task.startDay) ||
    !Number.isInteger(task.endDay) ||
    task.startDay < 1 ||
    task.endDay < task.startDay ||
    task.endDay > daysInMonth
  ) {
    return "선택한 날짜 범위가 올바르지 않습니다.";
  }

  if (!Number.isFinite(task.percent) || task.percent < 0 || task.percent > 100) {
    return "진행률은 0에서 100 사이여야 합니다.";
  }

  return null;
}

app.get("/api/tasks", async (_req, res) => {
  const tasks = await readTasks();
  res.json(tasks);
});

app.post("/api/tasks", async (req, res) => {
  const incomingTask = normalizeTask({ ...req.body, id: randomUUID() });
  const error = validateTask(incomingTask);

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const tasks = await readTasks();
  tasks.push(incomingTask);
  await writeTasks(tasks);
  res.status(201).json(incomingTask);
});

app.put("/api/tasks/:id", async (req, res) => {
  const tasks = await readTasks();
  const index = tasks.findIndex((task) => task.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ message: "업무를 찾을 수 없습니다." });
    return;
  }

  const updatedTask = normalizeTask({ ...tasks[index], ...req.body, id: tasks[index].id });
  const error = validateTask(updatedTask);

  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  tasks[index] = updatedTask;
  await writeTasks(tasks);
  res.json(updatedTask);
});

app.delete("/api/tasks/:id", async (req, res) => {
  const tasks = await readTasks();
  const nextTasks = tasks.filter((task) => task.id !== req.params.id);

  if (nextTasks.length === tasks.length) {
    res.status(404).json({ message: "업무를 찾을 수 없습니다." });
    return;
  }

  await writeTasks(nextTasks);
  res.status(204).end();
});

app.use(express.static(distDir));

app.get(/^(?!\/api\/).*/, async (_req, res) => {
  try {
    await fs.access(path.join(distDir, "index.html"));
    res.sendFile(path.join(distDir, "index.html"));
  } catch {
    res.status(404).send("프런트 빌드가 없습니다. `npm run build` 후 다시 실행하세요.");
  }
});

app.listen(port, async () => {
  await ensureTasksFile();
  console.log(`Storybook server listening on http://localhost:${port}`);
});
