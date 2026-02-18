/*
  # Add GeoJSON boundary storage

  - Add boundary_geojson column
  - Backfill from boundary_path
*/

ALTER TABLE public.fields
  ADD COLUMN IF NOT EXISTS boundary_geojson jsonb;

WITH coords AS (
  SELECT
    f.id,
    jsonb_agg(jsonb_build_array((p->>'lng')::numeric, (p->>'lat')::numeric)) AS coords
  FROM public.fields f,
    jsonb_array_elements(f.boundary_path) AS p
  WHERE f.boundary_path IS NOT NULL
    AND jsonb_array_length(f.boundary_path) > 0
  GROUP BY f.id
),
closed AS (
  SELECT
    id,
    CASE
      WHEN coords->0 = coords->-1 THEN coords
      ELSE coords || jsonb_build_array(coords->0)
    END AS closed_coords
  FROM coords
)
UPDATE public.fields f
SET boundary_geojson = jsonb_build_object(
  'type', 'Polygon',
  'coordinates', jsonb_build_array(closed.closed_coords)
)
FROM closed
WHERE f.id = closed.id
  AND f.boundary_geojson IS NULL;
