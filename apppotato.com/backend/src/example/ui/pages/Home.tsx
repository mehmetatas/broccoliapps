export type HomeProps = {
  title: string;
};

export const HomePage = ({ title }: HomeProps) => {
  return (
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
        <h1>{title}</h1>
        <nav>
          <ul>
            <li>
              <a href="/users">Users</a>
            </li>
          </ul>
        </nav>
      </body>
    </html>
  );
};
