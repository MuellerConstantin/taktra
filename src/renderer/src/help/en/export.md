## What is the export for?

To pass tracked time on, for example for an invoice, payroll or another system. The file also keeps a fixed state that later changes in Taktra no longer affect.

## What is in the file?

By default one row per entry, with names instead of internal numbers. Clock times are in your local time, durations in whole minutes or in hours, notes as you wrote them. Only completed entries are exported, so a running timer is missing.

## Which format should I choose?

Whatever the system reading the file expects. To open the file yourself in a spreadsheet, choose XLSX: dates and durations arrive there as such and can be sorted and summed right away. CSV and JSON are meant for other programs.

## Can I choose the columns myself?

Yes, for every export. You set which columns the file contains, in which order and under which name. Besides the standard columns, these can be [custom fields](customFields.md) too. The choice applies to this export only; the next export starts with the standard columns again.

## What are templates for?

So you do not put together a choice you need often every time, for example for the system that reads the file. A template saves columns, layout and format in the profile. What you change after loading a template applies to this export only, until you save it in the template.

## Can the file contain sums instead of single entries?

Yes, a template can sum the entries: every combination of its other columns becomes one row, for example one per activity and day. With days as columns, each day of the period gets a column of its own instead, like in a time sheet. Start and end differ for every entry, so they cannot be summed.

## Does every column of summed rows create rows of its own?

Only if it groups the rows, which is the default. A column can list its values instead: it then creates no rows of its own and lists the different values of the summed entries once each, for example all tags of a project. Notes are always listed, in the order of their entries. The date only groups, because several dates are no longer a date.
