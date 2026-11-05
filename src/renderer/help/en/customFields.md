## What are custom fields for?

For extra details that Taktra doesn't know on its own, such as an order number, a cost center or a ticket number. They are usually needed for the [export](export.md), so the file contains everything the billing requires.

## Project, client or activity?

Wherever the value belongs:

- **Project field**: Applies to the whole project, for example an order number.
- **Client field**: Describes who the work is for, for example a cost center.
- **Activity field**: Belongs to a single activity, for example a ticket number.

Every field belongs to exactly one of these levels. Every entry gets the value from its activity, its project or its client.

## Text or select list?

Text for free input such as ticket numbers. A select list when there are fixed values that should always be written the same way. You can't change the type later.

## Why doesn't my field show up in the export?

Fields are only in the file if a [template](export.md) contains them as a column. The standard columns without a template contain no fields.

## What happens to activity fields when I move an activity?

They stay, because they belong to the activity. Project fields, on the other hand, then come from the new project.

## Why can't I delete a field?

Because values have been filled in already. Archive it instead. It then no longer shows up when editing, but its values are kept. Deleting only works as long as the field is empty.
