## What is the export for?

To pass tracked time on, for example for an invoice, payroll or another system. The file also keeps a fixed state that later changes in Taktra no longer affect.

## What is in the file?

One row per entry, with names instead of internal numbers. Clock times are in your local time, durations in whole minutes, notes as you wrote them. Only completed entries are exported, so a running timer is missing.

## Which format should I choose?

Whatever the system reading the file expects. If in doubt, CSV, which any spreadsheet opens. Further formats such as JSON are available as well.

## What are templates for?

To make the file fit the system that reads it. A template sets which columns the file contains, in which order and under which name. Besides the standard columns, these can be [custom fields](customFields.md) too. Templates are saved in the profile. Without a template, the file contains the standard columns.
