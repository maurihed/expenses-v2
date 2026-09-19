import PersonService from "@/services/PersonService";
import type { Person, PersonAdjustmentPayload, PersonPayload, PersonSummary } from "@/types";
import { useMutation, useQuery, useQueryClient } from "react-query";

export const usePersons = (enabled = true) => {
  const { data, isLoading, error, refetch } = useQuery<Person[]>(
    ["persons"],
    () => PersonService.getPersons(),
    {
      staleTime: Infinity, // Refresh only when invalidated after an adjustment/update
      enabled,
    }
  );

  return {
    persons: data || [],
    loadingPersons: isLoading,
    error,
    refreshPersons: refetch,
  };
};

export const usePersonSummary = (personId: string, enabled = true) => {
  const { data, isLoading, error } = useQuery<PersonSummary>(
    ["person-summary", personId],
    () => PersonService.getSummary(personId),
    {
      staleTime: Infinity, // Refresh only when invalidated after an adjustment/update
      enabled: enabled && Boolean(personId),
    }
  );

  return {
    summary: data ?? null,
    loadingSummary: isLoading,
    summaryError: error,
  };
};

export const usePersonMutations = () => {
  const queryClient = useQueryClient();

  const invalidatePersonData = () => {
    queryClient.invalidateQueries(["persons"]);
    queryClient.invalidateQueries(["person-summary"]);
  };

  const addAdjustment = useMutation<
    void,
    Error,
    { id: string; adjustment: PersonAdjustmentPayload }
  >(({ id, adjustment }) => PersonService.addAdjustment(id, adjustment), {
    onSuccess: invalidatePersonData,
  });

  const updatePerson = useMutation<Person, Error, { id: string; person: PersonPayload }>(
    ({ id, person }) => PersonService.updatePerson(id, person),
    { onSuccess: invalidatePersonData }
  );

  return {
    addAdjustment,
    updatePerson,
    personMutationLoading: addAdjustment.isLoading || updatePerson.isLoading,
  };
};
