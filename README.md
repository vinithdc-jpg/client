# DevCollab client

The client is an Angular standalone application for authenticated client and
freelancer workflows. The current project slice includes project discovery and
management, proposal submission and review, milestone planning and review, a
role-aware Kanban task board, task comments, activity history, and freelancer
proposal history.
Project and bid requests use the Express API and PostgreSQL persistence; access
permissions are enforced by the server.

## Configuration

Set the API base URL in `src/environments/environment.ts`. The local default is
`http://localhost:5000/api`. The API's `CLIENT_URL` must match the browser
origin used to serve this client, normally `http://localhost:4200`.

## Development

Install the client dependencies, then run:

```bash
npm start
```

The application is served at `http://localhost:4200`.

## Styling

The client uses Tailwind CSS 4. UI layout and component styling use Tailwind
utilities in Angular templates. `src/styles.css` contains the base reset and
dynamic project status badge styles. Light and dark colors follow the operating
system's color-scheme preference.

## Verification

```bash
npm test -- --watch=false
npm run build
```

## Main routes

- `/login` and `/register` are public.
- `/projects` lists the client's projects or open projects visible to a freelancer.
- `/projects/new` is restricted to clients.
- `/projects/:projectId` shows project details and role-appropriate proposal actions. Clients and assigned freelancers can also access the milestone, task board, comment, and activity workspace.
- `/bids` is restricted to freelancers and shows their submitted proposals.

The API route and permission summary is documented in [the server README](../server/README.md).
