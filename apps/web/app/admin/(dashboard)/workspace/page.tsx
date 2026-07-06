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
  useUpdateNote,
  useUpdateReminder,
  useUpdateTask,
} from "@/hooks/useWorkspace";
import type {
  PortalNote,
  PortalReminder,
  PortalTask,
  TaskStatus,
} from "@/lib/workspace";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

function toLocalTime(value: string) {
  return new Date(value).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateValue(value?: string | null) {
  if (!value) return "";
  return toLocalDateKey(new Date(value));
}

function toTimeValue(value?: string | null) {
  if (!value) return "09:00";
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const statusLabels: Record<TaskStatus, string> = {
  TODO: "برای انجام",
  IN_PROGRESS: "در حال انجام",
  DONE: "انجام شده",
};

export default function WorkspacePage() {
  const { data: notes = [] } = useNotes();
  const { data: reminders = [] } = useReminders();
  const { data: tasks = [] } = useTasks();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [editingNote, setEditingNote] = useState<PortalNote | null>(null);
  const [editingReminder, setEditingReminder] =
    useState<PortalReminder | null>(null);
  const [editingTask, setEditingTask] = useState<PortalTask | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [notePinned, setNotePinned] = useState(true);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDescription, setReminderDescription] = useState("");
  const [reminderDate, setReminderDate] = useState(toLocalDateKey(new Date()));
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderNotifyBefore, setReminderNotifyBefore] = useState("0");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskTime, setTaskTime] = useState("09:00");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("TODO");
  const [taskPriority, setTaskPriority] = useState("1");
  const [taskNotifyBefore, setTaskNotifyBefore] = useState("0");

  function resetNoteForm() {
    setEditingNote(null);
    setNoteTitle("");
    setNoteBody("");
    setNotePinned(true);
  }

  function resetReminderForm() {
    setEditingReminder(null);
    setReminderTitle("");
    setReminderDescription("");
    setReminderDate(toLocalDateKey(new Date()));
    setReminderTime("09:00");
    setReminderNotifyBefore("0");
  }

  function resetTaskForm() {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskDueDate("");
    setTaskTime("09:00");
    setTaskStatus("TODO");
    setTaskPriority("1");
    setTaskNotifyBefore("0");
  }

  function startEditNote(note: PortalNote) {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteBody(note.body);
    setNotePinned(note.isPinned);
  }

  function startEditReminder(reminder: PortalReminder) {
    setEditingReminder(reminder);
    setReminderTitle(reminder.title);
    setReminderDescription(reminder.description ?? "");
    setReminderDate(toDateValue(reminder.remindAt));
    setReminderTime(toTimeValue(reminder.remindAt));
    setReminderNotifyBefore(String(reminder.notifyBeforeMinutes ?? 0));
  }

  function startEditTask(task: PortalTask) {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description ?? "");
    setTaskDueDate(toDateValue(task.dueDate));
    setTaskTime(toTimeValue(task.dueDate));
    setTaskStatus(task.status);
    setTaskPriority(String(task.priority ?? 1));
    setTaskNotifyBefore(String(task.notifyBeforeMinutes ?? 0));
  }

  async function submitNote(event: React.FormEvent) {
    event.preventDefault();
    if (!noteTitle.trim() || !noteBody.trim()) return;

    const dto = {
      title: noteTitle.trim(),
      body: noteBody.trim(),
      isPinned: notePinned,
    };

    if (editingNote) {
      await updateNote.mutateAsync({ id: editingNote.id, dto });
    } else {
      await createNote.mutateAsync(dto);
    }

    resetNoteForm();
  }

  async function submitReminder(event: React.FormEvent) {
    event.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) return;

    const dto = {
      title: reminderTitle.trim(),
      description: reminderDescription.trim() || undefined,
      remindAt: `${reminderDate}T${reminderTime}:00`,
      notifyBeforeMinutes: Number(reminderNotifyBefore) || 0,
    };

    if (editingReminder) {
      await updateReminder.mutateAsync({ id: editingReminder.id, dto });
    } else {
      await createReminder.mutateAsync(dto);
    }

    resetReminderForm();
  }

  async function submitTask(event: React.FormEvent) {
    event.preventDefault();
    if (!taskTitle.trim()) return;

    const dto = {
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      dueDate: taskDueDate ? `${taskDueDate}T${taskTime}:00` : undefined,
      status: taskStatus,
      priority: Number(taskPriority) || 1,
      notifyBeforeMinutes: Number(taskNotifyBefore) || 0,
    };

    if (editingTask) {
      await updateTask.mutateAsync({ id: editingTask.id, dto });
    } else {
      await createTask.mutateAsync(dto);
    }

    resetTaskForm();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">فضای کاری من</h1>
        <p className="mt-2 text-sm text-slate-400">
          یادداشت‌ها، یادآوری‌ها و تسک‌های این بخش فقط برای کاربر فعلی نمایش
          داده می‌شود.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-bold">
            {editingNote ? "ویرایش یادداشت" : "دفترچه یادداشت"}
          </h2>
          <form onSubmit={submitNote} className="space-y-3">
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
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={notePinned}
                onChange={(event) => setNotePinned(event.target.checked)}
              />
              سنجاق شود
            </label>
            <div className="flex gap-3">
              <Button type="submit" disabled={createNote.isPending || updateNote.isPending}>
                {editingNote ? "ذخیره ویرایش" : "افزودن یادداشت"}
              </Button>
              {editingNote && (
                <Button type="button" variant="secondary" onClick={resetNoteForm}>
                  انصراف
                </Button>
              )}
            </div>
          </form>
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-xl bg-white/[0.04] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">{note.title}</h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      className="text-cyan-300"
                      onClick={() => startEditNote(note)}
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      className="text-red-300"
                      onClick={() => deleteNote.mutate(note.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {note.body}
                </p>
                {note.isPinned && (
                  <p className="mt-2 text-xs text-cyan-200">سنجاق‌شده</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-bold">
            {editingReminder ? "ویرایش یادآوری" : "یادآوری‌ها"}
          </h2>
          <form onSubmit={submitReminder} className="space-y-3">
            <Input
              value={reminderTitle}
              onChange={(event) => setReminderTitle(event.target.value)}
              placeholder="عنوان یادآوری"
            />
            <textarea
              value={reminderDescription}
              onChange={(event) => setReminderDescription(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500"
              placeholder="توضیحات"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <PersianDateInput value={reminderDate} onChange={setReminderDate} />
              <Input
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
              />
            </div>
            <select
              value={reminderNotifyBefore}
              onChange={(event) => setReminderNotifyBefore(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
            >
              <option value="0">اعلان در همان زمان</option>
              <option value="60">۱ ساعت قبل</option>
              <option value="180">۳ ساعت قبل</option>
              <option value="1440">۱ روز قبل</option>
              <option value="2880">۲ روز قبل</option>
            </select>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createReminder.isPending || updateReminder.isPending}
              >
                {editingReminder ? "ذخیره ویرایش" : "افزودن یادآوری"}
              </Button>
              {editingReminder && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetReminderForm}
                >
                  انصراف
                </Button>
              )}
            </div>
          </form>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-xl bg-white/[0.04] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={`font-bold ${
                      reminder.completed ? "text-slate-500 line-through" : ""
                    }`}
                  >
                    {reminder.title}
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      className="text-cyan-300"
                      onClick={() => startEditReminder(reminder)}
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
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
                      type="button"
                      className="text-red-300"
                      onClick={() => deleteReminder.mutate(reminder.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                {reminder.description && (
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {reminder.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(reminder.remindAt).toLocaleDateString("fa-IR")} -{" "}
                  {toLocalTime(reminder.remindAt)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-bold">
            {editingTask ? "ویرایش تسک" : "تسک‌ها و کارها"}
          </h2>
          <form onSubmit={submitTask} className="space-y-3">
            <Input
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="عنوان کار"
            />
            <textarea
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white placeholder:text-slate-500"
              placeholder="توضیحات"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <PersianDateInput value={taskDueDate} onChange={setTaskDueDate} />
              <Input
                type="time"
                value={taskTime}
                onChange={(event) => setTaskTime(event.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={taskStatus}
                onChange={(event) =>
                  setTaskStatus(event.target.value as TaskStatus)
                }
                className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
              >
                <option value="TODO">برای انجام</option>
                <option value="IN_PROGRESS">در حال انجام</option>
                <option value="DONE">انجام شده</option>
              </select>
              <Input
                type="number"
                min={1}
                value={taskPriority}
                onChange={(event) => setTaskPriority(event.target.value)}
                placeholder="اولویت"
              />
            </div>
            <select
              value={taskNotifyBefore}
              onChange={(event) => setTaskNotifyBefore(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
            >
              <option value="0">اعلان در همان زمان</option>
              <option value="60">۱ ساعت قبل</option>
              <option value="180">۳ ساعت قبل</option>
              <option value="1440">۱ روز قبل</option>
              <option value="2880">۲ روز قبل</option>
            </select>
            <div className="flex gap-3">
              <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
                {editingTask ? "ذخیره ویرایش" : "افزودن کار"}
              </Button>
              {editingTask && (
                <Button type="button" variant="secondary" onClick={resetTaskForm}>
                  انصراف
                </Button>
              )}
            </div>
          </form>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-xl bg-white/[0.04] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={`font-bold ${
                      task.status === "DONE" ? "text-slate-500 line-through" : ""
                    }`}
                  >
                    {task.title}
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      className="text-cyan-300"
                      onClick={() => startEditTask(task)}
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
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
                      type="button"
                      className="text-red-300"
                      onClick={() => deleteTask.mutate(task.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                {task.description && (
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {task.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {task.dueDate
                    ? `${new Date(task.dueDate).toLocaleDateString("fa-IR")} - ${toLocalTime(task.dueDate)}`
                    : "بدون سررسید"}
                  {" · "}
                  {statusLabels[task.status]} · اولویت {task.priority}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
