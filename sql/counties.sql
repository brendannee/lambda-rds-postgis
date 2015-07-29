SELECT
  counties.name as county,
  states.name as state,
  counties.geoid as id

FROM
  counties,
  states

WHERE
  counties.statefp = states.statefp AND
  ST_Intersects (ST_GeographyFromText($1), counties.geom);
