"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  usePermissions,
  useRoles,
  useToggleRolePermission,
} from "@/hooks/useAccess";
import {
  useDirectoryGroups,
  useUpdateDirectoryGroupRoles,
} from "@/hooks/useDirectory";
import type { DirectoryGroup } from "@/lib/directory";

export default function AccessPage() {
  const { data: roles = [] } = useRoles();
  const { data: permissions = [] } = usePermissions();
  const { data: groups = [] } = useDirectoryGroups();
  const toggleRolePermission = useToggleRolePermission();
  const updateGroupRoles = useUpdateDirectoryGroupRoles();
  const [selectedGroup, setSelectedGroup] =
    useState<DirectoryGroup | null>(null);
  const selectedGroupRoleIds = useMemo(
    () =>
      new Set(
        selectedGroup?.roles.map((item) => item.role.id) ?? [],
      ),
    [selectedGroup],
  );

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
          <div className="space-y-3">
            {groups.map((group) => (
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
