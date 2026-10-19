"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addItRequirementItem,
  getItConfigAdminData,
  setItRequirementItemActive,
} from "@/serverActions/ItConfigAdmin";
import {
  AddRow,
  Card,
  ChangesCard,
  ConfirmDialog,
  type Confirmation,
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
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-neutral-200 bg-white" />
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        The IT settings could not be loaded.{" "}
        <button
          type="button"
          onClick={() => refetch()}
          className="font-semibold underline"
        >
          Try again
        </button>
      </div>
    );
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
