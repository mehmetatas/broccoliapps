import { table } from "@broccoliapps/backend/dist/db/table";

export type User = {
    id: string;
    name: string;
    email: string;
    signInProvider: string;
    targetCurrency: string;
    createdAt: number;
    updatedAt: number;
}

export const users = table<User>("user").key(["id"]).gsi1("byEmail", ["email"]).build();