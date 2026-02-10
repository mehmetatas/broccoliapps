# Tasquito Manual Test Plan

| # | Action | Expectation | iOS | Android | Desktop Browser | Mobile Browser |
|---|--------|-------------|-----|---------|-----------------|----------------|
| | **Authentication** | | | | | |
| 1 | Tap "Sign in with Apple" on login screen | Apple sign-in sheet appears | | | | |
| 2 | Complete Apple sign-in successfully | Redirected to home screen with projects loaded | | | | |
| 3 | Open the app after being signed in | Home screen loads with projects (no login screen) | | | | |
| 4 | Open the web app without being signed in | Redirected to login page | | | | |
| 5 | Complete OAuth sign-in on web | Redirected to home page with projects loaded | | | | |
| 6 | Wait for access token to expire, then perform any action | Token refreshes silently; action succeeds without sign-in prompt | | | | |
| 7 | Tap "Sign Out" in settings | Returned to login screen; tokens cleared | | | | |
| 8 | Force-close the app and reopen after sign-out | Login screen shown; no cached session | | | | |
| 9 | Open the app with an invalid/expired refresh token | Redirected to login screen | | | | |
| | **Projects - Create** | | | | | |
| 10 | Tap the "Create new project" input field | Input field is focused and keyboard appears (mobile) | | | | |
| 11 | Type a project name and press Enter | Project is created, appears in list alphabetically, and input clears | | | | |
| 12 | Submit a project name with leading/trailing spaces | Project is created with trimmed name | | | | |
| 13 | Submit an empty project name | Nothing happens; project is not created | | | | |
| 14 | Type more than 30 characters in the project name field | Character limit indicator appears; input stops at 45 characters | | | | |
| 15 | Submit a project name with exactly 30 characters | Project is created successfully | | | | |
| 16 | Tap X / cancel while typing a project name | Input clears and keyboard dismisses (mobile) | | | | |
| | **Projects - List** | | | | | |
| 17 | View home screen with multiple projects | Projects are listed alphabetically by name | | | | |
| 18 | View a project card on the home screen | Card shows project name and open task count (e.g., "3 open tasks") | | | | |
| 19 | View a project card with no tasks | Card shows "No tasks" | | | | |
| 20 | View home screen with no projects | Empty state: "No projects yet. Create one above to get started!" | | | | |
| 21 | View home screen while projects are loading | Skeleton placeholders shown | | | | |
| | **Projects - Navigate** | | | | | |
| 22 | Tap/click a project card | Navigated to project detail screen/page | | | | |
| 23 | Tap/click back button on project detail | Returned to home screen | | | | |
| 24 | Tap/click back button on archived project detail | Returned to archived projects screen/page | | | | |
| | **Projects - Archive** | | | | | |
| 25 | Tap the archive button on project detail screen | Confirmation modal appears | | | | |
| 26 | Confirm archive in the modal | Project is archived; archived banner appears with "will be deleted in 14 days" | | | | |
| 27 | Swipe a project card to archive (mobile) | Project moves to archived list | | | | |
| 28 | View an archived project's banner | Banner shows "Archived — will be deleted in X days" with Unarchive and Delete buttons | | | | |
| 29 | Tap Unarchive on an archived project | Project is unarchived; banner disappears; project editable again | | | | |
| 30 | Tap Unarchive when already at 5 active projects | Limit error: active project limit message shown | | | | |
| | **Projects - Archived List** | | | | | |
| 31 | Open archived projects screen/page | Archived projects listed with deletion countdown | | | | |
| 32 | View an archived project card | Shows project name and "Deleting in X days" or "Deleting soon" | | | | |
| 33 | View archived projects screen with no archived projects | Empty state: "No archived projects" | | | | |
| 34 | Swipe an archived project to unarchive (mobile) | Project moves back to active list | | | | |
| 35 | Swipe an archived project to delete (mobile) | Delete confirmation modal appears | | | | |
| | **Projects - Delete** | | | | | |
| 36 | Tap "Permanently Delete" on an archived project | Confirmation modal appears | | | | |
| 37 | Confirm delete in the modal | Project and all its tasks are deleted; navigated back to list | | | | |
| 38 | Cancel delete in the modal | Modal closes; project remains | | | | |
| | **Projects - Rename** | | | | | |
| 39 | Tap the project name in the header | Name becomes editable with cursor | | | | |
| 40 | Edit the project name and press Enter / blur | Name is saved; header updates | | | | |
| 41 | Clear the project name and press Enter / blur | Reverts to previous name (empty name not allowed) | | | | |
| 42 | Type more than 30 characters in project name edit | Character limit indicator appears; stops at 45 characters | | | | |
| 43 | Tap project name on an archived project | Name is not editable (disabled) | | | | |
| | **Tasks - Create** | | | | | |
| 44 | Tap the "Create new task" input field | Input is focused and keyboard appears (mobile) | | | | |
| 45 | Type a task title and press Enter | Task appears in the todo list; input clears and stays focused | | | | |
| 46 | Submit an empty task title | Nothing happens; task is not created | | | | |
| 47 | Type more than 60 characters in the task title field | Character limit indicator appears; input stops at 90 characters | | | | |
| 48 | Submit a task title with exactly 60 characters | Task is created successfully | | | | |
| 49 | Tap X / cancel while typing a task title | Input clears and keyboard dismisses (mobile) | | | | |
| 50 | View the task creation form on an archived project | Task form is hidden; cannot create tasks | | | | |
| | **Tasks - Status** | | | | | |
| 51 | Tap the checkbox on a todo task | Task status changes to done; moves to done section with animation | | | | |
| 52 | Tap the checkbox on a done task | Task status changes to todo; moves back to todo section | | | | |
| 53 | Toggle a task with subtasks to done | Task and all subtasks move to done section | | | | |
| 54 | View a done task's appearance | Title has line-through and gray color | | | | |
| 55 | Tap checkbox on a task in an archived project | Checkbox is not interactive (disabled) | | | | |
| | **Tasks - Edit Title** | | | | | |
| 56 | Tap a todo task's title | Title becomes editable with cursor | | | | |
| 57 | Edit the title and press Enter / blur | New title is saved | | | | |
| 58 | Clear the title and press Enter / blur | Reverts to previous title (empty not allowed) | | | | |
| 59 | Type more than 60 characters in task title edit | Character limit indicator appears; stops at 90 characters | | | | |
| 60 | Tap a done task's title | Title is not editable (disabled) | | | | |
| 61 | Tap a task's title in an archived project | Title is not editable (disabled) | | | | |
| | **Tasks - Reorder** | | | | | |
| 62 | Long-press a todo task and drag up/down (mobile) | Task lifts with haptic feedback; visual drag feedback shown | | | | |
| 63 | Drop the dragged task at a new position | Task is reordered; new order persists after refresh | | | | |
| 64 | Drag a task via the drag handle (web) | Task follows cursor; placeholder shown | | | | |
| 65 | Attempt to drag a done task | Dragging is disabled for done tasks | | | | |
| 66 | Attempt to drag a task in an archived project | Dragging is disabled | | | | |
| | **Tasks - Delete** | | | | | |
| 67 | Swipe a todo task to the left (mobile) | Red delete action revealed | | | | |
| 68 | Complete the swipe to delete (mobile) | Task is deleted with animation | | | | |
| 69 | Click the delete option in task menu (web) | Confirmation modal appears | | | | |
| 70 | Confirm task deletion (web) | Task is deleted | | | | |
| 71 | Swipe a done task to delete (mobile) | Task is deleted with animation | | | | |
| 72 | Attempt to swipe-delete a task in an archived project (mobile) | Swipe action is disabled | | | | |
| | **Tasks - Due Date** | | | | | |
| 73 | Tap "Set Due Date" from the task menu | Date picker appears | | | | |
| 74 | Select a date in the date picker | Due date badge appears on the task (e.g., "Jan 15") | | | | |
| 75 | Tap the due date badge on a task | Date picker opens with current date pre-selected (iOS) or menu with Change/Remove appears (Android) | | | | |
| 76 | Change the due date to a new date | Badge updates to new date | | | | |
| 77 | Remove the due date (via Android menu or clearing) | Badge disappears from the task | | | | |
| 78 | View a due date on a done task | Badge is visible but not interactive | | | | |
| 79 | Tap due date on a task in an archived project | Date picker does not open (disabled) | | | | |
| | **Tasks - Note** | | | | | |
| 80 | Tap "Add Note" from the task menu | Note edit area appears with cursor focused | | | | |
| 81 | Type a note and tap save / check button | Note is saved and displayed below the task | | | | |
| 82 | Type more than 500 characters in the note | Character limit indicator appears; stops at 750 characters | | | | |
| 83 | View a note longer than 5 lines (mobile) | Note is truncated with "Show more" link | | | | |
| 84 | Tap "Show more" on a truncated note | Full note is shown with "Show less" link | | | | |
| 85 | Tap on an HTTPS URL in a note | Link opens in in-app browser (mobile) or new tab (web) | | | | |
| 86 | Tap a note to edit it | Note becomes editable | | | | |
| 87 | Tap X / discard while editing a note | Changes are discarded; original note restored | | | | |
| 88 | Clear the note and save | Note is removed from the task | | | | |
| 89 | Tap a note on a done task | Note is not editable (disabled) | | | | |
| 90 | Tap a note on a task in an archived project | Note is not editable (disabled) | | | | |
| | **Subtasks - Create** | | | | | |
| 91 | Tap "Add Subtask" from the task menu | Inline subtask form appears with cursor focused | | | | |
| 92 | Type a subtask title and press Enter | Subtask is created; form stays open for adding more | | | | |
| 93 | Submit an empty subtask title | Nothing happens; subtask is not created | | | | |
| 94 | Type more than 60 characters in subtask title | Character limit indicator appears; stops at 90 characters | | | | |
| 95 | Tap X to close the subtask form | Form closes without creating a subtask | | | | |
| 96 | "Add Subtask" option on a done task | Option not shown in menu (disabled) | | | | |
| | **Subtasks - Status** | | | | | |
| 97 | Tap the checkbox on a todo subtask | Subtask moves to done section; parent task's subtask counter updates | | | | |
| 98 | Tap the checkbox on a done subtask | Subtask moves back to todo section; counter updates | | | | |
| 99 | View a done subtask's appearance | Title has line-through and gray color | | | | |
| | **Subtasks - Edit Title** | | | | | |
| 100 | Tap a todo subtask's title | Title becomes editable with cursor | | | | |
| 101 | Edit the title and press Enter / blur | New title is saved | | | | |
| 102 | Clear the subtask title and save | Reverts to previous title (empty not allowed) | | | | |
| 103 | Tap a done subtask's title | Title is not editable (disabled) | | | | |
| 104 | Tap a subtask's title when parent task is done | Title is not editable (disabled) | | | | |
| | **Subtasks - Delete** | | | | | |
| 105 | Swipe a todo subtask to delete (mobile) | Subtask is deleted | | | | |
| 106 | Swipe a done subtask to delete (mobile) | Swipe is disabled for done subtasks | | | | |
| 107 | Attempt to swipe-delete a subtask in an archived project | Swipe action is disabled | | | | |
| | **Subtasks - Reorder** | | | | | |
| 108 | Long-press a todo subtask and drag (mobile) | Subtask lifts with haptic feedback | | | | |
| 109 | Drop the subtask at a new position | Subtask is reordered; order persists after refresh | | | | |
| 110 | Attempt to drag a done subtask | Dragging is disabled | | | | |
| | **Subtasks - Done Section** | | | | | |
| 111 | View a task with done subtasks | Done count shown with collapse chevron | | | | |
| 112 | Tap the done subtasks chevron to expand | Done subtasks are revealed | | | | |
| 113 | Tap the done subtasks chevron to collapse | Done subtasks are hidden | | | | |
| | **Done Tasks Section** | | | | | |
| 114 | View a project with done tasks | Done section header shown with count and collapse chevron | | | | |
| 115 | Tap the chevron to expand done tasks section | Done tasks are revealed | | | | |
| 116 | Tap the chevron to collapse done tasks section | Done tasks are hidden | | | | |
| 117 | Tap "Delete all done tasks" button | Confirmation modal appears | | | | |
| 118 | Confirm "Delete all done tasks" | All done tasks are deleted | | | | |
| 119 | Cancel "Delete all done tasks" | Modal closes; tasks remain | | | | |
| | **Pull to Refresh** | | | | | |
| 120 | Pull down on the home screen (mobile) | Refresh indicator appears; projects reload | | | | |
| 121 | Pull down on the project detail screen (mobile) | Refresh indicator appears; tasks reload | | | | |
| 122 | Pull down on the archived projects screen (mobile) | Refresh indicator appears; archived projects reload | | | | |
| | **Limit Errors** | | | | | |
| 123 | Create a 6th active project (with 5 already active) | Limit error banner: "You've hit 5 active projects..." | | | | |
| 124 | Create an 11th open task in a project (with 10 open) | Limit error banner: "10 open tasks is a lot to juggle..." | | | | |
| 125 | Create a 6th open subtask on a task (with 5 open) | Limit error banner: "More than 5 open subtasks?..." | | | | |
| 126 | Dismiss a limit error banner | Banner disappears | | | | |
| 127 | Create a 26th project total (with 25 existing) | Limit error banner: "That's 25 projects!..." | | | | |
| 128 | Create a 51st task in a project (with 50 existing) | Limit error banner: "You've hit 50 tasks..." | | | | |
| 129 | Create a 26th subtask on a task (with 25 existing) | Limit error banner: "That's 25 subtasks..." | | | | |
| 130 | Add subtask when at open subtask limit | "Add Subtask" menu option is not shown | | | | |
| | **Loading States** | | | | | |
| 131 | View home screen during initial load | Skeleton placeholder cards shown | | | | |
| 132 | View project detail during initial load | Skeleton placeholders shown for tasks | | | | |
| 133 | Save a task title (observe briefly) | Loading spinner appears next to task during save | | | | |
| 134 | Create a task (observe briefly) | Optimistic task appears immediately; pending indicator shown | | | | |
| | **Theme** | | | | | |
| 135 | Select "Light" theme in settings | App switches to light theme | | | | |
| 136 | Select "Dark" theme in settings | App switches to dark theme | | | | |
| 137 | Select "System" theme in settings | App matches device theme | | | | |
| 138 | Close and reopen app after changing theme | Selected theme persists | | | | |
| | **Settings** | | | | | |
| 139 | Open settings screen/page | Account name and email displayed (read-only) | | | | |
| 140 | View theme options in settings | System, Light, and Dark options shown; current selection highlighted | | | | |
| 141 | Tap "Sign Out" in settings | Signed out and returned to login screen | | | | |
| | **Keyboard & Input (Mobile)** | | | | | |
| 142 | Press Enter in the project name input | Project is created (same as tapping submit) | | | | |
| 143 | Press Enter in the task title input | Task is created (same as tapping submit) | | | | |
| 144 | Press Enter in the subtask title input | Subtask is created; form stays open | | | | |
| 145 | Press Enter while editing a task title | Title edit is saved | | | | |
| 146 | Blur an input while editing (tap elsewhere) | Edit is saved automatically | | | | |
| | **Keyboard & Input (Web)** | | | | | |
| 147 | Press Enter in the project name input | Project is created | | | | |
| 148 | Press Enter in the task title input | Task is created | | | | |
| 149 | Press Escape while editing a task title | Edit is cancelled; original title restored | | | | |
| 150 | Click outside an editable field while editing | Edit is saved automatically | | | | |
| | **Optimistic Updates & Error Recovery** | | | | | |
| 151 | Create a task while offline / with network error | Task appears optimistically, then reverts with error on failure | | | | |
| 152 | Toggle task status rapidly multiple times | Final state reflects last toggle; no duplicate requests | | | | |
| 153 | Create multiple tasks in quick succession | Tasks appear in order; all are saved correctly | | | | |
| | **Empty States** | | | | | |
| 154 | View a project with no tasks | "No tasks yet" message with description shown | | | | |
| 155 | Delete all tasks from a project | Empty state message appears | | | | |
| 156 | View archived projects list with none archived | "No archived projects" message shown | | | | |
