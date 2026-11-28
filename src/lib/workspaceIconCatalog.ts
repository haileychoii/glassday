import {
  workspaceIconCollections,
  type WorkspaceIconChoice,
  type WorkspaceIconCollectionId,
} from "../constants/workspaceIconChoices";
import { supabase } from "./supabase";

export type WorkspaceIconCatalog = Record<
  WorkspaceIconCollectionId,
  WorkspaceIconChoice[]
>;

const collectionIds = Object.keys(workspaceIconCollections) as WorkspaceIconCollectionId[];

const normalizeCatalog = (value: unknown): WorkspaceIconCatalog => {
  const stored = value && typeof value === "object" ? value as Record<string, unknown> : {};

  return Object.fromEntries(
    collectionIds.map((collection) => {
      const entries = stored[collection];
      const validEntries = Array.isArray(entries)
        ? entries.filter((entry): entry is WorkspaceIconChoice =>
            Boolean(
              entry &&
              typeof entry === "object" &&
              typeof (entry as WorkspaceIconChoice).id === "string" &&
              typeof (entry as WorkspaceIconChoice).src === "string" &&
              typeof (entry as WorkspaceIconChoice).label === "string"
            )
          )
        : workspaceIconCollections[collection];
      return [collection, validEntries];
    })
  ) as WorkspaceIconCatalog;
};

export const getDefaultWorkspaceIconCatalog = (): WorkspaceIconCatalog =>
  Object.fromEntries(
    collectionIds.map((collection) => [
      collection,
      [...workspaceIconCollections[collection]],
    ])
  ) as WorkspaceIconCatalog;

export const loadWorkspaceIconCatalog = async (): Promise<WorkspaceIconCatalog> => {
  if (!supabase) return getDefaultWorkspaceIconCatalog();

  const { data, error } = await supabase
    .from("workspace_icon_catalog")
    .select("categories")
    .eq("singleton", "global")
    .maybeSingle();

  if (error) throw error;
  if (!data) return getDefaultWorkspaceIconCatalog();
  return normalizeCatalog(data.categories);
};

export const saveWorkspaceIconCatalog = async (
  catalog: WorkspaceIconCatalog
): Promise<void> => {
  if (!supabase) throw new Error("아이콘 공유 저장소에 연결할 수 없습니다.");

  const { error } = await supabase.from("workspace_icon_catalog").upsert(
    {
      singleton: "global",
      categories: catalog,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "singleton" }
  );

  if (error) throw error;
};
