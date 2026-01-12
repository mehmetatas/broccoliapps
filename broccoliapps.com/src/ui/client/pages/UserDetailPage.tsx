export type UserDetailProps = {
  id: string;
  name: string;
  email: string;
};

export const UserDetailPage = ({ id, name, email }: UserDetailProps) => {
  return (
    <html>
      <head>
        <title>{name} - User Detail</title>
      </head>
      <body>
        <h1>{name}</h1>
        <p>ID: {id}</p>
        <p>Email: {email}</p>
        <a href="/users">Back to Users</a>
      </body>
    </html>
  );
};
