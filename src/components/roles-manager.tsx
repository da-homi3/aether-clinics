"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomRoleAction, updateRolePermissionsAction } from "@/lib/actions";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";

type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionKeys: string[];
};

export function RolesManager({ roles }: Readonly<{ roles: RoleRow[] }>) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <h3 className="mb-3 font-semibold">Create custom role</h3>
        <form
          className="grid gap-3"
          action={(fd) =>
            startTransition(async () => {
              const res = await createCustomRoleAction(fd);
              if (res?.error) setError(res.error);
              else {
                setMessage("Custom role created.");
                setError(null);
                router.refresh();
              }
            })
          }
        >
          <Field label="Name">
            <Input name="name" required placeholder="e.g. Branch Auditor" />
          </Field>
          <Field label="Description">
            <Textarea name="description" placeholder="What this role can do" />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="permissions" value={key} className="rounded border" />
                <span>{key}</span>
              </label>
            ))}
          </div>
          <Button type="submit" disabled={pending}>
            Create role
          </Button>
        </form>
      </Card>

      {roles.map((role) => (
        <Card key={role.id}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">{role.name}</h3>
              <p className="text-sm text-muted">
                {role.description || (role.isSystem ? "System role" : "Custom role")}
                {role.isSystem ? " · system" : ""}
              </p>
            </div>
          </div>
          <form
            className="grid gap-3"
            action={(fd) =>
              startTransition(async () => {
                const res = await updateRolePermissionsAction(fd);
                if (res?.error) setError(res.error);
                else {
                  setMessage(`Updated ${role.name}.`);
                  setError(null);
                  router.refresh();
                }
              })
            }
          >
            <input type="hidden" name="roleId" value={role.id} />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PERMISSIONS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={key}
                    defaultChecked={role.permissionKeys.includes(key)}
                    disabled={role.name === "Super Admin"}
                    className="rounded border"
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
            {role.name !== "Super Admin" ? (
              <Button type="submit" variant="secondary" disabled={pending}>
                Save permissions
              </Button>
            ) : (
              <p className="text-xs text-muted">Super Admin always has full access.</p>
            )}
          </form>
        </Card>
      ))}
      {message ? <p className="text-sm text-ok">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
