import * as v from "valibot";
import { coerceNumber } from "./coerce";
import { api } from "./contract";

// TODO: This will become contracts/ folder

export const createUser = api("POST", "/users")
  .withRequest({
    name: v.pipe(v.string(), v.minLength(2)),
    email: v.pipe(v.string(), v.email()),
  })
  .withResponse<{ id: number; name: string; email: string }>();

export const listUsers = api("GET", "/users").withResponse<{
  users: { id: number; name: string }[];
}>();

export const deleteUser = api("DELETE", "/users/:id").withRequest({
  id: coerceNumber(),
});

export const ping = api("POST", "/health/ping");
