import { PageRouter } from "../../../framework/backend/http/page";

// Create page router instance
export const page = new PageRouter();

// Import handlers - they self-register to page
import "./pages/HomePageHandler";
import "./pages/NotFoundPageHandler";
import "./pages/UserDetailPageHandler";
import "./pages/UsersListPageHandler";
