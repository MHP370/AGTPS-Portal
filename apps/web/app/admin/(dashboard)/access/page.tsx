"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import {
  useCreateRole,
  usePermissions,
  useRoles,
  useToggleRolePermission,
} from "@/hooks/useAccess";
import {
  useDirectoryGroups,
  useUpdateDirectoryGroupRoles,
} from "@/hooks/useDirectory";
import type { DirectoryGroup } from "@/lib/directory";

const GROUP_PAGE_SIZE = 15;

export default function AccessPage() {
  const { data: roles = [] } = useRoles();
  const { data: permissions = [] } = usePermissions();
  const { data: groups = [] } = useDirectoryGroups();
  const toggleRolePermission = useToggleRolePermission();
  const updateGroupRoles = useUpdateDirectoryGroupRoles();
  const createRole = useCreateRole();
  const [roleName, setRoleName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const [selectedGroup, setSelectedGroup] =
    useState<DirectoryGroup | null>(null);
  const selectedGroupRoleIds = useMemo(
    () =>
      new Set(
        selectedGroup?.roles.map((item) => item.role.id) ?? [],
      ),
    [selectedGroup],
  );
  const filteredGroups = useMemo(() => {
    const search = groupSearch.trim().toLowerCase();
    return groups.filter((group) => !search || [group.title, group.name].some((value) => value.toLowerCase().includes(search)));
  }, [groupSearch, groups]);
  const pagedGroups = filteredGroups.slice((groupPage - 1) * GROUP_PAGE_SIZE, groupPage * GROUP_PAGE_SIZE);

  async function submitRole(event: React.FormEvent) {
    event.preventDefault();
    if (!roleName.trim() || !roleTitle.trim()) return;
    await createRole.mutateAsync({ name: roleName.trim(), title: roleTitle.trim() });
    setRoleName("");
    setRoleTitle("");
  }

  async function toggleGroupRole(roleId: string) {
    if (!selectedGroup) return;

    const roleIds = selectedGroupRoleIds.has(roleId)
      ? Array.from(selectedGroupRoleIds).filter((id) => id !== roleId)
      : [...Array.from(selectedGroupRoleIds), roleId];
    const updated = await updateGroupRoles.mutateAsync({
      id: selectedGroup.id,
      roleIds,
    });

    setSelectedGroup(updated);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">مدیریت دسترسی‌ها</h1>
        <p className="mt-2 text-sm text-slate-400">
          نقش‌ها شامل permission هستند و هر گروه کاربری می‌تواند چند نقش داشته باشد.
        </p>
      </div>

      <form onSubmit={submitRole} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="space-y-2 text-sm text-slate-300">
          <span>کلید نقش</span>
          <Input value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="مثلاً reports-viewer" />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>عنوان نقش</span>
          <Input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="مثلاً مشاهده‌گر گزارش‌ها" />
        </label>
        <Button type="submit" disabled={createRole.isPending}>
          {createRole.isPending ? "در حال ساخت..." : "ساخت نقش"}
        </Button>
      </form>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-bold">Permissionهای هر نقش</h2>
          <div className="space-y-4">
            {roles.map((role) => {
              const rolePermissionIds = new Set(
                role.permissions.map((item) => item.permission.id),
              );

              return (
                <div
                  key={role.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="mb-3">
                    <div className="font-black">{role.title}</div>
                    <div className="text-xs text-slate-500">{role.name}</div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {permissions.map((permission) => {
                      const checked = rolePermissionIds.has(permission.id);

                      return (
                        <label
                          key={permission.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] p-3 text-sm"
                        >
                          <span>
                            <span className="block font-semibold">
                              {permission.title}
                            </span>
                            <span className="text-xs text-slate-500">
                              {permission.name}
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleRolePermission.mutate({
                                roleId: role.id,
                                permissionId: permission.id,
                                enabled: !checked,
                              })
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-bold">نقش‌های گروه‌ها</h2>
          <Input value={groupSearch} onChange={(event) => { setGroupSearch(event.target.value); setGroupPage(1); }} placeholder="جستجو بر اساس نام یا عنوان گروه" />
          <div className="space-y-3">
            {pagedGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className={`w-full rounded-2xl border p-4 text-right transition ${
                  selectedGroup?.id === group.id
                    ? "border-cyan-300 bg-cyan-400/10"
                    : "border-slate-800 bg-slate-950/40 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{group.title}</span>
                  <span className="text-xs text-slate-400">
                    {group.roles.length} نقش
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">{group.name}</div>
              </button>
            ))}
          </div>
          <Pagination page={groupPage} pageSize={GROUP_PAGE_SIZE} totalItems={filteredGroups.length} onPageChange={setGroupPage} />

          {selectedGroup && (
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold">نقش‌های {selectedGroup.title}</h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedGroup(null)}
                >
                  بستن
                </Button>
              </div>
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] p-3 text-sm"
                >
                  <span>
                    <span className="block font-semibold">{role.title}</span>
                    <span className="text-xs text-slate-500">{role.name}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedGroupRoleIds.has(role.id)}
                    onChange={() => void toggleGroupRole(role.id)}
                  />
                </label>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
