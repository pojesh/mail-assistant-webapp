"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError, api, unwrap, type Schemas } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

export function usePreferences() {
  return useQuery({ queryKey: queryKeys.preferences, queryFn: () => unwrap(api.GET("/api/preferences")) });
}

export function useSavePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Schemas["PreferencesBody"]) => unwrap(api.PUT("/api/preferences", { body })),
    onSuccess: (saved) => queryClient.setQueryData(queryKeys.preferences, saved),
    onError: (error) => toast.error(errorMessage(error, "Could not save your preferences.")),
  });
}

export function useNotes() {
  return useQuery({
    queryKey: queryKeys.notes,
    queryFn: () => unwrap(api.GET("/api/preferences/notes")),
  });
}

export function useNoteMutations() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.notes });
  const onError = (error: unknown) => toast.error(errorMessage(error, "Could not update the note."));

  const create = useMutation({
    mutationFn: (text: string) => unwrap(api.POST("/api/preferences/notes", { body: { text } })),
    onSuccess: () => toast.success("Note added. The assistant will use it from now on."),
    onError,
    onSettled: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Schemas["NoteUpdate"]) =>
      unwrap(api.PATCH("/api/preferences/notes/{note_id}", { params: { path: { note_id: id } }, body })),
    // Optimistic: the note moves to its new state immediately.
    onMutate: async ({ id, ...body }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes });
      const previous = queryClient.getQueryData<Schemas["PreferenceNoteOut"][]>(queryKeys.notes);
      queryClient.setQueryData<Schemas["PreferenceNoteOut"][]>(queryKeys.notes, (notes) =>
        notes?.map((note) =>
          note.id === id
            ? { ...note, text: body.text ?? note.text, status: body.status ?? note.status }
            : note,
        ),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(queryKeys.notes, context?.previous);
      onError(error);
    },
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      unwrap(api.DELETE("/api/preferences/notes/{note_id}", { params: { path: { note_id: id } } })),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes });
      const previous = queryClient.getQueryData<Schemas["PreferenceNoteOut"][]>(queryKeys.notes);
      queryClient.setQueryData<Schemas["PreferenceNoteOut"][]>(queryKeys.notes, (notes) =>
        notes?.filter((note) => note.id !== id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      queryClient.setQueryData(queryKeys.notes, context?.previous);
      onError(error);
    },
    onSettled: refresh,
  });
  return { create, update, remove };
}

export function useVipSuggestions(enabled: boolean) {
  return useQuery({
    queryKey: ["vip-suggestions"],
    queryFn: () => unwrap(api.GET("/api/onboarding/vip-suggestions")),
    enabled,
  });
}

export function useLearnStyle() {
  return useMutation({ mutationFn: () => unwrap(api.POST("/api/onboarding/learn-style")) });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.POST("/api/onboarding/complete")),
    onSuccess: (me) => queryClient.setQueryData(queryKeys.me, me),
  });
}
