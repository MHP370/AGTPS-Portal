"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckSquare,
  ClipboardList,
  Download,
  Plus,
  PieChart,
  Trash2,
  Vote,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from "framer-motion";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  useAdminPollSurveys,
  useClonePollSurvey,
  useCreatePollSurvey,
  useDeletePollSurvey,
  usePollSurveyResults,
  useUpdatePollSurvey,
} from "@/hooks/usePollSurveys";
import type {
  CreatePollSurveyDto,
  PollSurvey,
  PollSurveyQuestionType,
  PollSurveyResult,
  PollSurveyStatus,
  PollSurveyType,
} from "@/lib/poll-surveys";

type PageTab = "polls" | "surveys" | "create" | "reports";

type SurveyQuestionDraft = {
  draftId: string;
  title: string;
  type: PollSurveyQuestionType;
  description: string;
  optionsText: string;
  isRequired: boolean;
};

const tabs: Array<{ id: PageTab; label: string; icon: typeof Vote }> = [
  { id: "polls", label: "رای‌گیری‌ها", icon: Vote },
  { id: "surveys", label: "نظرسنجی‌ها", icon: ClipboardList },
  { id: "create", label: "افزودن", icon: Plus },
  { id: "reports", label: "گزارش سریع", icon: BarChart3 },
];

const statusOptions: Array<{ value: PollSurveyStatus; label: string }> = [
  { value: "DRAFT", label: "پیش‌نویس" },
  { value: "SCHEDULED", label: "زمان‌بندی شده" },
  { value: "RUNNING", label: "در حال اجرا" },
  { value: "CLOSED", label: "بسته شده" },
  { value: "ARCHIVED", label: "آرشیو" },
];

