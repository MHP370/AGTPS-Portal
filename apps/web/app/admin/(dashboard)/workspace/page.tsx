"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PersianDateInput } from "@/components/ui/PersianDateInput";
import {
  useCreateNote,
  useCreateReminder,
  useCreateTask,
  useDeleteNote,
  useDeleteReminder,
  useDeleteTask,
  useNotes,
  useReminders,
  useTasks,
  useUpdateReminder,
  useUpdateTask,
} from "@/hooks/useWorkspace";

export default function WorkspacePage() {
  const { data: notes = [] } = useNotes();
  const { data: reminders = [] } = useReminders();
  const { data: tasks = [] } = useTasks();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [reminderTime, setReminderTime] = useState("09:00");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (!noteTitle.trim() || !noteBody.trim()) return;
    await createNote.mutateAsync({
      title: noteTitle.trim(),
      body: noteBody.trim(),
      isPinned: true,
    });
    setNoteTitle("");
    setNoteBody("");
  }

  async function addReminder(event: React.FormEvent) {
    event.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) return;
    await createReminder.mutateAsync({
      title: reminderTitle.trim(),
      remindAt: `${reminderDate}T${reminderTime}:00`,
    });
    setReminderTitle("");
  }

  async function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    await createTask.mutateAsync({
      title: taskTitle.trim(),
      dueDate: taskDueDate ? `${taskDueDate}T09:00:00` : undefined,
      status: "TODO",
      priority: 1,
    });
    setTaskTitle("");
    setTaskDueDate("");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">فضای کاری من</h1>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-bold">دفترچه یادداشت</h2>
          <form onSubmit={addNote} className="space-y-3">
            <Input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="عنوان یادداشت"
            />
            <textarea
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="متن یادداشت"
            />
            <Button type="submit" disabled={createNote.isPending}>
              افزودن یادداشت
            </Button>
          </form>
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-xl bg-white/[0.04] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">{note.title}</h3>
                  <button
                    className="text-xs text-red-300"
                    onClick={() => deleteNote.mutate(note.id)}
                  >
                    حذف
                  </button>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {note.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-bold">یادآوری‌ها</h2>
          <form onSubmit={addReminder} className="space-y-3">
            <Input
              value={reminderTitle}
              onChange={(event) => setReminderTitle(event.target.value)}
              placeholder="عنوان یادآوری"
            />
            <PersianDateInput
              value={reminderDate}
              onChange={setReminderDate}
            />
            <Input
              type="time"
              value={reminderTime}
              onChange={(event) => setReminderTime(event.target.value)}
            />
            <Button type="submit" disabled={createReminder.isPending}>
              افزودن یادآوری
            </Button>
          </form>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-xl bg-white/[0.04] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">{reminder.title}</h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      className="text-emerald-300"
                      onClick={() =>
                        updateReminder.mutate({
                          id: reminder.id,
                          dto: { completed: !reminder.completed },
                        })
                      }
                    >
                      {reminder.completed ? "بازگشت" : "انجام شد"}
                    </button>
                    <button
                      className="text-red-300"
                      onClick={() => deleteReminder.mutate(reminder.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(reminder.remindAt).toLocaleString("fa-IR")}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-bold">تسک‌ها و کارها</h2>
          <form onSubmit={addTask} className="space-y-3">
            <Input
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="عنوان کار"
            />
            <PersianDateInput
              value={taskDueDate}
              onChange={setTaskDueDate}
            />
            <Button type="submit" disabled={createTask.isPending}>
              افزودن کار
            </Button>
          </form>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-xl bg-white/[0.04] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">{task.title}</h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      className="text-emerald-300"
                      onClick={() =>
                        updateTask.mutate({
                          id: task.id,
                          dto: {
                            status: task.status === "DONE" ? "TODO" : "DONE",
                          },
                        })
                      }
                    >
                      {task.status === "DONE" ? "بازگشت" : "انجام شد"}
                    </button>
                    <button
                      className="text-red-300"
                      onClick={() => deleteTask.mutate(task.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("fa-IR")
                    : "بدون سررسید"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
