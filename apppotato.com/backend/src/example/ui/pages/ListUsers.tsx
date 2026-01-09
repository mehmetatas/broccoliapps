type User = {
  id: number;
  name: string;
};

export type ListUsersProps = {
  users: User[];
};

export const ListUsersPage = ({ users }: ListUsersProps) => {
  return (
    <html>
      <head>
        <title>Users</title>
      </head>
      <body>
        <h1>Users</h1>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <a href={`/users/${user.id}`}>{user.name}</a>
            </li>
          ))}
        </ul>
      </body>
    </html>
  );
};
