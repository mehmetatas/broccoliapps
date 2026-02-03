import { initializeNewUser } from "../../db/initializeNewUser";
import { api } from "../lambda";

api.useAuth({
  onNewUser: async (user) => await initializeNewUser(user.userId),
});
