"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarRange,
  GraduationCap,
  ListChecks,
  Plus,
  Settings2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { FormField } from "@/components/ui/FormField";
import { IconPicker } from "@/components/ui/IconPicker";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  useAdminTrainingCategories,
  useAdminInPersonTrainings,
  useAdminTrainingSources,
  useAdminTrainings,
  useCreateInPersonParticipant,
  useCreateInPersonTraining,
  useCreateTrainingCategory,
  useCreateTrainingItem,
  useCreateTrainingSource,
  useDeleteInPersonParticipant,
  useDeleteInPersonTraining,
  useDeleteTrainingCategory,
  useDeleteTrainingItem,
  useDeleteTrainingSource,
  useUpdateInPersonParticipant,
  useUpdateInPersonTraining,
  useUpdateTrainingCategory,
  useUpdateTrainingItem,
  useUpdateTrainingSource,
} from "@/hooks/useTrainings";
import type {
  InPersonAttendanceStatus,
  InPersonTraining,
  InPersonTrainingParticipant,
  InPersonTrainingResult,
  InPersonTrainingStatus,
  TrainingCategory,
  TrainingContentType,
  TrainingFile,
  TrainingItem,
  TrainingPublishStatus,
  TrainingSource,
} from "@/lib/trainings";

type TrainingTab =
  "create" | "list" | "settings" | "users" | "courses" | "reports";

const contentTypeOptions = [
  { value: "VIDEO", label: "ویدیو" },
  { value: "PDF", label: "PDF" },
  { value: "DOCUMENT", label: "Word / سند" },
  { value: "SPREADSHEET", label: "Excel / جدول" },
  { value: "PRESENTATION", label: "PowerPoint" },
  { value: "IMAGE", label: "تصویر" },
  { value: "LINK", label: "لینک خارجی" },
  { value: "ATTACHMENT", label: "پیوست" },
];

const statusOptions = [
  { value: "NEEDS_REVIEW", label: "نیازمند بررسی" },
  { value: "DRAFT", label: "پیش‌نویس" },
  { value: "PUBLISHED", label: "منتشر شده" },
  { value: "ARCHIVED", label: "آرشیو" },
];

const courseStatusOptions: Array<{
  value: InPersonTrainingStatus;
  label: string;
}> = [
  { value: "PLANNED", label: "برنامه‌ریزی شده" },
  { value: "OPEN", label: "ثبت‌نام باز" },
  { value: "CLOSED", label: "ثبت‌نام بسته" },
  { value: "CANCELLED", label: "لغو شده" },
  { value: "COMPLETED", label: "برگزار شده" },
];

const attendanceOptions: Array<{
  value: InPersonAttendanceStatus;
  label: string;
}> = [
  { value: "REGISTERED", label: "ثبت‌نام شده" },
  { value: "ATTENDED", label: "حاضر" },
  { value: "ABSENT", label: "غایب" },
  { value: "EXCUSED", label: "موجه" },
];

const resultOptions: Array<{ value: InPersonTrainingResult; label: string }> = [
  { value: "NO_EXAM", label: "بدون آزمون" },
  { value: "PASSED", label: "قبول" },
  { value: "FAILED", label: "مردود" },
];

