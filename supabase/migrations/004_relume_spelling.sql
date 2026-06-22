-- Use lowercase relume (not Relume) in seeded observations.

update public.form_observations
set content = replace(content, 'Relume', 'relume')
where content like '%Relume%';
