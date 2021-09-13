import * as React from "react";
import { useGraphqlQuery } from "./useGraphql";
import { PostsDocument, SortOrderEnum } from "./api";

export const Posts = () => {
  const getPosts = useGraphqlQuery(PostsDocument, {
    options: {
      paginate: { limit: 10 },
      sort: [{ field: "id", order: SortOrderEnum.Desc }]
    }
  });
};
