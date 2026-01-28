import { BasiqClient } from "./basiq";

const USER_ID = "482b5863-bce2-4d64-8c8c-40a6a23fcea9";

const main = async () => {
  try {
    const api = new BasiqClient(process.env.BASIQ_API_KEY!);

    // await api.getToken("CLIENT_ACCESS", USER_ID);
    // const user = await api.getUser(USER_ID);
    // console.log(user);

    await api.getToken("SERVER_ACCESS");
    const authLink = await api.createAuthLink(USER_ID);
    console.log(authLink.links.public);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();

