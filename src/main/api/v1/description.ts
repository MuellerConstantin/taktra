/** The introduction of the OpenAPI description, in Markdown. */
export const API_DESCRIPTION = `
Taktra is a local time tracking app. The Local API lets other programs on the same computer,
such as scripts, BI tools or AI assistants, read and change the data of the active profile:
projects, activities, clients, tags, custom fields, time entries and export templates. They
can also read reports, run the timer and follow changes. Profiles and app settings are only
changed in the app.

The API is turned off by default. It is turned on, and the key is created, on the
integrations page of the app settings.

# General

The API listens on \`127.0.0.1\` only and is reachable only while Taktra runs. Every route
works on the profile that is active in the app.

## HTTP Verbs

| Verb   | Description                                                            |
|--------|------------------------------------------------------------------------|
| GET    | Reads resources.                                                       |
| POST   | Creates resources and runs actions such as \`/archive\` or \`/merge\`.   |
| PATCH  | Changes the given fields of a resource.                                |
| PUT    | Replaces a resource, or a part of it such as the tags of an activity. |
| DELETE | Deletes a resource; one with booked time can only be archived.        |

Each request is one operation, which applies completely or not at all.

## Content

Requests and responses are \`application/json\`; a request body in another format is refused.
Creating answers \`201\` with the new resource, deleting answers \`204\` without a body.

## Timestamps

Timestamps are [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) in UTC,
such as \`2026-03-02T08:00:00.000Z\`. Days are local dates, such as \`2026-03-02\`, like the day a
time entry counts towards.

## Authentication

Every request needs the API key as \`Authorization: Bearer <key>\`. There is one key; it is
shown once when created, and creating a new one makes the old one stop working. Requests
from a web page, recognized by their \`Origin\` header, are refused, so web pages can neither
call the API nor read its responses. This description is served without the key.

## Error Handling

Every error is \`{ "error": { "code": "…" } }\`. \`VALIDATION_FAILED\` means the request itself
is wrong and adds \`issues\`, one per wrong field, such as
\`{ "path": "end", "message": "End must be after start" }\`. The path names the field as in the
request, nested names joined by dots; the message is for people and may change. A conflict
(409) means the request is fine, but the current data does not allow it, for example an
archived activity.

| Status | Codes                                                                       |
|--------|-----------------------------------------------------------------------------|
| 400    | \`VALIDATION_FAILED\`, \`INVALID_JSON\`, \`INVALID_HOST\`                       |
| 401    | \`UNAUTHORIZED\`: the key is missing or wrong                               |
| 403    | \`FORBIDDEN_ORIGIN\`: the request comes from a web page                       |
| 404    | \`ROUTE_NOT_FOUND\`, and \`<RESOURCE>_NOT_FOUND\` such as \`PROJECT_NOT_FOUND\`   |
| 409    | conflicts with the current data, such as \`PROJECT_NAME_TAKEN\`, \`ACTIVITY_ARCHIVED\` or \`NO_ACTIVE_PROFILE\` |
| 413    | \`PAYLOAD_TOO_LARGE\`: the body is larger than 64 KB                         |
| 415    | \`UNSUPPORTED_MEDIA_TYPE\`: the body is not JSON                             |
| 500    | \`UNKNOWN\`: an unexpected error                                             |

## Events

\`GET /api/v1/events\` is a stream of server-sent events without data. \`signal:data\` follows
any change of the profile data, whoever made it, \`signal:timer\` a change of the running timer,
\`signal:profiles\` another active profile and \`signal:settings\` changed app settings. A client
reloads what it shows when one arrives.
`.trim()
