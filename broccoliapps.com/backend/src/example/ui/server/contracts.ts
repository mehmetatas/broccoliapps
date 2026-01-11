import * as v from "valibot";
import { page } from "../../../framework/backend/http";
import { HomePage, ListUsersPage, UserDetailPage } from "./pages";

export const homePage = page(HomePage, "/").build();

export const listUsersPage = page(ListUsersPage, "/users").build();

export const userDetailPage = page(UserDetailPage, "/users/:id")
  .withRequest({ id: v.pipe(v.string(), v.minLength(1)) })
  .build();
