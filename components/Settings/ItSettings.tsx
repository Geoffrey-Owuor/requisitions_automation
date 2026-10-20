"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addItRequirementItem,
  getItConfigAdminData,
  setItRequirementItemActive,
} from "@/serverActions/ItConfigAdmin";
import { ItSettingsSkeleton } from "@/components/Skeletons/SettingsSkeleton";
import {
  AddRow,
  Card,
  ChangesCard,
  ConfirmDialog,
  type Confirmation,
  LoadError,
  ToggleList,
  useSettingsRunner,
} from "./SettingsPrimitives";

const ADMIN_KEY = ["ItConfigAdmin"];
// The IT form's cache of the same items, refreshed after a change
const RELATED_KEYS = [["ItRequirementItemsData"]];

export default function ItSettings() {
  const { busy, run } = useSettingsRunner(ADMIN_KEY, RELATED_KEYS);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [name, setName] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: getItConfigAdminData,
  });

  if (isLoading) {
    return <ItSettingsSkeleton />;
  }

  if (isError || !data) {
    return <LoadError what="IT settings" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <Card
        title="Requirements"
        description="The checkboxes on the IT requisition form. A deactivated requirement is no longer offered; requisitions that already asked for it keep it."
      >
        <ToggleList
          items={data.items}
          busy={busy}
          label="requirement"
          confirm={setConfirmation}
          setActive={setItRequirementItemActive}
          run={run}
        />
        <AddRow
          placeholder="New requirement"
          value={name}
          onChange={setName}
          busy={busy}
          onAdd={async () => {
            if (await run(() => addItRequirementItem(name))) setName("");
          }}
        />
      </Card>
      <ChangesCard changes={data.changes} />

      <ConfirmDialog
        confirmation={confirmation}
        busy={busy}
        onClose={() => setConfirmation(null)}
        onConfirm={async (action) => {
          if (await run(action)) setConfirmation(null);
        }}
      />
    </div>
  );
}
