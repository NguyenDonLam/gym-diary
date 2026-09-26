import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { templateFolderRepository } from "../data/repository";
import type { TemplateFolder } from "../domain/types";

const key = ["template-folders"] as const;
const EMPTY_FOLDERS: TemplateFolder[] = [];

export function useTemplateFolders() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: key,
    queryFn: () => templateFolderRepository.getAll(),
  });
  const create = useMutation({
    onMutate: () => client.cancelQueries({ queryKey: key }),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
    mutationFn: (name: string) => templateFolderRepository.create(name),
    onSuccess: (folder) =>
      client.setQueryData<TemplateFolder[]>(key, (folders = []) => [
        ...folders,
        folder,
      ]),
  });
  const save = useMutation({
    onMutate: () => client.cancelQueries({ queryKey: key }),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
    mutationFn: (folder: TemplateFolder) =>
      templateFolderRepository.save(folder),
    onSuccess: (folder) =>
      client.setQueryData<TemplateFolder[]>(key, (folders = []) =>
        folders.map((item) => (item.id === folder.id ? folder : item)),
      ),
  });
  const remove = useMutation({
    onMutate: () => client.cancelQueries({ queryKey: key }),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
    mutationFn: (id: string) => templateFolderRepository.delete(id),
    onSuccess: (_, id) =>
      client.setQueryData<TemplateFolder[]>(key, (folders = []) =>
        folders.filter((folder) => folder.id !== id),
      ),
  });
  return {
    folders: query.data ?? EMPTY_FOLDERS,
    isLoading: query.isPending,
    error: query.error,
    create: create.mutateAsync,
    save: save.mutateAsync,
    remove: remove.mutateAsync,
    isCreating: create.isPending,
  };
}
