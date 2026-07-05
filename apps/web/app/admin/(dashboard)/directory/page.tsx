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
import type { DirectoryGroup } from "@/lib/directory";

export default function DirectoryPage() {
  const { data: users = [] } = useDirectoryUsers();
  const { data: groups = [] } = useDirectoryGroups();
  const createUser = useCreateDirectoryUser();
  const deleteUser = useDeleteDirectoryUser();
  const createGroup = useCreateDirectoryGroup();
  const updateGroupMembers = useUpdateDirectoryGroupMembers();
  const deleteGroup = useDeleteDirectoryGroup();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
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
      isActive: true,
    });

    setUsername("");
    setDisplayName("");
    setEmail("");
    setDepartment("");
    setTitle("");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Active Directory موقت</h1>
        <p className="mt-2 text-sm text-slate-400">
          این بخش فعلاً برای ورود دستی کاربران و گروه‌هاست؛ بعداً اتصال واقعی AD روی همین ساختار می‌نشیند.
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
                      {user.username}
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
                    {user.displayName}
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