const questionTypeOptions: Array<{
  value: PollSurveyQuestionType;
  label: string;
}> = [
  { value: "SINGLE_CHOICE", label: "تک انتخابی" },
  { value: "MULTIPLE_CHOICE", label: "چند انتخابی" },
  { value: "TEXT", label: "متن کوتاه" },
  { value: "PARAGRAPH", label: "پاراگراف" },
  { value: "RATING", label: "امتیازدهی" },
  { value: "YES_NO", label: "بله / خیر" },
  { value: "NUMBER", label: "عدد" },
  { value: "DATE", label: "تاریخ" },
  { value: "MATRIX", label: "ماتریسی" },
];

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createSurveyQuestionDraft(
  index: number,
  overrides?: Partial<SurveyQuestionDraft>,
): SurveyQuestionDraft {
  return {
    draftId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${index}`,
    title: `سوال ${index + 1}`,
    type: "SINGLE_CHOICE",
    description: "",
    optionsText: "گزینه اول\nگزینه دوم",
    isRequired: true,
    ...overrides,
  };
}

function questionNeedsOptions(type: PollSurveyQuestionType) {
  return type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
}

function formatDate(value?: string | null) {
  if (!value) return "ثبت نشده";

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function typeLabel(type: PollSurveyType) {
  return type === "POLL" ? "رای‌گیری" : "نظرسنجی";
}

function formatPercent(value: number) {
  return `${Math.round(value)}٪`;
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function exportReportCsv(result: PollSurveyResult) {
  const rows = [
    ["نوع", typeLabel(result.type)],
    ["عنوان", result.title],
    ["کل پاسخ‌ها", result.totalResponses],
    [],
    ["سوال", "نوع", "گزینه/پاسخ", "تعداد/مقدار"],
  ];

  result.questions.forEach((question) => {
    if (question.options.length) {
      question.options.forEach((option) => {
        rows.push([question.title, question.type, option.label, option.count]);
      });
    }

    if (question.average !== null) {
      rows.push([question.title, question.type, "میانگین", question.average]);
    }

    question.textAnswers.forEach((answer, index) => {
      rows.push([question.title, question.type, `پاسخ ${index + 1}`, answer]);
    });
  });

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.title || "poll-survey-report"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function getSubmittedCount(item: PollSurvey) {
  return (
    item.responses?.filter((response) => response.status === "SUBMITTED")
      .length ?? 0
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function PollSurveyTable({
  items,
  onSelectReport,
  onEdit,
  onView,
}: {
  items: PollSurvey[];
  onSelectReport: (id: string) => void;
  onEdit: (item: PollSurvey) => void;
  onView: (item: PollSurvey) => void;
}) {
  const updatePollSurvey = useUpdatePollSurvey();
  const deletePollSurvey = useDeletePollSurvey();
  const clonePollSurvey = useClonePollSurvey();

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
      <div className="overflow-x-auto">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-slate-950/60 text-slate-300">
            <tr>
              <th className="px-4 py-3">عنوان</th>
              <th className="px-4 py-3">نوع</th>
              <th className="px-4 py-3">وضعیت</th>
              <th className="px-4 py-3">پایان</th>
              <th className="px-4 py-3">ویژگی‌ها</th>
              <th className="px-4 py-3">پاسخ‌ها</th>
              <th className="px-4 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-bold text-white">{item.title}</div>
                  <div className="mt-1 max-w-md text-xs leading-6 text-slate-400">
                    {item.description || "بدون توضیح"}
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-300">
                  {typeLabel(item.type)}
                </td>
                <td className="px-4 py-4">
                  <Select
                    value={item.status}
                    onValueChange={(value) =>
                      updatePollSurvey.mutate({
                        id: item.id,
                        dto: { status: value as PollSurveyStatus },
                      })
                    }
                    options={statusOptions}
                  />
                </td>
                <td className="px-4 py-4 text-slate-300">
                  {formatDate(item.deadline)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {item.anonymous && (
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                        ناشناس
                      </span>
                    )}
                    {item.required && (
                      <span className="rounded-full bg-rose-400/10 px-3 py-1 text-xs text-rose-100">
                        اجباری
                      </span>
                    )}
                    {item.popupEnforced && (
                      <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                        popup
                      </span>
                    )}
                    {item.allowLiveResults && (
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                        نتایج زنده
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-300">
                  {getSubmittedCount(item)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onView(item)}
                    >
                      مشاهده
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectReport(item.id)}
                    >
                      گزارش
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => clonePollSurvey.mutate(item.id)}
                    >
                      کلون
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm("این مورد حذف شود؟")) {
                          deletePollSurvey.mutate(item.id);
                        }
                      }}
                    >
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="p-6 text-center text-sm text-slate-400">
          موردی ثبت نشده است.
        </div>
      )}
    </div>
  );
}

export default function PollsPage() {
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<PageTab>("polls");
  const { data: items = [] } = useAdminPollSurveys();
  const createPollSurvey = useCreatePollSurvey();
  const updatePollSurvey = useUpdatePollSurvey();

  const [editingItem, setEditingItem] = useState<PollSurvey | null>(null);
  const [viewingItem, setViewingItem] = useState<PollSurvey | null>(null);
  const [type, setType] = useState<PollSurveyType>("POLL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<PollSurveyStatus>("DRAFT");
  const [deadline, setDeadline] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionType, setQuestionType] =
    useState<PollSurveyQuestionType>("SINGLE_CHOICE");
  const [optionsText, setOptionsText] = useState("");
  const [surveyQuestions, setSurveyQuestions] = useState<
    SurveyQuestionDraft[]
  >(() => [createSurveyQuestionDraft(0)]);
  const [activeSurveyQuestionIndex, setActiveSurveyQuestionIndex] = useState(0);
  const [targetDepartments, setTargetDepartments] = useState("");
  const [targetAdGroups, setTargetAdGroups] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [required, setRequired] = useState(false);
  const [popupEnforced, setPopupEnforced] = useState(false);
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(false);
  const [allowVoteEditing, setAllowVoteEditing] = useState(false);
  const [allowResultViewing, setAllowResultViewing] = useState(false);
  const [allowParticipantCount, setAllowParticipantCount] = useState(true);
  const [allowLiveResults, setAllowLiveResults] = useState(false);
  const [participantVisibility, setParticipantVisibility] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(
    undefined,
  );
  const { data: selectedReport } = usePollSurveyResults(selectedReportId);
  const selectedReportItem = useMemo(
    () => items.find((item) => item.id === selectedReportId),
    [items, selectedReportId],
  );
  const editingHasResponses = editingItem
    ? getSubmittedCount(editingItem) > 0
    : false;

  const polls = useMemo(
    () => items.filter((item) => item.type === "POLL"),
    [items],
  );
  const surveys = useMemo(
    () => items.filter((item) => item.type === "SURVEY"),
    [items],
  );

  const resetForm = () => {
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setTags("");
    setStatus("DRAFT");
    setDeadline("");
    setPublishDate("");
    setQuestionTitle("");
    setQuestionType("SINGLE_CHOICE");
    setOptionsText("");
    setSurveyQuestions([createSurveyQuestionDraft(0)]);
    setActiveSurveyQuestionIndex(0);
    setTargetDepartments("");
    setTargetAdGroups("");
    setAnonymous(false);
    setRequired(false);
    setPopupEnforced(false);
    setAllowMultipleSelection(false);
    setAllowVoteEditing(false);
    setAllowResultViewing(false);
    setAllowParticipantCount(true);
    setAllowLiveResults(false);
    setParticipantVisibility(false);
  };

  const loadItemIntoForm = (item: PollSurvey) => {
    const firstQuestion = item.questions[0];

    setEditingItem(item);
    setType(item.type);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setCategory(item.category ?? "");
    setTags(item.tags.join(", "));
    setStatus(item.status);
    setDeadline(toDateTimeLocal(item.deadline));
    setPublishDate(toDateTimeLocal(item.publishDate));
    setQuestionTitle(firstQuestion?.title ?? item.title);
    setQuestionType(firstQuestion?.type ?? "SINGLE_CHOICE");
    setOptionsText(
      firstQuestion?.options.map((option) => option.label).join("\n") ?? "",
    );
    setSurveyQuestions(
      item.questions.length
        ? item.questions.map((question, index) =>
            createSurveyQuestionDraft(index, {
              draftId: question.id,
              title: question.title,
              type: question.type,
              description: question.description ?? "",
              optionsText: question.options
                .map((option) => option.label)
                .join("\n"),
              isRequired: question.isRequired,
            }),
          )
        : [createSurveyQuestionDraft(0)],
    );
    setActiveSurveyQuestionIndex(0);
    setTargetDepartments(item.targetDepartments.join(", "));
    setTargetAdGroups(item.targetAdGroupIds.join(", "));
    setAnonymous(item.anonymous);
    setRequired(item.required);
    setPopupEnforced(item.popupEnforced);
    setAllowMultipleSelection(item.allowMultipleSelection);
    setAllowVoteEditing(item.allowVoteEditing);
    setAllowResultViewing(item.allowResultViewing);
    setAllowParticipantCount(item.allowParticipantCount);
    setAllowLiveResults(item.allowLiveResults);
    setParticipantVisibility(item.participantVisibility);
    setActiveTab("create");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const options = splitLines(optionsText).map((label, index) => ({
      label,
      sortOrder: index + 1,
    }));
    const resolvedSurveyQuestions = surveyQuestions.map((question, index) => {
      const questionOptions = splitLines(question.optionsText).map(
        (label, optionIndex) => ({
          label,
          sortOrder: optionIndex + 1,
        }),
      );

      return {
        title: question.title || `سوال ${index + 1}`,
        description: question.description,
        type: question.type,
        isRequired: question.isRequired,
        sortOrder: index + 1,
        options: questionNeedsOptions(question.type)
          ? questionOptions
          : undefined,
        settings:
          question.type === "RATING"
            ? {
                min: 1,
                max: 5,
              }
            : undefined,
      };
    });
    const resolvedQuestionType =
      type === "POLL"
        ? allowMultipleSelection
          ? "MULTIPLE_CHOICE"
          : "SINGLE_CHOICE"
        : questionType;
    const dto: CreatePollSurveyDto = {
      type,
      title,
      description,
      category,
      tags: splitCsv(tags),
      status,
      deadline: deadline || null,
      publishDate: publishDate || null,
      anonymous,
      required,
      popupEnforced,
      allowMultipleSelection: type === "POLL" ? allowMultipleSelection : false,
      allowVoteEditing,
      allowResultViewing,
      allowParticipantCount,
      allowLiveResults,
      participantVisibility,
      targetDepartments: splitCsv(targetDepartments),
      targetAdGroupIds: splitCsv(targetAdGroups),
      questions:
        type === "SURVEY"
          ? resolvedSurveyQuestions
          : [
              {
                title: questionTitle || title,
                type: resolvedQuestionType,
                isRequired: required,
                sortOrder: 1,
                options:
                  resolvedQuestionType === "SINGLE_CHOICE" ||
                  resolvedQuestionType === "MULTIPLE_CHOICE"
                    ? options
                    : undefined,
                settings:
                  resolvedQuestionType === "RATING"
                    ? {
                        min: 1,
                        max: 5,
                      }
                    : undefined,
              },
            ],
    };

    if (editingHasResponses && editingItem) {
      dto.type = editingItem.type;
      dto.anonymous = editingItem.anonymous;
      dto.allowMultipleSelection = editingItem.allowMultipleSelection;
      dto.allowVoteEditing = editingItem.allowVoteEditing;
      dto.participantVisibility = editingItem.participantVisibility;
      delete dto.questions;
      delete dto.options;
    }

    const onSuccess = () => {
      const nextTab =
        (editingItem?.type ?? type) === "POLL" ? "polls" : "surveys";
      resetForm();
      setActiveTab(nextTab);
    };

    if (editingItem) {
      updatePollSurvey.mutate(
        {
          id: editingItem.id,
          dto,
        },
        {
          onSuccess,
        },
      );
      return;
    }

    createPollSurvey.mutate(dto, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  const updateSurveyQuestion = (
    draftId: string,
    patch: Partial<SurveyQuestionDraft>,
  ) => {
    setSurveyQuestions((current) =>
      current.map((question) =>
        question.draftId === draftId ? { ...question, ...patch } : question,
      ),
    );
  };

  const addSurveyQuestion = () => {
    setSurveyQuestions((current) => {
      const next = [...current, createSurveyQuestionDraft(current.length)];
      setActiveSurveyQuestionIndex(next.length - 1);
      return next;
    });
  };

  const removeSurveyQuestion = (draftId: string) => {
    setSurveyQuestions((current) => {
      if (current.length === 1) return current;
      const next = current.filter((question) => question.draftId !== draftId);
      setActiveSurveyQuestionIndex((index) =>
        Math.min(index, Math.max(next.length - 1, 0)),
      );
      return next;
    });
  };

  const activeSurveyQuestion =
    surveyQuestions[
      Math.min(activeSurveyQuestionIndex, surveyQuestions.length - 1)
    ];
  const formMotionTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.16, 1, 0.3, 1] };

  return (
    <main className="space-y-6 p-6" dir="rtl">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">نظرسنجی و رای‌گیری</h1>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            موتور مشترک برای رای‌گیری، نظرسنجی، مشارکت اجباری و گزارش‌های
            سازمانی.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            resetForm();
            setType("POLL");
            setActiveTab("create");
          }}
        >
          <Plus className="ml-2 h-4 w-4" />
          افزودن
        </Button>
      </header>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-300/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {viewingItem && (
        <section className="space-y-4 rounded-2xl border border-cyan-300/20 bg-slate-900/85 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold text-cyan-200">
                {typeLabel(viewingItem.type)}
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">
                {viewingItem.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                {viewingItem.description || "بدون توضیح"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewingItem(null)}
            >
              بستن
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">وضعیت</p>
              <p className="mt-1 font-black text-white">
                {statusOptions.find((item) => item.value === viewingItem.status)
                  ?.label ?? viewingItem.status}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">پاسخ‌ها</p>
              <p className="mt-1 font-black text-cyan-100">
                {getSubmittedCount(viewingItem)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">مهلت</p>
              <p className="mt-1 font-black text-white">
                {formatDate(viewingItem.deadline)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">حالت</p>
              <p className="mt-1 font-black text-white">
                {viewingItem.anonymous ? "ناشناس" : "با نام"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <h3 className="font-black text-white">سوال‌ها</h3>
              <div className="mt-3 space-y-3">
                {viewingItem.questions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="font-bold text-slate-100">
                      {question.title}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <span
                          key={option.id}
                          className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
                        >
                          {option.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <h3 className="font-black text-white">هدف‌گذاری</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                <p>
                  دپارتمان‌ها:{" "}
                  {viewingItem.targetDepartments.length
                    ? viewingItem.targetDepartments.join("، ")
                    : "همه"}
                </p>
                <p>
                  گروه‌های AD:{" "}
                  {viewingItem.targetAdGroupIds.length
                    ? viewingItem.targetAdGroupIds.join("، ")
                    : "همه"}
                </p>
                <p>
                  ویژگی‌ها:{" "}
                  {[
                    viewingItem.required ? "اجباری" : null,
                    viewingItem.popupEnforced ? "popup" : null,
                    viewingItem.allowLiveResults ? "نتایج زنده" : null,
                    viewingItem.allowVoteEditing ? "ویرایش پاسخ" : null,
                  ]
                    .filter(Boolean)
                    .join("، ") || "بدون ویژگی خاص"}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "polls" && (
        <PollSurveyTable
          items={polls}
          onEdit={loadItemIntoForm}
          onView={setViewingItem}
          onSelectReport={(id) => {
            setSelectedReportId(id);
            setActiveTab("reports");
          }}
        />
      )}

      {activeTab === "surveys" && (
        <PollSurveyTable
          items={surveys}
          onEdit={loadItemIntoForm}
          onView={setViewingItem}
          onSelectReport={(id) => {
            setSelectedReportId(id);
            setActiveTab("reports");
          }}
        />
      )}

      {activeTab === "create" && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5"
        >
          {editingItem && (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-100">
              در حال ویرایش: {editingItem.title}
              {editingHasResponses
                ? " - چون پاسخ ثبت شده، فیلدهای حساس مثل نوع، ناشناس بودن، سوال‌ها و گزینه‌ها قفل هستند."
                : " - هنوز پاسخی ثبت نشده و همه فیلدها قابل ویرایش هستند."}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <FormField label="نوع" required>
              {editingHasResponses ? (
                <div className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                  {typeLabel(type)}
                </div>
              ) : (
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as PollSurveyType)}
                  options={[
                    { value: "POLL", label: "رای‌گیری" },
                    { value: "SURVEY", label: "نظرسنجی" },
                  ]}
                />
              )}
            </FormField>
            <FormField label="عنوان" required>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </FormField>
            <FormField label="دسته‌بندی">
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="مثلا منابع انسانی"
              />
            </FormField>
          </div>

          <FormField label="توضیحات">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </FormField>

          <div className="grid gap-4 lg:grid-cols-3">
            <FormField label="وضعیت">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as PollSurveyStatus)}
                options={statusOptions}
              />
            </FormField>
            <FormField label="تاریخ انتشار">
              <Input
                type="datetime-local"
                value={publishDate}
                onChange={(event) => setPublishDate(event.target.value)}
              />
            </FormField>
            <FormField label="مهلت پایان">
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </FormField>
          </div>

          {type === "POLL" ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <FormField label="عنوان سوال" required>
                  <Input
                    value={questionTitle}
                    onChange={(event) => setQuestionTitle(event.target.value)}
                    placeholder="اگر خالی باشد عنوان اصلی استفاده می‌شود"
                    disabled={editingHasResponses}
                  />
                </FormField>
                <FormField label="نوع سوال">
                  <div className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                    {allowMultipleSelection ? "چند انتخابی" : "تک انتخابی"}
                  </div>
                </FormField>
              </div>

              <FormField label="گزینه‌ها" hint="هر گزینه در یک خط.">
                <textarea
                  value={optionsText}
                  onChange={(event) => setOptionsText(event.target.value)}
                  disabled={editingHasResponses}
                  className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder={"گزینه اول\nگزینه دوم\nگزینه سوم"}
                />
              </FormField>
            </>
          ) : (
            <section className="space-y-4 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">
                    سوال‌های نظرسنجی
                  </h2>
                  <p className="mt-1 text-xs leading-6 text-slate-400">
                    هر سوال در پرتال به صورت یک صفحه جدا نمایش داده می‌شود.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSurveyQuestion}
                  disabled={editingHasResponses}
                >
                  <Plus className="ml-2 h-4 w-4" />
                  افزودن سوال
                </Button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {surveyQuestions.map((question, index) => (
                  <motion.button
                    key={question.draftId}
                    type="button"
                    onClick={() => setActiveSurveyQuestionIndex(index)}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                    className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold transition ${
                      activeSurveyQuestionIndex === index
                        ? "border-cyan-300 bg-cyan-400/20 text-cyan-50"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    سوال {index + 1}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeSurveyQuestion && (
                  <motion.div
                    key={activeSurveyQuestion.draftId}
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, x: -18, filter: "blur(6px)" }
                    }
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={
                      reduceMotion
                        ? undefined
                        : { opacity: 0, x: 18, filter: "blur(6px)" }
                    }
                    transition={formMotionTransition}
                    className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="text-sm font-bold text-cyan-100">
                        صفحه {activeSurveyQuestionIndex + 1} از{" "}
                        {surveyQuestions.length}
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          removeSurveyQuestion(activeSurveyQuestion.draftId)
                        }
                        disabled={
                          editingHasResponses || surveyQuestions.length === 1
                        }
                      >
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف سوال
                      </Button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <FormField label="عنوان سوال" required>
                        <Input
                          value={activeSurveyQuestion.title}
                          onChange={(event) =>
                            updateSurveyQuestion(activeSurveyQuestion.draftId, {
                              title: event.target.value,
                            })
                          }
                          disabled={editingHasResponses}
                        />
                      </FormField>
                      <FormField label="نوع سوال">
                        {editingHasResponses ? (
                          <div className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                            {questionTypeOptions.find(
                              (item) =>
                                item.value === activeSurveyQuestion.type,
                            )?.label ?? activeSurveyQuestion.type}
                          </div>
                        ) : (
                          <Select
                            value={activeSurveyQuestion.type}
                            onValueChange={(value) =>
                              updateSurveyQuestion(
                                activeSurveyQuestion.draftId,
                                {
                                  type: value as PollSurveyQuestionType,
                                },
                              )
                            }
                            options={questionTypeOptions}
                          />
                        )}
                      </FormField>
                    </div>

                    <FormField label="توضیح سوال">
                      <Input
                        value={activeSurveyQuestion.description}
                        onChange={(event) =>
                          updateSurveyQuestion(activeSurveyQuestion.draftId, {
                            description: event.target.value,
                          })
                        }
                        disabled={editingHasResponses}
                      />
                    </FormField>

                    {questionNeedsOptions(activeSurveyQuestion.type) && (
                      <FormField
                        label="گزینه‌ها"
                        hint="هر گزینه در یک خط وارد شود."
                      >
                        <textarea
                          value={activeSurveyQuestion.optionsText}
                          onChange={(event) =>
                            updateSurveyQuestion(
                              activeSurveyQuestion.draftId,
                              {
                                optionsText: event.target.value,
                              },
                            )
                          }
                          disabled={editingHasResponses}
                          className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          placeholder={"گزینه اول\nگزینه دوم\nگزینه سوم"}
                        />
                      </FormField>
                    )}

                    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                      <span>پاسخ به این سوال اجباری باشد</span>
                      <input
                        type="checkbox"
                        checked={activeSurveyQuestion.isRequired}
                        disabled={editingHasResponses}
                        onChange={(event) =>
                          updateSurveyQuestion(activeSurveyQuestion.draftId, {
                            isRequired: event.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-cyan-400"
                      />
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <FormField label="تگ‌ها">
              <Input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="با کاما جدا کنید"
              />
            </FormField>
            <FormField label="دپارتمان‌های هدف">
              <Input
                value={targetDepartments}
                onChange={(event) => setTargetDepartments(event.target.value)}
                placeholder="مثلا IT,HR"
              />
            </FormField>
            <FormField label="گروه‌های AD هدف">
              <Input
                value={targetAdGroups}
                onChange={(event) => setTargetAdGroups(event.target.value)}
                placeholder="شناسه گروه‌ها، با کاما"
              />
            </FormField>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                checked: anonymous,
                onChange: setAnonymous,
                label: "ناشناس",
                disabled: editingHasResponses,
              },
              {
                checked: required,
                onChange: setRequired,
                label: "اجباری",
              },
              {
                checked: popupEnforced,
                onChange: setPopupEnforced,
                label: "نمایش popup اجباری",
              },
              {
                checked: allowMultipleSelection,
                onChange: setAllowMultipleSelection,
                label: "انتخاب چند گزینه",
                disabled: type !== "POLL" || editingHasResponses,
              },
              {
                checked: allowVoteEditing,
                onChange: setAllowVoteEditing,
                label: "امکان ویرایش پاسخ",
                disabled: editingHasResponses,
              },
              {
                checked: allowResultViewing,
                onChange: setAllowResultViewing,
                label: "نمایش نتایج",
              },
              {
                checked: allowParticipantCount,
                onChange: setAllowParticipantCount,
                label: "نمایش تعداد مشارکت",
              },
              {
                checked: allowLiveResults,
                onChange: setAllowLiveResults,
                label: "نتایج زنده",
              },
              {
                checked: participantVisibility,
                onChange: setParticipantVisibility,
                label: "نمایش شرکت‌کنندگان",
                disabled: anonymous || editingHasResponses,
              },
            ].map((item) => (
              <label
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200"
              >
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled={item.disabled}
                  onChange={(event) => item.onChange(event.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={
                createPollSurvey.isPending || updatePollSurvey.isPending
              }
            >
              <CheckSquare className="ml-2 h-4 w-4" />
              {editingItem ? "ذخیره ویرایش" : "ذخیره"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              پاک کردن فرم
            </Button>
          </div>
        </form>
      )}

      {activeTab === "reports" && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">گزارش سریع</h2>
              <p className="mt-1 text-sm text-slate-400">
                نمودارها، نرخ مشارکت، میانگین پاسخ‌ها و خروجی CSV.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={selectedReportId ?? "__none__"}
                onValueChange={(value) =>
                  setSelectedReportId(value === "__none__" ? undefined : value)
                }
                options={[
                  { value: "__none__", label: "انتخاب مورد" },
                  ...items.map((item) => ({
                    value: item.id,
                    label: `${typeLabel(item.type)} - ${item.title}`,
                  })),
                ]}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!selectedReport}
                onClick={() => selectedReport && exportReportCsv(selectedReport)}
              >
                <Download className="ml-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {selectedReport ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-sm text-slate-400">کل پاسخ‌ها</div>
                  <div className="mt-2 text-3xl font-black text-cyan-100">
                    {selectedReport.totalResponses}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-sm text-slate-400">نوع</div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {typeLabel(selectedReport.type)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-sm text-slate-400">سوال‌ها</div>
                  <div className="mt-2 text-3xl font-black text-emerald-100">
                    {selectedReport.questions.length}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="text-sm text-slate-400">نرخ مشارکت</div>
                  <div className="mt-2 text-2xl font-black text-amber-100">
                    {selectedReport.participationRate !== null
                      ? formatPercent(selectedReport.participationRate)
                      : "نیازمند AD"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-4 text-sm leading-7 text-amber-50">
                گزارش تفکیک دپارتمان، گروه AD و نرخ مشارکت دقیق بعد از اتصال
                کاربران واقعی و گروه‌ها فعال می‌شود. فعلا داده ساختگی نشان داده
                نمی‌شود تا گزارش مدیریتی گمراه‌کننده نباشد.
              </div>

              {selectedReportItem?.anonymous && (
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm leading-7 text-cyan-50">
                  این مورد ناشناس است؛ گزارش فقط شمارش و آمار تجمیعی را نمایش
                  می‌دهد و هویت پاسخ‌دهندگان قابل استخراج نیست.
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-2">
                {selectedReport.questions.map((question, questionIndex) => {
                  const maxCount = Math.max(
                    ...question.options.map((option) => option.count),
                    1,
                  );
                  const totalOptionVotes = question.options.reduce(
                    (sum, option) => sum + option.count,
                    0,
                  );
                  const leadingOption = [...question.options].sort(
                    (a, b) => b.count - a.count,
                  )[0];

                  return (
                    <motion.div
                      key={question.id}
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, y: 14, filter: "blur(6px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 0.18, delay: questionIndex * 0.04 }
                      }
                      className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="font-bold text-white">
                            {question.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {question.totalAnswers} پاسخ ثبت شده
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                          <PieChart className="h-3.5 w-3.5" />
                          {question.type}
                        </span>
                      </div>

                      {question.options.length > 0 && (
                        <div className="mt-4 grid gap-4 lg:grid-cols-[160px_1fr]">
                          <div className="grid place-items-center">
                            <div
                              className="grid size-32 place-items-center rounded-full border border-cyan-300/20"
                              style={{
                                background: `conic-gradient(#22d3ee ${totalOptionVotes ? ((leadingOption?.count ?? 0) / totalOptionVotes) * 360 : 0}deg, rgba(15, 23, 42, 0.8) 0deg)`,
                              }}
                            >
                              <div className="grid size-20 place-items-center rounded-full bg-slate-950 text-center">
                                <span className="text-xs text-slate-400">
                                  گزینه برتر
                                </span>
                                <span className="text-lg font-black text-cyan-100">
                                  {totalOptionVotes
                                    ? formatPercent(
                                        ((leadingOption?.count ?? 0) /
                                          totalOptionVotes) *
                                          100,
                                      )
                                    : "۰٪"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {question.options.map((option) => {
                              const percent = selectedReport.totalResponses
                                ? (option.count /
                                    selectedReport.totalResponses) *
                                  100
                                : 0;

                              return (
                                <div key={option.id}>
                                  <div className="mb-1 flex justify-between gap-3 text-xs text-slate-300">
                                    <span>{option.label}</span>
                                    <span>
                                      {option.count} - {formatPercent(percent)}
                                    </span>
                                  </div>
                                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                                    <motion.div
                                      className="h-full rounded-full bg-cyan-400"
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${(option.count / maxCount) * 100}%`,
                                      }}
                                      transition={
                                        reduceMotion
                                          ? { duration: 0 }
                                          : { duration: 0.35, ease: "easeOut" }
                                      }
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {question.average !== null && (
                        <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/10 p-3 text-sm text-amber-50">
                          میانگین پاسخ: {question.average.toFixed(1)}
                        </div>
                      )}

                      {question.textAnswers.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-sm font-bold text-slate-200">
                            پاسخ‌های متنی
                          </div>
                          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                            {question.textAnswers.map((answer, index) => (
                              <div
                                key={`${question.id}-${index}`}
                                className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-7 text-slate-200"
                              >
                                {answer}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {question.options.length === 0 &&
                        question.average === null &&
                        question.textAnswers.length === 0 && (
                          <div className="mt-4 rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-slate-400">
                            هنوز داده قابل نمایش برای این سوال ثبت نشده است.
                          </div>
                        )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
              یک رای‌گیری یا نظرسنجی را انتخاب کنید.
            </div>
          )}
        </section>
      )}
    </main>
  );
}
