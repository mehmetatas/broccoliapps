import { ErrorPage } from "../../client/pages/ErrorPage";
import { page } from "../lambda";
import { render } from "../render";

page.onError(async (error) => {
  return render(<ErrorPage {...error} />, {
    title: `${error.status} - Error`,
    status: error.status,
    skipLayout: true,
    staticPage: true,
  });
});
