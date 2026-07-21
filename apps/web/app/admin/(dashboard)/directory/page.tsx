"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { PersianDateInput } from "@/components/ui/PersianDateInput";
import { Pagination } from "@/components/ui/Pagination";
import {
  useCreateDirectoryGroup,
  useCreateDirectoryUser,
  useDeleteDirectoryGroup,
  useDeleteDirectoryUser,
  useDirectoryGroups,
  useDirectoryUsers,
  useSyncActiveDirectory,
  useUpdateDirectoryGroupMembers,
} from "@/hooks/useDirectory";
import {
  useChangeUserPassword,
  useUpdateAdminUserProfile,
  useUsers,
} from "@/hooks/useUsers";
import type {
  DirectoryGroup,
  DirectorySource,
  DirectorySyncResult,
} from "@/lib/directory";
import type { AdminUser } from "@/lib/users";

const sourceLabels: Record<DirectorySource, string> = {
  INTERNAL: "داخلی",
  ACTIVE_DIRECTORY: "اکتیو دایرکتوری",
};

const PAGE_SIZE = 20;

type DirectoryTab =
  | "directoryUsers"
  | "directoryGroups"
  | "createUser"
  | "createGroup"
  | "systemUsers"
  | "password";

const directoryTabs: Array<{
  id: DirectoryTab;
  label: string;
  description: string;
}> = [
  {
    id: "directoryUsers",
    label: "کاربران",
    description: "لیست کاربران داخلی و اکتیو دایرکتوری",
  },
  {
    id: "directoryGroups",
    label: "گروه‌ها",
    description: "گروه‌ها و عضویت کاربران",
  },
  {
    id: "createGroup",
    label: "ساخت گروه محلی",
    description: "ایجاد گروه فقط در داخل سامانه",
  },
  {
    id: "systemUsers",
    label: "کاربران سامانه",
    description: "پروفایل، کد پرسنلی و تاریخ تولد",
  },
  {
    id: "password",
    label: "تغییر رمز",
    description: "فقط کاربران غیر AD",
  },
];

function formatPersianDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function DirectoryPage() {
  const { data: users = [] } = useDirectoryUsers();
  const { data: groups = [] } = useDirectoryGroups();
  const { data: systemUsers = [] } = useUsers();
  const createUser = useCreateDirectoryUser();
  const deleteUser = useDeleteDirectoryUser();
  const createGroup = useCreateDirectoryGroup();
  const updateGroupMembers = useUpdateDirectoryGroupMembers();
  const deleteGroup = useDeleteDirectoryGroup();
  const changePassword = useChangeUserPassword();
  const updateUserProfile = useUpdateAdminUserProfile();
  const syncDirectory = useSyncActiveDirectory();
  const [syncResult, setSyncResult] = useState<DirectorySyncResult | null>(null);
  const [syncError, setSyncError] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [groupPage, setGroupPage] = useState(1);
  const [memberPage, setMemberPage] = useState(1);
  const [memberSearch, setMemberSearch] = useState("");

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [userSource, setUserSource] =
    useState<DirectorySource>("INTERNAL");
  const [initialGroupIds, setInitialGroupIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [passwordUserId, setPasswordUserId] = useState("");
  const [passwordUserSearch, setPasswordUserSearch] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedGroup, setSelectedGroup] =
    useState<DirectoryGroup | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] =
    useState<DirectoryTab>("directoryUsers");
  const [editEmail, setEditEmail] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPersonnelCode, setEditPersonnelCode] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editAllowEmailChange, setEditAllowEmailChange] = useState(false);
  const [editAllowPasswordChange, setEditAllowPasswordChange] = useState(true);
  const [editAllowProfileEdit, setEditAllowProfileEdit] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState("");
  const selectedGroupUserIds = useMemo(
    () =>
      new Set(
        selectedGroup?.members.map((member) => member.user.id) ?? [],
      ),
    [selectedGroup],
  );
  const filteredDirectoryUsers = useMemo(() => {
    const search = directorySearch.trim().toLowerCase();
    if (!search) return users;
    return users.filter((user) =>
      [user.displayName, user.username, user.email, user.department, user.title]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search)),
    );
  }, [directorySearch, users]);
  const filteredDirectoryGroups = useMemo(() => {
    const search = directorySearch.trim().toLowerCase();
    if (!search) return groups;
    return groups.filter((group) =>
      [group.title, group.name, group.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search)),
    );
  }, [directorySearch, groups]);
  const pagedDirectoryUsers = filteredDirectoryUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);
  const pagedDirectoryGroups = filteredDirectoryGroups.slice((groupPage - 1) * PAGE_SIZE, groupPage * PAGE_SIZE);
  const filteredMemberUsers = users.filter((user) => {
    const search = memberSearch.trim().toLowerCase();
    return !search || [user.displayName, user.username, user.email].filter(Boolean).some((value) => value!.toLowerCase().includes(search));
  });
  const pagedMemberUsers = filteredMemberUsers.slice((memberPage - 1) * PAGE_SIZE, memberPage * PAGE_SIZE);

  const filteredPasswordUsers = useMemo(() => {
    const search = passwordUserSearch.trim().toLowerCase();

    return systemUsers.filter((user) => {
      if (!search) return true;

      return [
        user.username,
        user.email,
        user.firstName,
        user.lastName,
        user.personnelCode,
        user.directoryUser?.displayName,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search));
    });
  }, [passwordUserSearch, systemUsers]);

  async function runDirectorySync() {
    setSyncError("");
    try {
      const result = await syncDirectory.mutateAsync();
      setSyncResult(result);
      setSelectedGroup(null);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "همگام‌سازی انجام نشد.");
    }
  }

  async function addUser(event: React.FormEvent) {
    event.preventDefault();
    if (!username.trim() || !displayName.trim()) return;

    await createUser.mutateAsync({
      username: username.trim(),
      displayName: displayName.trim(),
      email: email.trim() || undefined,
      department: department.trim() || undefined,
      title: title.trim() || undefined,
      source: userSource,
      isActive: true,
      groupIds: initialGroupIds,
    });

    setUsername("");
    setDisplayName("");
    setEmail("");
    setDepartment("");
    setTitle("");
    setUserSource("INTERNAL");
    setInitialGroupIds([]);
  }

  async function addGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!groupName.trim() || !groupTitle.trim()) return;

    await createGroup.mutateAsync({
      name: groupName.trim(),
      title: groupTitle.trim(),
      isActive: true,
    });

    setGroupName("");
    setGroupTitle("");
  }

  async function toggleGroupMember(userId: string) {
    if (!selectedGroup) return;

    const nextUserIds = selectedGroupUserIds.has(userId)
      ? Array.from(selectedGroupUserIds).filter((id) => id !== userId)
      : [...Array.from(selectedGroupUserIds), userId];

    const updated = await updateGroupMembers.mutateAsync({
      id: selectedGroup.id,
      userIds: nextUserIds,
    });
    setSelectedGroup(updated);
  }

  function toggleInitialGroup(groupId: string) {
    setInitialGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  }

  async function submitPasswordChange(event: React.FormEvent) {
    event.preventDefault();

    if (!passwordUserId || newPassword.length < 8) return;

    await changePassword.mutateAsync({
      id: passwordUserId,
      password: newPassword,
    });

    setPasswordUserId("");
    setPasswordUserSearch("");
    setNewPassword("");
  }

  function openEditUser(user: AdminUser) {
    setEditingUser(user);
    setEditEmail(user.email ?? "");
    setEditFirstName(user.firstName ?? "");
    setEditLastName(user.lastName ?? "");
    setEditPersonnelCode(user.personnelCode ?? "");
    setEditBirthDate(user.birthDate ?? "");
    setEditIsActive(user.isActive);
    setEditAllowEmailChange(user.allowEmailChange);
    setEditAllowPasswordChange(user.allowPasswordChange);
    setEditAllowProfileEdit(user.allowProfileEdit);
    setEditNewPassword("");
  }

  async function submitUserProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!editingUser) return;

    await updateUserProfile.mutateAsync({
      id: editingUser.id,
      dto: {
        email: editEmail.trim() || undefined,
        firstName: editFirstName.trim() || undefined,
        lastName: editLastName.trim() || undefined,
        personnelCode: editPersonnelCode.trim() || undefined,
        birthDate: editBirthDate || undefined,
        isActive: editIsActive,
        allowEmailChange: editAllowEmailChange,
        allowPasswordChange: editAllowPasswordChange,
        allowProfileEdit: editAllowProfileEdit,
        newPassword: editNewPassword.trim() || undefined,
      },
    });

    setEditingUser(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">مدیریت کاربران و گروه‌ها</h1>
        <p className="mt-2 text-sm text-slate-400">
          اطلاعات اکتیو دایرکتوری در این صفحه فقط‌خواندنی است و فقط از سرور سازمان همگام می‌شود.
        </p>
      </div>

      <section className="rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.06] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-black text-cyan-50">همگام‌سازی اکتیو دایرکتوری</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              کاربران، گروه‌ها و عضویت‌ها از AD دریافت می‌شوند. هیچ کاربر یا گروهی در AD ساخته، ویرایش یا حذف نمی‌شود.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => void runDirectorySync()}
            disabled={syncDirectory.isPending}
          >
            {syncDirectory.isPending ? "در حال همگام‌سازی..." : "دریافت کاربران و گروه‌ها"}
          </Button>
        </div>
        {syncError && (
          <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">
            {syncError}
          </p>
        )}
        {syncResult && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm">کاربران: {syncResult.users.found}</div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm">گروه‌ها: {syncResult.groups.found}</div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm">عضویت‌ها: {syncResult.memberships}</div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm">جدید: {syncResult.users.created + syncResult.groups.created}</div>
          </div>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {directoryTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl border p-4 text-right transition ${
              activeTab === tab.id
                ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.14)]"
                : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
            }`}
          >
            <span className="block font-black">{tab.label}</span>
            <span className="mt-2 block text-xs leading-6 text-slate-400">
              {tab.description}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "createUser" && (
        <form
          onSubmit={addUser}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <h2 className="text-xl font-bold">افزودن کاربر</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="username"
            />
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="نام نمایشی"
            />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
            />
            <Input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="واحد سازمانی"
            />
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="سمت"
            />
            <label className="space-y-2 text-sm text-slate-300">
              <span>نوع کاربر</span>
              <select
                value={userSource}
                onChange={(event) =>
                  setUserSource(event.target.value as DirectorySource)
                }
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
              >
                <option value="INTERNAL">داخلی</option>
                <option value="ACTIVE_DIRECTORY">اکتیو دایرکتوری</option>
              </select>
            </label>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-200">
              عضویت اولیه در گروه‌ها
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {filteredDirectoryGroups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm"
                >
                  <span>
                    <span className="block font-semibold">{group.title}</span>
                    <span className="text-xs text-slate-500">
                      {sourceLabels[group.source]}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={initialGroupIds.includes(group.id)}
                    onChange={() => toggleInitialGroup(group.id)}
                  />
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={createUser.isPending}>
            افزودن کاربر
          </Button>
        </form>
      )}

      {activeTab === "createGroup" && (
        <form
          onSubmit={addGroup}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <h2 className="text-xl font-bold">افزودن گروه</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="group-name"
            />
            <Input
              value={groupTitle}
              onChange={(event) => setGroupTitle(event.target.value)}
              placeholder="عنوان گروه"
            />
          </div>
          <Button type="submit" disabled={createGroup.isPending}>
            افزودن گروه
          </Button>
        </form>
      )}

      {activeTab === "directoryUsers" && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold">کاربران</h2>
            <Input value={directorySearch} onChange={(event) => { setDirectorySearch(event.target.value); setUserPage(1); }} placeholder="جستجو در کاربران فعال" className="sm:max-w-sm" />
          </div>
          <DataTable
            data={pagedDirectoryUsers}
            columns={[
              {
                key: "displayName",
                title: "کاربر",
                render: (user) => (
                  <div>
                    <div className="font-semibold">{user.displayName}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {user.username} · {sourceLabels[user.source]}
                    </div>
                  </div>
                ),
              },
              {
                key: "email",
                title: "ایمیل",
                render: (user) => user.email ?? "-",
              },
              {
                key: "department",
                title: "واحد",
                render: (user) => user.department ?? "-",
              },
              {
                key: "actions",
                title: "عملیات",
                render: (user) =>
                  user.source === "INTERNAL" ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteUser.mutate(user.id)}
                      disabled={deleteUser.isPending}
                    >
                      حذف
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">فقط‌خواندنی</span>
                  ),
              },
            ]}
          />
          <Pagination page={userPage} pageSize={PAGE_SIZE} totalItems={filteredDirectoryUsers.length} onPageChange={setUserPage} />
        </section>
      )}

      {activeTab === "directoryGroups" && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold">گروه‌ها</h2>
            <Input value={directorySearch} onChange={(event) => { setDirectorySearch(event.target.value); setGroupPage(1); }} placeholder="جستجو در گروه‌ها" className="sm:max-w-sm" />
          </div>
          <div className="space-y-3">
            {pagedDirectoryGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className={`w-full rounded-2xl border p-4 text-right transition ${
                  selectedGroup?.id === group.id
                    ? "border-cyan-300 bg-cyan-400/10"
                    : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{group.title}</span>
                  <span className="text-xs text-slate-400">
                    {group.members.length} عضو
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">{group.name}</div>
                <div className="mt-2 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-100">
                  {sourceLabels[group.source]}
                </div>
              </button>
            ))}
          </div>
          <Pagination page={groupPage} pageSize={PAGE_SIZE} totalItems={filteredDirectoryGroups.length} onPageChange={setGroupPage} />

          {selectedGroup && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">اعضای {selectedGroup.title}</h3>
                {selectedGroup.source === "INTERNAL" ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      deleteGroup.mutate(selectedGroup.id);
                      setSelectedGroup(null);
                    }}
                  >
                    حذف گروه
                  </Button>
                ) : (
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                    عضویت فقط از AD
                  </span>
                )}
              </div>
              <Input value={memberSearch} onChange={(event) => { setMemberSearch(event.target.value); setMemberPage(1); }} placeholder="جستجو در اعضا" className="mb-3" />
              <div className="space-y-2">
                {pagedMemberUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupUserIds.has(user.id)}
                      onChange={() => void toggleGroupMember(user.id)}
                      disabled={selectedGroup.source === "ACTIVE_DIRECTORY"}
                    />
                    <span className="flex-1">
                      {user.displayName}
                      <span className="mr-2 text-xs text-slate-500">
                        {sourceLabels[user.source]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <Pagination page={memberPage} pageSize={PAGE_SIZE} totalItems={filteredMemberUsers.length} onPageChange={setMemberPage} />
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "systemUsers" && (
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h2 className="text-xl font-bold">کاربران سامانه</h2>
          <p className="mt-2 text-sm text-slate-400">
            فیلدهای پروفایل کاربران داخلی و اکتیو دایرکتوری از این بخش قابل مشاهده و اصلاح است.
          </p>
        </div>

        <DataTable
          data={systemUsers}
          columns={[
            {
              key: "username",
              title: "کاربر",
              render: (user) => (
                <div>
                  <div className="font-semibold">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                      user.username}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {user.username} ·{" "}
                    {user.directoryUser?.source
                      ? sourceLabels[user.directoryUser.source]
                      : "داخلی"}
                  </div>
                </div>
              ),
            },
            {
              key: "email",
              title: "ایمیل",
              render: (user) => user.email,
            },
            {
              key: "personnelCode",
              title: "کد پرسنلی",
              render: (user) => user.personnelCode ?? "-",
            },
            {
              key: "birthDate",
              title: "تاریخ تولد",
              render: (user) => formatPersianDate(user.birthDate),
            },
            {
              key: "isActive",
              title: "وضعیت",
              render: (user) => (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    user.isActive
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-rose-500/15 text-rose-200"
                  }`}
                >
                  {user.isActive ? "فعال" : "غیرفعال"}
                </span>
              ),
            },
            {
              key: "actions",
              title: "عملیات",
              render: (user) => (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEditUser(user)}
                >
                  ویرایش
                </Button>
              ),
            },
          ]}
        />
      </section>
      )}

      {activeTab === "password" && (
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h2 className="text-xl font-bold">تغییر رمز کاربران داخلی</h2>
          <p className="mt-2 text-sm text-slate-400">
            رمز کاربران اکتیو دایرکتوری از اینجا قابل تغییر نیست و باید در AD تغییر کند.
          </p>
        </div>

        <form
          onSubmit={submitPasswordChange}
          className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <Input
            value={passwordUserSearch}
            onChange={(event) => setPasswordUserSearch(event.target.value)}
            placeholder="جستجوی زنده کاربر، ایمیل یا کد پرسنلی"
          />
          <select
            value={passwordUserId}
            onChange={(event) => setPasswordUserId(event.target.value)}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
          >
            <option value="">انتخاب کاربر</option>
            {filteredPasswordUsers.map((user) => (
              <option
                key={user.id}
                value={user.id}
                disabled={!user.canChangePassword}
              >
                {user.username}
                {user.canChangePassword ? "" : " - اکتیو دایرکتوری"}
              </option>
            ))}
          </select>
          <Input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="رمز جدید حداقل ۸ کاراکتر"
          />
          <Button
            type="submit"
            disabled={
              changePassword.isPending ||
              !passwordUserId ||
              newPassword.length < 8
            }
          >
            تغییر رمز
          </Button>
        </form>
      </section>
      )}

      <Dialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        title="ویرایش پروفایل کاربر"
      >
        <form onSubmit={submitUserProfile} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="email"
              value={editEmail}
              onChange={(event) => setEditEmail(event.target.value)}
              placeholder="ایمیل"
            />
            <Input
              value={editFirstName}
              onChange={(event) => setEditFirstName(event.target.value)}
              placeholder="نام"
            />
            <Input
              value={editLastName}
              onChange={(event) => setEditLastName(event.target.value)}
              placeholder="نام خانوادگی"
            />
            <Input
              value={editPersonnelCode}
              onChange={(event) => setEditPersonnelCode(event.target.value)}
              placeholder="کد پرسنلی"
            />
            <PersianDateInput
              value={editBirthDate}
              onChange={setEditBirthDate}
            />
            <Input
              type="password"
              value={editNewPassword}
              onChange={(event) => setEditNewPassword(event.target.value)}
              placeholder="رمز جدید کاربر - اختیاری"
              disabled={!editingUser?.canChangePassword}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm text-slate-200">
              <span>کاربر فعال باشد</span>
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(event) => setEditIsActive(event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm text-slate-200">
              <span>کاربر بتواند ایمیل خودش را تغییر دهد</span>
              <input
                type="checkbox"
                checked={editAllowEmailChange}
                onChange={(event) =>
                  setEditAllowEmailChange(event.target.checked)
                }
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm text-slate-200">
              <span>کاربر بتواند رمز خودش را تغییر دهد</span>
              <input
                type="checkbox"
                checked={editAllowPasswordChange}
                onChange={(event) =>
                  setEditAllowPasswordChange(event.target.checked)
                }
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-white/[0.03] p-3 text-sm text-slate-200">
              <span>کاربر بتواند پروفایل خودش را ویرایش کند</span>
              <input
                type="checkbox"
                checked={editAllowProfileEdit}
                onChange={(event) =>
                  setEditAllowProfileEdit(event.target.checked)
                }
              />
            </label>
          </div>

          {editingUser && !editingUser.canChangePassword && (
            <p className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm leading-7 text-amber-100">
              رمز کاربران اکتیو دایرکتوری از پورتال تغییر نمی‌کند.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingUser(null)}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={updateUserProfile.isPending}>
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