const trainingTabs: Array<{
  id: TrainingTab;
  label: string;
  icon: typeof Plus;
}> = [
  { id: "create", label: "افزودن آموزش", icon: Plus },
  { id: "list", label: "لیست آموزش‌ها", icon: ListChecks },
  { id: "settings", label: "تنظیمات", icon: Settings2 },
  { id: "users", label: "کاربران", icon: Users },
  { id: "courses", label: "دوره‌ها", icon: CalendarRange },
  { id: "reports", label: "گزارش‌ها", icon: BarChart3 },
];

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tagsToArray(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatCourseDate(value?: string | null) {
  if (!value) return "ثبت نشده";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TrainingsPage() {
  const { data: trainings = [] } = useAdminTrainings();
  const { data: categories = [] } = useAdminTrainingCategories();
  const { data: sources = [] } = useAdminTrainingSources();
  const { data: inPersonTrainings = [] } = useAdminInPersonTrainings();
  const createTraining = useCreateTrainingItem();
  const updateTraining = useUpdateTrainingItem();
  const deleteTraining = useDeleteTrainingItem();
  const createInPersonTraining = useCreateInPersonTraining();
  const updateInPersonTraining = useUpdateInPersonTraining();
  const deleteInPersonTraining = useDeleteInPersonTraining();
  const createInPersonParticipant = useCreateInPersonParticipant();
  const updateInPersonParticipant = useUpdateInPersonParticipant();
  const deleteInPersonParticipant = useDeleteInPersonParticipant();
  const createCategory = useCreateTrainingCategory();
  const updateCategory = useUpdateTrainingCategory();
  const deleteCategory = useDeleteTrainingCategory();
  const createSource = useCreateTrainingSource();
  const updateSource = useUpdateTrainingSource();
  const deleteSource = useDeleteTrainingSource();
  const [activeTab, setActiveTab] = useState<TrainingTab>("list");

  const [editingTraining, setEditingTraining] = useState<TrainingItem | null>(
    null,
  );
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState<TrainingContentType>("VIDEO");
  const [categoryId, setCategoryId] = useState("__none__");
  const [files, setFiles] = useState<Array<Omit<TrainingFile, "id">>>([]);
  const [newFileTitle, setNewFileTitle] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newFileType, setNewFileType] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [instructor, setInstructor] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [tags, setTags] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState<TrainingPublishStatus>("DRAFT");

  const [editingCategory, setEditingCategory] =
    useState<TrainingCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("GraduationCap");
  const [categoryColor, setCategoryColor] = useState("#22d3ee");
  const [categorySortOrder, setCategorySortOrder] = useState("0");
  const [categoryIsActive, setCategoryIsActive] = useState(true);

  const [editingSource, setEditingSource] = useState<TrainingSource | null>(
    null,
  );
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState("SMB");
  const [sourceBasePath, setSourceBasePath] = useState("");
  const [sourceDescription, setSourceDescription] = useState("");
  const [sourceUsername, setSourceUsername] = useState("");
  const [sourcePassword, setSourcePassword] = useState("");
  const [sourceIsActive, setSourceIsActive] = useState(false);

  const [editingCourse, setEditingCourse] = useState<InPersonTraining | null>(
    null,
  );
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseCategoryId, setCourseCategoryId] = useState("__none__");
  const [courseInstructorName, setCourseInstructorName] = useState("");
  const [courseOrganizerDepartment, setCourseOrganizerDepartment] =
    useState("");
  const [courseLocation, setCourseLocation] = useState("");
  const [courseStartDate, setCourseStartDate] = useState("");
  const [courseEndDate, setCourseEndDate] = useState("");
  const [courseDurationHours, setCourseDurationHours] = useState("");
  const [courseHasExam, setCourseHasExam] = useState(false);
  const [courseHasCertificate, setCourseHasCertificate] = useState(false);
  const [courseStatus, setCourseStatus] =
    useState<InPersonTrainingStatus>("PLANNED");

  const [editingParticipant, setEditingParticipant] =
    useState<InPersonTrainingParticipant | null>(null);
  const [participantTrainingId, setParticipantTrainingId] = useState("");
  const [participantDisplayName, setParticipantDisplayName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantAttendanceStatus, setParticipantAttendanceStatus] =
    useState<InPersonAttendanceStatus>("REGISTERED");
  const [participantScore, setParticipantScore] = useState("");
  const [participantResult, setParticipantResult] =
    useState<InPersonTrainingResult>("NO_EXAM");
  const [participantCertificateNumber, setParticipantCertificateNumber] =
    useState("");
  const [participantNotes, setParticipantNotes] = useState("");

  function resetTrainingForm() {
    setEditingTraining(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setContentType("VIDEO");
    setCategoryId("__none__");
    setFiles([]);
    setNewFileTitle("");
    setNewFileUrl("");
    setNewFileType("");
    setExternalUrl("");
    setThumbnail("");
    setInstructor("");
    setDepartment("");
    setLevel("");
    setDurationMinutes("");
    setTags("");
    setIsRequired(false);
    setIsActive(true);
    setStatus("DRAFT");
  }

  function startEditTraining(item: TrainingItem) {
    setActiveTab("create");
    setEditingTraining(item);
    setTitle(item.title);
    setSlug(item.slug);
    setDescription(item.description ?? "");
    setContentType(item.contentType);
    setCategoryId(item.categoryId ?? "__none__");
    setFiles(
      item.files.length > 0
        ? item.files.map((file) => ({
            title: file.title,
            fileUrl: file.fileUrl,
            fileType: file.fileType ?? undefined,
            fileSize: file.fileSize ?? undefined,
            sortOrder: file.sortOrder,
            isPrimary: file.isPrimary,
          }))
        : item.fileUrl
          ? [
              {
                title: item.title,
                fileUrl: item.fileUrl,
                fileType: item.contentType,
                sortOrder: 0,
                isPrimary: true,
              },
            ]
          : [],
    );
    setNewFileTitle("");
    setNewFileUrl("");
    setNewFileType("");
    setExternalUrl(item.externalUrl ?? "");
    setThumbnail(item.thumbnail ?? "");
    setInstructor(item.instructor ?? "");
    setDepartment(item.department ?? "");
    setLevel(item.level ?? "");
    setDurationMinutes(String(item.durationMinutes ?? ""));
    setTags(item.tags.join(", "));
    setIsRequired(item.isRequired);
    setIsActive(item.isActive);
    setStatus(item.status);
  }

  async function submitTraining(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    const dto = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      contentType,
      sourceType: "PORTAL_UPLOAD",
      fileUrl:
        files.find((file) => file.isPrimary)?.fileUrl || files[0]?.fileUrl,
      externalUrl: externalUrl.trim() || undefined,
      thumbnail: thumbnail.trim() || undefined,
      instructor: instructor.trim() || undefined,
      department: department.trim() || undefined,
      level: level.trim() || undefined,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      tags: tagsToArray(tags),
      isRequired,
      isActive,
      status,
      categoryId: categoryId === "__none__" ? null : categoryId,
      files: files.map((file, index) => ({
        ...file,
        sortOrder: index,
        isPrimary: file.isPrimary || index === 0,
      })),
    };

    if (editingTraining) {
      await updateTraining.mutateAsync({
        id: editingTraining.id,
        dto,
      });
    } else {
      await createTraining.mutateAsync(dto);
    }

    resetTrainingForm();
    setActiveTab("list");
  }

  function addTrainingFile() {
    if (!newFileUrl.trim()) return;

    setFiles((current) => [
      ...current,
      {
        title: newFileTitle.trim() || `فایل ${current.length + 1}`,
        fileUrl: newFileUrl.trim(),
        fileType: newFileType.trim() || contentType,
        sortOrder: current.length,
        isPrimary: current.length === 0,
      },
    ]);
    setNewFileTitle("");
    setNewFileUrl("");
    setNewFileType("");
  }

  function removeTrainingFile(index: number) {
    setFiles((current) =>
      current
        .filter((_, fileIndex) => fileIndex !== index)
        .map((file, fileIndex) => ({
          ...file,
          sortOrder: fileIndex,
          isPrimary: fileIndex === 0 ? true : file.isPrimary,
        })),
    );
  }

  function setPrimaryTrainingFile(index: number) {
    setFiles((current) =>
      current.map((file, fileIndex) => ({
        ...file,
        isPrimary: fileIndex === index,
      })),
    );
  }

  function resetCategoryForm() {
    setEditingCategory(null);
    setCategoryName("");
    setCategorySlug("");
    setCategoryDescription("");
    setCategoryIcon("GraduationCap");
    setCategoryColor("#22d3ee");
    setCategorySortOrder("0");
    setCategoryIsActive(true);
  }

  function startEditCategory(category: TrainingCategory) {
    setActiveTab("settings");
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategorySlug(category.slug);
    setCategoryDescription(category.description ?? "");
    setCategoryIcon(category.icon ?? "GraduationCap");
    setCategoryColor(category.color ?? "#22d3ee");
    setCategorySortOrder(String(category.sortOrder ?? 0));
    setCategoryIsActive(category.isActive);
  }

  async function submitCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!categoryName.trim() || !categorySlug.trim()) return;

    const dto = {
      name: categoryName.trim(),
      slug: categorySlug.trim(),
      description: categoryDescription.trim() || undefined,
      icon: categoryIcon,
      color: categoryColor,
      sortOrder: Number(categorySortOrder) || 0,
      isActive: categoryIsActive,
    };

    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        dto,
      });
    } else {
      await createCategory.mutateAsync(dto);
    }

    resetCategoryForm();
  }

  function resetSourceForm() {
    setEditingSource(null);
    setSourceName("");
    setSourceType("SMB");
    setSourceBasePath("");
    setSourceDescription("");
    setSourceUsername("");
    setSourcePassword("");
    setSourceIsActive(false);
  }

  function startEditSource(source: TrainingSource) {
    setActiveTab("settings");
    setEditingSource(source);
    setSourceName(source.name);
    setSourceType(source.type);
    setSourceBasePath(source.basePath);
    setSourceDescription(source.description ?? "");
    setSourceUsername(source.username ?? "");
    setSourcePassword("");
    setSourceIsActive(source.isActive);
  }

  async function submitSource(event: React.FormEvent) {
    event.preventDefault();
    if (!sourceName.trim() || !sourceBasePath.trim()) return;

    const dto = {
      name: sourceName.trim(),
      type: sourceType.trim() || "SMB",
      basePath: sourceBasePath.trim(),
      description: sourceDescription.trim() || undefined,
      username: sourceUsername.trim() || undefined,
      password: sourcePassword.trim() || undefined,
      isActive: sourceIsActive,
    };

    if (editingSource) {
      await updateSource.mutateAsync({
        id: editingSource.id,
        dto,
      });
    } else {
      await createSource.mutateAsync(dto);
    }

    resetSourceForm();
  }

  function resetCourseForm() {
    setEditingCourse(null);
    setCourseTitle("");
    setCourseDescription("");
    setCourseCategoryId("__none__");
    setCourseInstructorName("");
    setCourseOrganizerDepartment("");
    setCourseLocation("");
    setCourseStartDate("");
    setCourseEndDate("");
    setCourseDurationHours("");
    setCourseHasExam(false);
    setCourseHasCertificate(false);
    setCourseStatus("PLANNED");
  }

  function startEditCourse(course: InPersonTraining) {
    setActiveTab("courses");
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseDescription(course.description ?? "");
    setCourseCategoryId(course.categoryId ?? "__none__");
    setCourseInstructorName(course.instructorName ?? "");
    setCourseOrganizerDepartment(course.organizerDepartment ?? "");
    setCourseLocation(course.location ?? "");
    setCourseStartDate(toDateTimeLocal(course.startDate));
    setCourseEndDate(toDateTimeLocal(course.endDate));
    setCourseDurationHours(String(course.durationHours ?? ""));
    setCourseHasExam(course.hasExam);
    setCourseHasCertificate(course.hasCertificate);
    setCourseStatus(course.status);
  }

  async function submitCourse(event: React.FormEvent) {
    event.preventDefault();
    if (!courseTitle.trim() || !courseStartDate) return;

    const dto = {
      title: courseTitle.trim(),
      description: courseDescription.trim() || undefined,
      categoryId: courseCategoryId === "__none__" ? null : courseCategoryId,
      instructorName: courseInstructorName.trim() || undefined,
      organizerDepartment: courseOrganizerDepartment.trim() || undefined,
      location: courseLocation.trim() || undefined,
      startDate: new Date(courseStartDate).toISOString(),
      endDate: courseEndDate ? new Date(courseEndDate).toISOString() : null,
      durationHours: courseDurationHours
        ? Number(courseDurationHours)
        : undefined,
      hasExam: courseHasExam,
      hasCertificate: courseHasCertificate,
      status: courseStatus,
    };

    if (editingCourse) {
      await updateInPersonTraining.mutateAsync({
        id: editingCourse.id,
        dto,
      });
    } else {
      await createInPersonTraining.mutateAsync(dto);
    }

    resetCourseForm();
  }

  function resetParticipantForm() {
    setEditingParticipant(null);
    setParticipantTrainingId("");
    setParticipantDisplayName("");
    setParticipantEmail("");
    setParticipantAttendanceStatus("REGISTERED");
    setParticipantScore("");
    setParticipantResult("NO_EXAM");
    setParticipantCertificateNumber("");
    setParticipantNotes("");
  }

  function startEditParticipant(
    course: InPersonTraining,
    participant: InPersonTrainingParticipant,
  ) {
    setParticipantTrainingId(course.id);
    setEditingParticipant(participant);
    setParticipantDisplayName(participant.displayName);
    setParticipantEmail(participant.email ?? "");
    setParticipantAttendanceStatus(participant.attendanceStatus);
    setParticipantScore(String(participant.score ?? ""));
    setParticipantResult(participant.result);
    setParticipantCertificateNumber(participant.certificateNumber ?? "");
    setParticipantNotes(participant.notes ?? "");
  }

  async function submitParticipant(event: React.FormEvent) {
    event.preventDefault();
    if (!participantTrainingId || !participantDisplayName.trim()) return;

    const dto = {
      displayName: participantDisplayName.trim(),
      email: participantEmail.trim() || undefined,
      attendanceStatus: participantAttendanceStatus,
      score: participantScore ? Number(participantScore) : undefined,
      result: participantResult,
      certificateNumber: participantCertificateNumber.trim() || undefined,
      notes: participantNotes.trim() || undefined,
    };

    if (editingParticipant) {
      await updateInPersonParticipant.mutateAsync({
        id: editingParticipant.id,
        dto,
      });
    } else {
      await createInPersonParticipant.mutateAsync({
        trainingId: participantTrainingId,
        dto,
      });
    }

    resetParticipantForm();
  }

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center justify-end gap-3">
            <h1 className="text-3xl font-black text-white">مدیریت آموزش</h1>
            <span className="grid size-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
              <GraduationCap size={24} />
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            این فاز پایه LMS است: دسته‌های آموزشی، محتوای آموزشی، فایل/لینک،
            وضعیت انتشار و آماده‌سازی برای SMB Sync و پیشرفت کاربران.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
        {trainingTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                active
                  ? "bg-cyan-400/15 text-cyan-100"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "create" && (
        <div className="grid gap-6">
          <form
            onSubmit={submitTraining}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">
                {editingTraining ? "ویرایش آموزش" : "افزودن آموزش"}
              </h2>
              {!editingTraining && <Plus size={20} className="text-cyan-200" />}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="عنوان" required>
                <Input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (!editingTraining) setSlug(toSlug(event.target.value));
                  }}
                />
              </FormField>
              <FormField label="شناسه / Slug" required>
                <Input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                />
              </FormField>
              <FormField label="دسته آموزشی">
                <Select
                  value={categoryId}
                  onValueChange={setCategoryId}
                  options={[
                    { value: "__none__", label: "بدون دسته" },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
              </FormField>
              <FormField label="نوع محتوا">
                <Select
                  value={contentType}
                  onValueChange={(value) =>
                    setContentType(value as TrainingContentType)
                  }
                  options={contentTypeOptions}
                />
              </FormField>
              <FormField label="وضعیت انتشار">
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as TrainingPublishStatus)
                  }
                  options={statusOptions}
                />
              </FormField>
              <FormField label="مدت زمان - دقیقه">
                <Input
                  type="number"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                />
              </FormField>
              <FormField label="مدرس">
                <Input
                  value={instructor}
                  onChange={(event) => setInstructor(event.target.value)}
                />
              </FormField>
              <FormField label="دپارتمان">
                <Input
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                />
              </FormField>
              <FormField label="سطح">
                <Input
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                />
              </FormField>
              <FormField label="تگ‌ها - با کاما جدا کنید">
                <Input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </FormField>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="font-black text-white">فایل‌های آموزش</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="عنوان فایل">
                  <Input
                    value={newFileTitle}
                    onChange={(event) => setNewFileTitle(event.target.value)}
                    placeholder="مثلا ویدیوی جلسه اول"
                  />
                </FormField>
                <FormField label="نوع فایل">
                  <Input
                    value={newFileType}
                    onChange={(event) => setNewFileType(event.target.value)}
                    placeholder="mp4, pdf, pptx ..."
                  />
                </FormField>
                <FormField label="فایل یا لینک">
                  <FileUploadField
                    value={newFileUrl}
                    onChange={setNewFileUrl}
                    folder="training"
                    accept="video/*,image/*,.pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.mp4,.mkv,.webm,.mov,.avi,.jpg,.jpeg,.png,.webp,.gif"
                    placeholder="/uploads/training/course.mp4 یا https://..."
                  />
                </FormField>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addTrainingFile}
              >
                افزودن فایل به آموزش
              </Button>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.fileUrl}-${index}`}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{file.title}</div>
                      <div className="mt-1 break-all text-xs text-slate-400">
                        {file.fileType || "file"} · {file.fileUrl}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={file.isPrimary ? "primary" : "outline"}
                        onClick={() => setPrimaryTrainingFile(index)}
                      >
                        فایل اصلی
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => removeTrainingFile(index)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                    هنوز فایلی برای این آموزش اضافه نشده است.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="تصویر شاخص">
                <FileUploadField
                  value={thumbnail}
                  onChange={setThumbnail}
                  folder="training"
                  accept="image/*"
                  placeholder="/uploads/training/thumb.webp"
                />
              </FormField>
            </div>

            <FormField label="لینک خارجی">
              <Input
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
                placeholder="https://..."
              />
            </FormField>

            <FormField label="توضیحات">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
            </FormField>

            <div className="flex flex-wrap gap-5 text-sm text-slate-200">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(event) => setIsRequired(event.target.checked)}
                />
                آموزش اجباری است
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
                فعال باشد
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={createTraining.isPending || updateTraining.isPending}
              >
                {editingTraining ? "ذخیره آموزش" : "افزودن آموزش"}
              </Button>
              {editingTraining && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetTrainingForm}
                >
                  انصراف
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <form
            onSubmit={submitCategory}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <h2 className="text-xl font-black">
              {editingCategory ? "ویرایش دسته آموزشی" : "افزودن دسته آموزشی"}
            </h2>
            <FormField label="نام دسته" required>
              <Input
                value={categoryName}
                onChange={(event) => {
                  setCategoryName(event.target.value);
                  if (!editingCategory)
                    setCategorySlug(toSlug(event.target.value));
                }}
              />
            </FormField>
            <FormField label="Slug" required>
              <Input
                value={categorySlug}
                onChange={(event) => setCategorySlug(event.target.value)}
              />
            </FormField>
            <FormField label="آیکن دسته">
              <IconPicker
                value={categoryIcon}
                onChange={setCategoryIcon}
                folder="icons"
                disabled={createCategory.isPending || updateCategory.isPending}
              />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <FormField label="رنگ">
                <Input
                  value={categoryColor}
                  onChange={(event) => setCategoryColor(event.target.value)}
                />
              </FormField>
              <FormField label="ترتیب نمایش">
                <Input
                  type="number"
                  value={categorySortOrder}
                  onChange={(event) => setCategorySortOrder(event.target.value)}
                />
              </FormField>
            </div>
            <FormField label="توضیحات">
              <textarea
                value={categoryDescription}
                onChange={(event) => setCategoryDescription(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoryIsActive}
                onChange={(event) => setCategoryIsActive(event.target.checked)}
              />
              دسته فعال باشد
            </label>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {editingCategory ? "ذخیره دسته" : "افزودن دسته"}
              </Button>
              {editingCategory && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetCategoryForm}
                >
                  انصراف
                </Button>
              )}
            </div>
          </form>

          <form
            onSubmit={submitSource}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <h2 className="text-xl font-black">
              {editingSource ? "ویرایش سرور آموزش" : "افزودن سرور آموزش"}
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              این بخش برای ثبت مسیر فایل‌های آموزشی قبلی است. sync خودکار بعدا
              با مسیر و دسترسی واقعی شرکت فعال می‌شود.
            </p>
            <FormField label="نام منبع" required>
              <Input
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                placeholder="مثلا فایل‌سرور آموزش"
              />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <FormField label="نوع منبع">
                <Input
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value)}
                  placeholder="SMB"
                />
              </FormField>
              <FormField label="مسیر منبع" required>
                <Input
                  value={sourceBasePath}
                  onChange={(event) => setSourceBasePath(event.target.value)}
                  placeholder="/mnt/agtps-training یا \\\\server\\training"
                />
              </FormField>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <FormField label="نام کاربری">
                <Input
                  value={sourceUsername}
                  onChange={(event) => setSourceUsername(event.target.value)}
                />
              </FormField>
              <FormField label="رمز عبور">
                <Input
                  type="password"
                  value={sourcePassword}
                  onChange={(event) => setSourcePassword(event.target.value)}
                  placeholder={editingSource ? "برای حفظ رمز خالی بگذارید" : ""}
                />
              </FormField>
            </div>
            <FormField label="توضیحات">
              <textarea
                value={sourceDescription}
                onChange={(event) => setSourceDescription(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sourceIsActive}
                onChange={(event) => setSourceIsActive(event.target.checked)}
              />
              منبع فعال باشد
            </label>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={createSource.isPending || updateSource.isPending}
              >
                {editingSource ? "ذخیره منبع" : "افزودن منبع"}
              </Button>
              {editingSource && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetSourceForm}
                >
                  انصراف
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === "list" && (
        <DataTable
          data={trainings}
          columns={[
            {
              key: "title",
              title: "آموزش",
              render: (item) => (
                <div>
                  <div className="font-black">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {item.category?.name || "بدون دسته"} · {item.contentType}
                  </div>
                </div>
              ),
            },
            {
              key: "status",
              title: "وضعیت",
              render: (item) => (
                <div className="space-y-1">
                  <div>
                    {
                      statusOptions.find(
                        (option) => option.value === item.status,
                      )?.label
                    }
                  </div>
                  <div className="text-xs text-slate-400">
                    {item.isRequired ? "اجباری" : "اختیاری"} ·{" "}
                    {item.isActive ? "فعال" : "غیرفعال"}
                  </div>
                </div>
              ),
            },
            {
              key: "meta",
              title: "جزئیات",
              render: (item) => (
                <div className="text-sm leading-7 text-slate-300">
                  {item.instructor || "بدون مدرس"} ·{" "}
                  {item.department || "بدون دپارتمان"}
                  <br />
                  {item.durationMinutes
                    ? `${item.durationMinutes} دقیقه`
                    : "بدون زمان"}{" "}
                  · {item.files.length} فایل
                </div>
              ),
            },
            {
              key: "actions",
              title: "عملیات",
              render: (item) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => startEditTraining(item)}
                  >
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteTraining.mutate(item.id)}
                  >
                    حذف
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {activeTab === "settings" && (
        <>
          <DataTable
            data={categories}
            columns={[
              { key: "name", title: "دسته" },
              { key: "slug", title: "Slug" },
              {
                key: "isActive",
                title: "وضعیت",
                render: (category) => (category.isActive ? "فعال" : "غیرفعال"),
              },
              {
                key: "actions",
                title: "عملیات",
                render: (category) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => startEditCategory(category)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteCategory.mutate(category.id)}
                    >
                      حذف
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          <DataTable
            data={sources}
            columns={[
              {
                key: "name",
                title: "سرور آموزش",
                render: (source) => (
                  <div>
                    <div className="font-black">{source.name}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {source.type} · {source.isActive ? "فعال" : "غیرفعال"}
                    </div>
                  </div>
                ),
              },
              {
                key: "basePath",
                title: "مسیر",
                render: (source) => (
                  <span className="break-all font-mono text-xs text-slate-300">
                    {source.basePath}
                  </span>
                ),
              },
              {
                key: "lastSyncStatus",
                title: "Sync",
                render: (source) =>
                  source.lastSyncStatus || "هنوز sync اجرا نشده است",
              },
              {
                key: "actions",
                title: "عملیات",
                render: (source) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => startEditSource(source)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteSource.mutate(source.id)}
                    >
                      حذف
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </>
      )}

      {activeTab === "users" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-black text-white">کاربران آموزش</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            در فاز بعد، پیشرفت کاربران، آموزش‌های اجباری، گروه‌های اکتیو
            دایرکتوری و سوابق آموزشی هر نفر در این بخش مدیریت می‌شود.
          </p>
        </div>
      )}

      {activeTab === "courses" && (
        <div className="grid gap-6">
          <form
            onSubmit={submitCourse}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-black text-white">
                {editingCourse ? "ویرایش دوره حضوری" : "افزودن دوره حضوری"}
              </h2>
              {editingCourse && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetCourseForm}
                >
                  انصراف از ویرایش
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="عنوان دوره" required>
                <Input
                  value={courseTitle}
                  onChange={(event) => setCourseTitle(event.target.value)}
                />
              </FormField>
              <FormField label="دسته آموزشی">
                <Select
                  value={courseCategoryId}
                  onValueChange={setCourseCategoryId}
                  options={[
                    { value: "__none__", label: "بدون دسته" },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
              </FormField>
              <FormField label="وضعیت">
                <Select
                  value={courseStatus}
                  onValueChange={(value) =>
                    setCourseStatus(value as InPersonTrainingStatus)
                  }
                  options={courseStatusOptions}
                />
              </FormField>
              <FormField label="مدرس">
                <Input
                  value={courseInstructorName}
                  onChange={(event) =>
                    setCourseInstructorName(event.target.value)
                  }
                />
              </FormField>
              <FormField label="واحد برگزارکننده">
                <Input
                  value={courseOrganizerDepartment}
                  onChange={(event) =>
                    setCourseOrganizerDepartment(event.target.value)
                  }
                />
              </FormField>
              <FormField label="محل برگزاری">
                <Input
                  value={courseLocation}
                  onChange={(event) => setCourseLocation(event.target.value)}
                />
              </FormField>
              <FormField label="شروع دوره" required>
                <Input
                  type="datetime-local"
                  value={courseStartDate}
                  onChange={(event) => setCourseStartDate(event.target.value)}
                />
              </FormField>
              <FormField label="پایان دوره">
                <Input
                  type="datetime-local"
                  value={courseEndDate}
                  onChange={(event) => setCourseEndDate(event.target.value)}
                />
              </FormField>
              <FormField label="مدت دوره / ساعت">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={courseDurationHours}
                  onChange={(event) =>
                    setCourseDurationHours(event.target.value)
                  }
                />
              </FormField>
            </div>

            <FormField label="توضیحات">
              <textarea
                value={courseDescription}
                onChange={(event) => setCourseDescription(event.target.value)}
                className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={courseHasExam}
                  onChange={(event) => setCourseHasExam(event.target.checked)}
                />
                آزمون دارد
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={courseHasCertificate}
                  onChange={(event) =>
                    setCourseHasCertificate(event.target.checked)
                  }
                />
                گواهی دارد
              </label>
            </div>

            <Button
              type="submit"
              disabled={
                createInPersonTraining.isPending ||
                updateInPersonTraining.isPending
              }
            >
              {editingCourse ? "ذخیره دوره" : "افزودن دوره"}
            </Button>
          </form>

          <form
            onSubmit={submitParticipant}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-black text-white">
                {editingParticipant ? "ویرایش شرکت‌کننده" : "افزودن شرکت‌کننده"}
              </h2>
              {editingParticipant && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetParticipantForm}
                >
                  انصراف از ویرایش
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="دوره" required>
                <Select
                  value={participantTrainingId}
                  onValueChange={setParticipantTrainingId}
                  placeholder="دوره را انتخاب کنید"
                  options={inPersonTrainings.map((course) => ({
                    value: course.id,
                    label: course.title,
                  }))}
                />
              </FormField>
              <FormField label="نام شرکت‌کننده" required>
                <Input
                  value={participantDisplayName}
                  onChange={(event) =>
                    setParticipantDisplayName(event.target.value)
                  }
                />
              </FormField>
              <FormField label="ایمیل">
                <Input
                  type="email"
                  value={participantEmail}
                  onChange={(event) => setParticipantEmail(event.target.value)}
                />
              </FormField>
              <FormField label="وضعیت حضور">
                <Select
                  value={participantAttendanceStatus}
                  onValueChange={(value) =>
                    setParticipantAttendanceStatus(
                      value as InPersonAttendanceStatus,
                    )
                  }
                  options={attendanceOptions}
                />
              </FormField>
              <FormField label="نمره">
                <Input
                  type="number"
                  min="0"
                  step="0.25"
                  value={participantScore}
                  onChange={(event) => setParticipantScore(event.target.value)}
                />
              </FormField>
              <FormField label="نتیجه">
                <Select
                  value={participantResult}
                  onValueChange={(value) =>
                    setParticipantResult(value as InPersonTrainingResult)
                  }
                  options={resultOptions}
                />
              </FormField>
              <FormField label="شماره گواهی">
                <Input
                  value={participantCertificateNumber}
                  onChange={(event) =>
                    setParticipantCertificateNumber(event.target.value)
                  }
                />
              </FormField>
            </div>

            <FormField label="یادداشت">
              <textarea
                value={participantNotes}
                onChange={(event) => setParticipantNotes(event.target.value)}
                className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </FormField>

            <Button
              type="submit"
              disabled={
                createInPersonParticipant.isPending ||
                updateInPersonParticipant.isPending
              }
            >
              {editingParticipant ? "ذخیره شرکت‌کننده" : "افزودن شرکت‌کننده"}
            </Button>
          </form>

          <DataTable
            data={inPersonTrainings}
            emptyMessage="هنوز دوره حضوری ثبت نشده است."
            columns={[
              {
                key: "title",
                title: "دوره",
                render: (course) => (
                  <div className="min-w-52 space-y-1">
                    <p className="font-black text-white">{course.title}</p>
                    <p className="text-xs text-slate-400">
                      {course.category?.name ?? "بدون دسته"}
                    </p>
                    <p className="line-clamp-2 text-xs leading-6 text-slate-500">
                      {course.description || "بدون توضیح"}
                    </p>
                  </div>
                ),
              },
              {
                key: "time",
                title: "زمان و مکان",
                render: (course) => (
                  <div className="min-w-52 space-y-1 text-sm text-slate-300">
                    <p>{formatCourseDate(course.startDate)}</p>
                    <p className="text-xs text-slate-500">
                      پایان: {formatCourseDate(course.endDate)}
                    </p>
                    <p className="text-xs text-cyan-100">
                      {course.location || "محل ثبت نشده"}
                    </p>
                  </div>
                ),
              },
              {
                key: "status",
                title: "وضعیت",
                render: (course) => (
                  <div className="space-y-2 text-sm">
                    <span className="inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                      {
                        courseStatusOptions.find(
                          (option) => option.value === course.status,
                        )?.label
                      }
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      {course.hasExam && <span>آزمون</span>}
                      {course.hasCertificate && <span>گواهی</span>}
                      {course.durationHours ? (
                        <span>{course.durationHours} ساعت</span>
                      ) : null}
                    </div>
                  </div>
                ),
              },
              {
                key: "participants",
                title: "شرکت‌کننده‌ها",
                render: (course) => (
                  <div className="min-w-72 space-y-2">
                    {course.participants.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        هنوز نفر اضافه نشده
                      </p>
                    ) : (
                      course.participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-black text-white">
                              {participant.displayName}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  startEditParticipant(course, participant)
                                }
                              >
                                ویرایش
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                  deleteInPersonParticipant.mutate(
                                    participant.id,
                                  )
                                }
                              >
                                حذف
                              </Button>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">
                            {
                              attendanceOptions.find(
                                (option) =>
                                  option.value === participant.attendanceStatus,
                              )?.label
                            }
                            {" / "}
                            {
                              resultOptions.find(
                                (option) => option.value === participant.result,
                              )?.label
                            }
                            {participant.score != null
                              ? ` / نمره ${participant.score}`
                              : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                ),
              },
              {
                key: "actions",
                title: "عملیات",
                render: (course) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => startEditCourse(course)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => deleteInPersonTraining.mutate(course.id)}
                    >
                      حذف
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {activeTab === "reports" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-black text-white">گزارش‌های آموزش</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            گزارش تکمیل آموزش، ساعات آموزشی، آموزش‌های اجباری انجام‌نشده و گزارش
            دپارتمان‌ها در این بخش اضافه می‌شود.
          </p>
        </div>
      )}
    </div>
  );
}
