"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import {
  useCreateDirectoryGroup,
  useCreateDirectoryUser,
  useDeleteDirectoryGroup,
  useDeleteDirectoryUser,
  useDirectoryGroups,
  useDirectoryUsers,
  useUpdateDirectoryGroupMembers,
} from "@/hooks/useDirectory";
import {
  useChangeUserPassword,
  useUsers,
} from "@/hooks/useUsers";
import type {
  DirectoryGroup,
  DirectorySource,
} from "@/lib/directory";

const sourceLabels: Record<DirectorySource, string> = {
  INTERNAL: "داخلی",
  ACTIVE_DIRECTORY: "اکتیو دایرکتوری",
};

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
  const [groupSource, setGroupSource] =
    useState<DirectorySource>("INTERNAL");
  const [passwordUserId, setPasswordUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedGroup, setSelectedGroup] =
    useState<DirectoryGroup | null>(null);
  const selectedGroupUserIds = useMemo(
    () =>
      new Set(
        selectedGroup?.members.map((member) => member.user.id) ?? [],
      ),
    [selectedGroup],
  );

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
      source: groupSource,
      isActive: true,
    });

    setGroupName("");
    setGroupTitle("");
    setGroupSource("INTERNAL");
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
    setNewPassword("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">مدیریت کاربران و گروه‌ها</h1>
        <p className="mt-2 text-sm text-slate-400">
          کاربران و گروه‌ها می‌توانند از اکتیو دایرکتوری یا به‌صورت داخلی مدیریت شوند؛ هر کاربر می‌تواند عضو چند گروه باشد.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
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
              {groups.map((group) => (
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
            <label className="space-y-2 text-sm text-slate-300">
              <span>نوع گروه</span>
              <select
                value={groupSource}
                onChange={(event) =>
                  setGroupSource(event.target.value as DirectorySource)
                }
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
              >
                <option value="INTERNAL">داخلی</option>
                <option value="ACTIVE_DIRECTORY">اکتیو دایرکتوری</option>
              </select>
            </label>
          </div>
          <Button type="submit" disabled={createGroup.isPending}>
            افزودن گروه
          </Button>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="space-y-4">
          <h2 className="text-xl font-bold">کاربران</h2>
          <DataTable
            data={users}
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
                render: (user) => (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteUser.mutate(user.id)}
                    disabled={deleteUser.isPending}
                  >
                    حذف
                  </Button>
                ),
              },
            ]}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">گروه‌ها</h2>
          <div className="space-y-3">
            {groups.map((group) => (
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

          {selectedGroup && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">اعضای {selectedGroup.title}</h3>
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
              </div>
              <div className="space-y-2">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupUserIds.has(user.id)}
                      onChange={() => void toggleGroupMember(user.id)}
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
            </div>
          )}
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h2 className="text-xl font-bold">تغییر رمز کاربران داخلی</h2>
          <p className="mt-2 text-sm text-slate-400">
            رمز کاربران اکتیو دایرکتوری از اینجا قابل تغییر نیست و باید در AD تغییر کند.
          </p>
        </div>

        <form
          onSubmit={submitPasswordChange}
          className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]"
        >
          <select
            value={passwordUserId}
            onChange={(event) => setPasswordUserId(event.target.value)}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-white"
          >
            <option value="">انتخاب کاربر</option>
            {systemUsers.map((user) => (
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
    </div>
  );
}
