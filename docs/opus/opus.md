Details:
- Each domain gets its own kanban board. As in each domain gets to independently with their own kandban board.
- Each task would have a title, description, references/links, status, priority, asignee (can be multiple), lables (can be multiple), due date, sub-tasks.
- Sub tasks also have title, description, references/links, status, priority, asignee (can be multiple), lables (can be multiple). their due date would automatically take up the parent task's due date.
- Default Statuses for every domain: Backlog, Todo, In Progress, Done, Cancelled.
- Default Priorities for every domain: No Priority, Urgent, High, Medium, Low.
- No default labels.

Role Permissions:
- Everyone:
  - Allowed to look at tasks irrespective of the domain.
- Member:
  - allowed to look at the tasks for their domain only.
  - allowed to update details for the tasks appointed to them.
- Domain Leads, Associate Leads and co-leads:
  - Allowed to add custom statuses, priorities and labels for their domain.
  - Allowed to create and edit tasks for their domain.
- Everyone above Domain Leads, Associate Leads and co-leads have full access not only over opus.

Instructions:
- Make sure that everything is scalable such that if in case there is a new domain addition, we shouldn't have to update everything through code, It should automatically reflect for the new domain as soon as you add the domain in the database in the future. Don't add this functionality yet but just keep in mind to keep the schemas and table such that we withstand this.

UI:
**Use shadcn components only**
Structure:
- One sidebar for sub routes inside opus: (Overview, Tasks (has a dropdown for the domains), Manage (for domain leads, associate leads, co-leads, and above))
- Overview is a dashboard for the users: total tasks appointed to them, and other things that might be relevant here.
- Tasks/domain: would be a Kanban board with Drag and drop. the columns will be the statuses of that domain. Clicking on a task would open a modal to view the entire task's details in a strucutured way.
  - The domain leads, associate leads, co-leads, and above get to create tasks and modify them, so add a button above the kanban board and an edit button inside of an existing task.
    - The add new task button would have a modal to create a new task where they would have all the options to add title, description, references, the status defaults to Backlog, priorit defaults to null, due date defaults to null and can only be in future from today, Asignee would be a dropdown and can add multiple people, labels default to null. and a button to add sub tasks. Sub tasks would have a similar UI and UX to the create task modal.