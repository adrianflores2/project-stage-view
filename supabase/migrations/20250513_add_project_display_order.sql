
-- Add display_order column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Set initial display order for existing projects
UPDATE projects
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM projects
) as subquery
WHERE projects.id = subquery.id;
