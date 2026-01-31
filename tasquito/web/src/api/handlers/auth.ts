import { api } from "../lambda";
import { initializeNewUser } from "../../db/initializeNewUser";

api.useAuth({
  onNewUser: async (user) => await initializeNewUser(user.userId),
});
