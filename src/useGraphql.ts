import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { DocumentNode, OperationDefinitionNode, print, visit } from "graphql";
import { useCallback, useMemo } from "react";
import {
  FetchQueryOptions,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions
} from "react-query";

let GRAPHQL_ENDPOINT = "";
const getGraphqlEndpoint = () => GRAPHQL_ENDPOINT;
export const setGraphqlEndpoint = (endpoint: string) =>
  (GRAPHQL_ENDPOINT = endpoint);

/*
  GraphqlError that has some additional data on it
*/
export class GraphqlError extends Error {
  public status;
  public operationName;
  public query;
  constructor(
    message?: string,
    status?: number,
    operationName?: string,
    query?: string
  ) {
    super(message || "Unknown Error");
    this.status = status;
    this.operationName = operationName;
    this.query = query;
  }
}

/*
 Get the operationName from a graphql DocumentNode
*/
const getOperationName = (query: DocumentNode) => {
  let operationName;
  visit(query, {
    OperationDefinition(node: OperationDefinitionNode) {
      operationName = node.name?.value;
    }
  });
  return operationName;
};

/*
  Graphql fetch wrapper

  try {
    const res = graphqlFetch(GetThingDocument, { id: 'x' })
    console.log(res.getThing?.name)
  } catch (err) {
    console.err(err)
  }
*/
export const graphqlFetch = async <
  TData = any,
  TVariables = Record<string, any>
>(
  operation: TypedDocumentNode<TData, TVariables>,
  variables?: TVariables
): Promise<TData> => {
  const operationName = getOperationName(operation) || "";
  const query = print(operation);

  const res = await fetch(getGraphqlEndpoint(), {
    headers: { "content-type": "application/json" },
    method: "POST",
    body: JSON.stringify({ operationName, query, variables })
  });

  // extract the results, catch json parse errors
  let json;
  try {
    json = await res.json();
  } catch (err) {
    throw new GraphqlError(res.statusText, res.status, operationName, query);
  }

  // if not a 20x status code, throw an error
  if (!res.ok)
    throw new GraphqlError(res.statusText, res.status, operationName, query);

  // graphql errors are an array of errors with a 200 response, pluck the first one
  if (Array.isArray(json.errors)) {
    const [error] = json.errors;
    throw new GraphqlError(error.message, res.status, operationName, query);
  }

  // all is good, return the data property
  return json.data;
};

/*
  Graphql wrapper on react-query `useQuery`

  const { data, isLoading, error, refetch } = useGraphqlQuery(
    GetThingDocument,
    { id: 1 },
    { ...useQueryOptions }
  )
*/
export const useGraphqlQuery = <TData = any, TVariables = Record<string, any>>(
  operation: TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
  options?: UseQueryOptions<TData, GraphqlError>
) => {
  const operationName = useMemo(() => getOperationName(operation), [operation]);
  const queryKey = useMemo(() => [operationName, variables ?? {}], [
    operationName,
    variables
  ]);
  return useQuery(queryKey, () => graphqlFetch(operation, variables), options);
};

/*
  Graphql wrapper on react-query `queryClient.fetchQuery`

  const getThing = useGraphqlFetch(GetThingDocument)

  try {
    const res = await getThing({ id: 1 }, { ...fetchQueryOptions })
    console.log(`${res.getThing?.name} was updated`)
  } catch (err) {
    console.error(err)
  }
*/
export const useGraphqlFetch = <TData = any, TVariables = Record<string, any>>(
  operation: TypedDocumentNode<TData, TVariables>
) => {
  const queryClient = useQueryClient();
  return useCallback(
    (
      variables?: TVariables,
      options?: FetchQueryOptions<TData, GraphqlError>
    ) => {
      const operationName = getOperationName(operation);
      return queryClient.fetchQuery<TData, GraphqlError>(
        [operationName, variables ?? {}],
        () => graphqlFetch(operation, variables),
        options
      );
    },
    [operation, queryClient]
  );
};

/*
  Graphql wrapper on react-query `useInfiniteQuery`.

  const { data, error, isLoading, refetch } = useGraphqlInfiniteQuery(
    SearchThingsDocument,
    { limit: 10, skip: 0 },
    { ...useInfiniteQueryOptions }
  )
*/
export const useGraphqlInfiniteQuery = <
  TData = any,
  TVariables = Record<string, any>
>(
  operation: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  options?: UseInfiniteQueryOptions<TData, GraphqlError>
) => {
  const operationName = useMemo(() => getOperationName(operation), [operation]);
  const queryKey = useMemo(() => [operationName, variables ?? {}, "infinite"], [
    operationName,
    variables
  ]);
  return useInfiniteQuery(
    queryKey,
    ({ pageParam }) => graphqlFetch(operation, { ...variables, ...pageParam }),
    options
  );
};

/*
  Graphql wrapper around react-query `useMutation`.

  const createThing = useGraphlMutation(CreateThingDocument, { ...useMutationOptions })

  try {
    const res = await createThing.mutateAsync({ name: 'me' })
    console.log(`${res.createThing.name} was created`)
  } catch (err) {
    console.error(err)
  }
*/
export const useGraphqlMutation = <
  TData = any,
  TVariables = Record<string, any>
>(
  operation: TypedDocumentNode<TData, TVariables>,
  options?: UseMutationOptions<TData, GraphqlError, TVariables>
) => {
  return useMutation(
    (variables?: TVariables) => graphqlFetch(operation, variables),
    options
  );
};
