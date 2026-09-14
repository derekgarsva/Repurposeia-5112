import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useOptions() {
  return useQuery(orpc.repurpose.options.queryOptions({ staleTime: Infinity }));
}

export function useHistory() {
  return useQuery(orpc.repurpose.history.queryOptions());
}

export function useGenerate() {
  const qc = useQueryClient();
  return useMutation(
    orpc.repurpose.generate.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.repurpose.history.key() }),
    }),
  );
}

export function useRemoveRun() {
  const qc = useQueryClient();
  return useMutation(
    orpc.repurpose.remove.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.repurpose.history.key() }),
    }),
  );
}

export function useUpdateFormat() {
  const qc = useQueryClient();
  return useMutation(
    orpc.repurpose.update.mutationOptions({
      onSuccess: (run) => {
        qc.setQueryData(orpc.repurpose.history.queryKey(), (items) =>
          items?.map((item) => (item.id === run.id ? run : item)),
        );
      },
    }),
  );
}

export function useRegenerateFormat() {
  const qc = useQueryClient();
  return useMutation(
    orpc.repurpose.regenerate.mutationOptions({
      onSuccess: (run) => {
        qc.setQueryData(orpc.repurpose.history.queryKey(), (items) =>
          items?.map((item) => (item.id === run.id ? run : item)),
        );
      },
    }),
  );
}
