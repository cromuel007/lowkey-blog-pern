import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);



// Execute the following SQL to enable Supabase Realtime
// notifications for new comments.

// Create a lightweight notification table.
// This table only signals that a new comment was created
// and does not expose the comment's content or sensitive data.

// create table "CommentNotification" (
//     id bigint generated always as identity primary key,
//     "commentId" integer not null,
//     "createdAt" timestamptz not null default now()
// );

// Create a trigger function that creates a notification
// whenever a new comment is inserted.

// create or replace function notify_new_comment()
// returns trigger
// language plpgsql
// security definer
// as $$
// begin
//     insert into "CommentNotification" ("commentId")
//     values (new.id);

//     return new;
// end;
// $$;

// Trigger the notification after a new comment is created.

// create trigger post_comment_realtime_notification
// after insert on "PostComment"
// for each row
// execute function notify_new_comment();

// Allow the Supabase anonymous client to read notification events.
// No comment content or sensitive PostComment fields are exposed.

// create policy "Allow realtime comment notifications"
// on "CommentNotification"
// for select
// to anon
// using (true);