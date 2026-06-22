-- Reference stack + owned-clone context (Monday, Relume, Mobbin, etc.)

insert into public.form_observations (entity_id, content, source)
select e.id, o.content, 'seed-v3'
from public.form_entities e
cross join lateral (
  values
    (
      'Form Platforms',
      'Reference products: Monday.com (workflows), Relume (AI site builder), Mobbin (UI patterns).'
    ),
    (
      'Form Platforms',
      'Owned Form alternatives: wispr-clone, relume-clone, quiver-clone, Brand Studio — one shared brain on form-memory.'
    ),
    (
      'Don',
      'Uses Monday.com, Relume, and Mobbin as benchmarks when building owned Form infrastructure.'
    )
) as o(entity_name, content)
where e.workspace_id = '00000000-0000-4000-8000-000000000001'
  and e.name = o.entity_name;
